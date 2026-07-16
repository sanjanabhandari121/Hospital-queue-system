const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  bookAppointment,
  getPatientLiveState,
  getPatientHistory,
  cancelAppointment,
  getNotifications
} = require('../controllers/patientController');

router.use(protect);
router.use(authorize('Patient'));

router.post('/appointments', bookAppointment);
router.get('/appointments/live', getPatientLiveState);
router.get('/appointments/history', getPatientHistory);
router.delete('/appointments/:id', cancelAppointment);
router.get('/notifications', getNotifications);

module.exports = router;