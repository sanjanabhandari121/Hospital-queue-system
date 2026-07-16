const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerWalkInAndBook,
  searchPatients,
  modifyAppointment,
  cancelAppointment,
  removePatient
} = require('../controllers/receptionistController');

router.use(protect);
router.use(authorize('Receptionist'));

router.post('/walk-in-booking', registerWalkInAndBook);
router.get('/patients/search', searchPatients);
router.put('/appointments/:id', modifyAppointment);
router.delete('/appointments/:id', cancelAppointment);
router.delete('/patients/:id', removePatient);

module.exports = router;