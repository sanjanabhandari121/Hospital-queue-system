const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAnalytics,
  createHospital,
  getAllHospitals,
  createDepartment,
  getDepartmentsByHospital,
  createDoctor,
  getAllDoctors,
  createReceptionist,
  getAllReceptionists,
  getAllPatients,
  getAppointmentsByPatient
} = require('../controllers/adminController');

router.use(protect);

// Public to all logged-in roles
router.get('/hospitals', getAllHospitals);
router.get('/departments/:hospitalId', getDepartmentsByHospital);
router.get('/doctors', getAllDoctors);
router.get('/patients', getAllPatients);
router.get('/appointments', getAppointmentsByPatient);

// Admin only
router.use(authorize('Admin'));
router.get('/analytics', getAnalytics);
router.post('/hospitals', createHospital);
router.post('/departments', createDepartment);
router.post('/doctors', createDoctor);
router.post('/receptionists', createReceptionist);
router.get('/receptionists', getAllReceptionists);

module.exports = router;