const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const jwt = require('jsonwebtoken');

const makeToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_for_hospital_queue_12345',
    { expiresIn: '1d' }
  );
};

exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, gender, age, bloodGroup } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email account registered already' });

    const user = await User.create({ name, email, password, phone, role: 'Patient' });
    const patient = await Patient.create({ user: user._id, gender, age, bloodGroup });

    res.status(201).json({
      success: true,
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid authentication credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid authentication credentials' });

    let extendedData = {};
    if (user.role === 'Patient') {
      extendedData = await Patient.findOne({ user: user._id });
    } else if (user.role === 'Doctor') {
      extendedData = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'Receptionist') {
      extendedData = await Receptionist.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      token: makeToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        meta: extendedData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    let extendedData = null;
    if (req.user.role === 'Patient') {
      extendedData = await Patient.findOne({ user: req.user._id });
    } else if (req.user.role === 'Doctor') {
      extendedData = await Doctor.findOne({ user: req.user._id });
    } else if (req.user.role === 'Receptionist') {
      extendedData = await Receptionist.findOne({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        meta: extendedData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};