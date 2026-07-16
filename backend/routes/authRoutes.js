const express = require('express');
const router = express.Router();
const { registerPatient, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register-patient', registerPatient);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;