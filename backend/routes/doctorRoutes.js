const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctorProfile,
  getQueueState,
  changeAverageConsultationTime,
  advanceQueueOperation,
  getWeeklySchedule,
  saveDiagnosis,
  updateAvailabilitySettings,
  toggleLeave,
  toggleQueuePause
} = require('../controllers/doctorController');

router.use(protect);
router.use(authorize('Doctor'));

router.get('/profile', getDoctorProfile);
router.get('/queue/live', getQueueState);
router.put('/config/time', changeAverageConsultationTime);
router.post('/queue/action', advanceQueueOperation);
router.get('/schedule/week', getWeeklySchedule);
router.put('/appointment/diagnosis', saveDiagnosis);
router.put('/config/availability', updateAvailabilitySettings);
router.post('/config/toggle-leave', toggleLeave);
router.post('/config/toggle-pause', toggleQueuePause);

module.exports = router;