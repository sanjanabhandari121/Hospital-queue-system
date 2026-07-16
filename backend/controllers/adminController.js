const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

exports.getAnalytics = async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalReceptionists = await Receptionist.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    const servedCount = await Appointment.countDocuments({ status: 'Completed' });
    const pendingCount = await Appointment.countDocuments({ status: 'Scheduled' });
    const emergencyCount = await Appointment.countDocuments({ isEmergency: true });
    const cancelledCount = await Appointment.countDocuments({ status: 'Cancelled' });

    // Daily volume for last 7 days
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const dailyRaw = await Appointment.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: today } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);

    // Busiest departments
    const deptRaw = await Appointment.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', count: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: { totalHospitals, totalDepartments, totalDoctors, totalReceptionists, totalPatients, totalAppointments },
        queueMetrics: { servedCount, pendingCount, emergencyCount, cancelledCount },
        dailyVolume: dailyRaw,
        busiestDepartments: deptRaw
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const hospital = await Hospital.create({ name, address, phone });
    res.status(201).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.status(200).json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, hospitalId, description } = req.body;
    const dept = await Department.create({ name, hospital: hospitalId, description });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDepartmentsByHospital = async (req, res) => {
  try {
    const depts = await Department.find({ hospital: req.params.hospitalId });
    res.status(200).json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const { name, email, password, phone, hospitalId, departmentId, specialization, avgConsultationTimeMinutes } = req.body;
    const user = await User.create({ name, email, password, phone, role: 'Doctor' });
    const doc = await Doctor.create({
      user: user._id,
      hospital: hospitalId,
      department: departmentId,
      specialization,
      avgConsultationTimeMinutes: avgConsultationTimeMinutes || 15
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('user', '-password').populate('hospital').populate('department');
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createReceptionist = async (req, res) => {
  try {
    const { name, email, password, phone, hospitalId } = req.body;
    const user = await User.create({ name, email, password, phone, role: 'Receptionist' });
    const recep = await Receptionist.create({ user: user._id, hospital: hospitalId });
    res.status(201).json({ success: true, data: recep });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllReceptionists = async (req, res) => {
  try {
    const staff = await Receptionist.find().populate('user', '-password').populate('hospital');
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate('user', '-password');
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = patientId ? { patient: patientId } : {};
    const appointments = await Appointment.find(filter)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};