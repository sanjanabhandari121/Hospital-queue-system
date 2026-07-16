const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Receptionist = require('../models/Receptionist');
const queueService = require('../services/queueService');

exports.registerWalkInAndBook = async (req, res) => {
  try {
    const { name, email, phone, gender, age, bloodGroup, doctorId, departmentId, dateStr, symptoms, isEmergency } = req.body;
    
    const staff = await Receptionist.findOne({ user: req.user._id });
    if (!staff) return res.status(403).json({ success: false, error: 'Action requires Receptionist association context' });

    let userNode = await User.findOne({ email });
    let patientNode;

    if (!userNode) {
      const backupPass = Math.random().toString(36).slice(-8);
      userNode = await User.create({ name, email, phone, password: backupPass, role: 'Patient' });
      patientNode = await Patient.create({ user: userNode._id, gender, age, bloodGroup });
    } else {
      patientNode = await Patient.findOne({ user: userNode._id });
      if (!patientNode) {
        patientNode = await Patient.create({ user: userNode._id, gender, age, bloodGroup });
      }
    }

    const targetDate = new Date(dateStr);
    targetDate.setUTCHours(0, 0, 0, 0);

    let queue = await Queue.findOne({ doctor: doctorId, date: targetDate });
    if (!queue) {
      queue = await Queue.create({ doctor: doctorId, date: targetDate, appointments: [] });
    }

    const freshToken = queue.appointments.length + 1;

    const newApt = await Appointment.create({
      patient: patientNode._id,
      doctor: doctorId,
      hospital: staff.hospital,
      department: departmentId,
      date: targetDate,
      tokenNumber: freshToken,
      status: 'Scheduled',
      isEmergency: !!isEmergency,
      symptoms
    });

    if (isEmergency) {
      let insertPos = 0;
      const loadedQueue = await Queue.findOne({ doctor: doctorId, date: targetDate }).populate('appointments');
      if (loadedQueue) {
        let countServingOrEmergencies = 0;
        for (let item of loadedQueue.appointments) {
          if (item.status === 'Serving' || (item.isEmergency && item.status === 'Scheduled')) {
            countServingOrEmergencies++;
          }
        }
        insertPos = countServingOrEmergencies;
      }
      queue.appointments.splice(insertPos, 0, newApt._id);
    } else {
      queue.appointments.push(newApt._id);
    }

    await queue.save();

    const liveData = await queueService.getLiveQueueState(doctorId, targetDate.toISOString());
    queueService.emitQueueUpdate(doctorId, liveData);
    
    if (liveData && liveData.waitingList) {
      await queueService.alertUpcomingPatients(liveData.waitingList);
    }

    res.status(201).json({ success: true, data: newApt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    const matchedUsers = await User.find({
      role: 'Patient',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id');

    const ids = matchedUsers.map(u => u._id);
    const elements = await Patient.find({ user: { $in: ids } }).populate('user', '-password');
    res.status(200).json({ success: true, data: elements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.modifyAppointment = async (req, res) => {
  try {
    const { status, symptoms } = req.body;
    const node = await Appointment.findById(req.params.id);
    if (!node) return res.status(404).json({ success: false, error: 'Appointment targeted not found' });

    if (status) node.status = status;
    if (symptoms !== undefined) node.symptoms = symptoms;
    await node.save();

    const state = await queueService.getLiveQueueState(node.doctor, node.date.toISOString());
    queueService.emitQueueUpdate(node.doctor, state);

    res.status(200).json({ success: true, data: node });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const node = await Appointment.findById(req.params.id);
    if (!node) return res.status(404).json({ success: false, error: 'Appointment not found' });

    node.status = 'Cancelled';
    await node.save();

    await Queue.updateOne(
      { doctor: node.doctor, date: node.date },
      { $pull: { appointments: node._id } }
    );

    const state = await queueService.getLiveQueueState(node.doctor, node.date.toISOString());
    queueService.emitQueueUpdate(node.doctor, state);

    res.status(200).json({ success: true, data: node });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.removePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const appointments = await Appointment.find({ patient: patient._id, status: { $in: ['Scheduled', 'Serving'] } });
    for (const apt of appointments) {
      apt.status = 'Cancelled';
      await apt.save();
      await Queue.updateOne(
        { doctor: apt.doctor, date: apt.date },
        { $pull: { appointments: apt._id } }
      );
      const state = await queueService.getLiveQueueState(apt.doctor, apt.date.toISOString());
      queueService.emitQueueUpdate(apt.doctor, state);
    }

    await Appointment.deleteMany({ patient: patient._id });
    await User.findByIdAndDelete(patient.user);
    await Patient.findByIdAndDelete(patient._id);

    res.status(200).json({ success: true, message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};