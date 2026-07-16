const Doctor = require('../models/Doctor');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const queueService = require('../services/queueService');

exports.getDoctorProfile = async (req, res) => {
  try {
    const profile = await Doctor.findOne({ user: req.user._id }).populate('hospital').populate('department');
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQueueState = async (req, res) => {
  try {
    const { dateStr } = req.query;
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile context not found' });

    const state = await queueService.getLiveQueueState(profile._id, dateStr);
    res.status(200).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.changeAverageConsultationTime = async (req, res) => {
  try {
    const { minutes } = req.body;
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile context not found' });

    profile.avgConsultationTimeMinutes = Number(minutes);
    await profile.save();

    const todayStr = new Date().toISOString();
    const state = await queueService.getLiveQueueState(profile._id, todayStr);
    queueService.emitQueueUpdate(profile._id, state);

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.advanceQueueOperation = async (req, res) => {
  try {
    const { action, appointmentId, dateStr } = req.body;
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor target profile missing' });

    const targetDate = new Date(dateStr);
    targetDate.setUTCHours(0, 0, 0, 0);

    const targetApt = await Appointment.findById(appointmentId);
    if (!targetApt) return res.status(404).json({ success: false, error: 'Target appointment reference node missing' });

    if (action === 'CALL_NEXT') {
      await Appointment.updateMany(
        { doctor: profile._id, date: targetDate, status: 'Serving' },
        { status: 'Completed' }
      );
      targetApt.status = 'Serving';
      await targetApt.save();

      await queueService.pushNotification(
        await getUserIdFromPatient(targetApt.patient),
        "It's your turn!",
        "Please step into the consultation room immediately."
      );
    } else if (action === 'SKIP') {
      targetApt.status = 'Skipped';
      await targetApt.save();
    } else if (action === 'COMPLETE') {
      targetApt.status = 'Completed';
      await targetApt.save();
    }

    const state = await queueService.getLiveQueueState(profile._id, dateStr);
    queueService.emitQueueUpdate(profile._id, state);
    
    if (state && state.waitingList) {
      await queueService.alertUpcomingPatients(state.waitingList);
    }

    res.status(200).json({ success: true, data: state });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWeeklySchedule = async (req, res) => {
  try {
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile not found' });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: profile._id,
      date: { $gte: today, $lte: weekEnd }
    })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name phone' } })
      .sort({ date: 1, tokenNumber: 1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.saveDiagnosis = async (req, res) => {
  try {
    const { appointmentId, diagnosis } = req.body;
    const profile = await Doctor.findOne({ user: req.user._id });
    const apt = await Appointment.findOne({ _id: appointmentId, doctor: profile._id });
    if (!apt) return res.status(404).json({ success: false, error: 'Appointment not found' });

    apt.diagnosis = diagnosis;
    await apt.save();
    res.status(200).json({ success: true, data: apt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAvailabilitySettings = async (req, res) => {
  try {
    const { workingDays, maxPatientsPerDay, slotPreference } = req.body;
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile not found' });

    if (workingDays !== undefined) profile.workingDays = workingDays;
    if (maxPatientsPerDay !== undefined) profile.maxPatientsPerDay = Number(maxPatientsPerDay);
    if (slotPreference !== undefined) profile.slotPreference = slotPreference;
    await profile.save();

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleLeave = async (req, res) => {
  try {
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile not found' });

    profile.isOnLeave = !profile.isOnLeave;
    profile.isAvailable = !profile.isOnLeave;
    await profile.save();

    if (profile.isOnLeave) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const affectedApts = await Appointment.find({ doctor: profile._id, date: today, status: 'Scheduled' })
        .populate({ path: 'patient', populate: { path: 'user', select: 'name' } });

      for (const apt of affectedApts) {
        apt.status = 'Cancelled';
        await apt.save();
        await Queue.updateOne({ doctor: profile._id, date: today }, { $pull: { appointments: apt._id } });
        await queueService.pushNotification(
          apt.patient.user._id,
          'Appointment Cancelled — Doctor on Leave',
          `Your appointment (Token #${apt.tokenNumber}) has been cancelled as the doctor is unavailable today. Please rebook.`
        );
      }
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleQueuePause = async (req, res) => {
  try {
    const profile = await Doctor.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, error: 'Doctor profile not found' });

    profile.queuePaused = !profile.queuePaused;
    await profile.save();

    const todayStr = new Date().toISOString();
    const state = await queueService.getLiveQueueState(profile._id, todayStr);
    queueService.emitQueueUpdate(profile._id, { ...state, queuePaused: profile.queuePaused });

    res.status(200).json({ success: true, data: { queuePaused: profile.queuePaused } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function getUserIdFromPatient(patientId) {
  const Patient = require('../models/Patient');
  const p = await Patient.findById(patientId);
  return p ? p.user : null;
}