const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const queueService = require('../services/queueService');

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, hospitalId, departmentId, dateStr, symptoms } = req.body;
    
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile matching user session not found' });

    const targetDate = new Date(dateStr);
    targetDate.setUTCHours(0, 0, 0, 0);

    const doctorProfile = await Doctor.findById(doctorId);
    if (!doctorProfile) return res.status(404).json({ success: false, error: 'Doctor not found' });

    if (doctorProfile.isOnLeave || !doctorProfile.isAvailable) {
      return res.status(400).json({ success: false, error: 'Doctor is currently unavailable or on leave.' });
    }

    const dayOfWeek = targetDate.getUTCDay();
    if (!doctorProfile.workingDays.includes(dayOfWeek)) {
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      return res.status(400).json({ success: false, error: `Doctor does not work on ${dayNames[dayOfWeek]}s.` });
    }

    const existingCount = await Appointment.countDocuments({
      doctor: doctorId,
      date: targetDate,
      status: { $in: ['Scheduled', 'Serving'] }
    });
    if (existingCount >= doctorProfile.maxPatientsPerDay) {
      return res.status(400).json({ success: false, error: `Doctor's slots are fully booked for this day (max ${doctorProfile.maxPatientsPerDay} patients).` });
    }

    let queue = await Queue.findOne({ doctor: doctorId, date: targetDate });
    if (!queue) {
      queue = await Queue.create({ doctor: doctorId, date: targetDate, appointments: [] });
    }

    const token = queue.appointments.length + 1;

    const apt = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      hospital: hospitalId,
      department: departmentId,
      date: targetDate,
      tokenNumber: token,
      status: 'Scheduled',
      isEmergency: false,
      symptoms
    });

    queue.appointments.push(apt._id);
    await queue.save();

    const updateLive = await queueService.getLiveQueueState(doctorId, targetDate.toISOString());
    queueService.emitQueueUpdate(doctorId, updateLive);

    res.status(201).json({ success: true, data: apt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPatientLiveState = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found' });

    const activeApts = await Appointment.find({ patient: patient._id, status: { $in: ['Scheduled', 'Serving', 'Skipped'] } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('hospital')
      .populate('department');

    const statusList = [];
    for (let apt of activeApts) {
      const liveData = await queueService.getLiveQueueState(apt.doctor._id, apt.date.toISOString());
      if (!liveData) continue;

      let position = -1;
      let estWait = 0;
      
      if (apt.status === 'Serving') {
        position = 0;
        estWait = 0;
      } else {
        const matchIdx = liveData.waitingList.findIndex(x => x.appointmentId.toString() === apt._id.toString());
        if (matchIdx !== -1) {
          position = matchIdx + 1;
          estWait = liveData.waitingList[matchIdx].estimatedWaitMinutes;
        }
      }

      statusList.push({
        appointmentId: apt._id,
        doctorName: apt.doctor.user.name,
        hospitalName: apt.hospital.name,
        departmentName: apt.department.name,
        tokenNumber: apt.tokenNumber,
        status: apt.status,
        queuePosition: position,
        estimatedWaitMinutes: estWait,
        liveMetrics: liveData.stats
      });
    }

    res.status(200).json({ success: true, data: statusList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient profile not found' });

    const records = await Appointment.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('hospital')
      .populate('department')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ success: false, error: 'Appointment structural node not found' });

    apt.status = 'Cancelled';
    await apt.save();

    const liveData = await queueService.getLiveQueueState(apt.doctor, apt.date.toISOString());
    queueService.emitQueueUpdate(apt.doctor, liveData);

    res.status(200).json({ success: true, message: 'Appointment successfully cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const records = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};