const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_for_hospital_queue_12345');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'User session no longer exists' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid token' });
    }
  }
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. Token missing' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Role '${req.user?.role || 'Guest'}' is unauthorized to view this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };