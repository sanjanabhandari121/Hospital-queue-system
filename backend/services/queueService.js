const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

let ioInstance = null;

const setIoInstance = (io) => {
  ioInstance = io;
};

const getMailTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
};

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = getMailTransporter();
    if (!transporter || !to) return;
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
};

const emitQueueUpdate = (doctorId, liveState) => {
  if (ioInstance) {
    ioInstance.to(`doctor:${doctorId}`).emit('queueUpdated', liveState);
  }
};

const sendLiveNotification = (userId, title, message) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notificationReceived', { title, message, createdAt: new Date() });
  }
};

const getLiveQueueState = async (doctorId, dateString) => {
  const targetDate = new Date(dateString);
  targetDate.setUTCHours(0, 0, 0, 0);

  const doctorData = await Doctor.findById(doctorId);
  if (!doctorData) return null;

  const queue = await Queue.findOne({ doctor: doctorId, date: targetDate })
    .populate({
      path: 'appointments',
      populate: { path: 'patient', populate: { path: 'user', select: 'name phone' } }
    });

  if (!queue) {
    return {
      doctorId,
      date: targetDate,
      currentPatient: null,
      nextPatient: null,
      waitingList: [],
      stats: { total: 0, served: 0, waiting: 0, avgTime: doctorData.avgConsultationTimeMinutes }
    };
  }

  const list = [];
  let currentPatient = null;
  let nextPatient = null;
  let servedCount = 0;
  let waitingCount = 0;

  let trackingIndex = 0;
  for (let i = 0; i < queue.appointments.length; i++) {
    const apt = queue.appointments[i];
    if (apt.status === 'Completed' || apt.status === 'Cancelled') {
      if (apt.status === 'Completed') servedCount++;
      continue;
    }

    if (apt.status === 'Serving') {
      currentPatient = {
        appointmentId: apt._id,
        tokenNumber: apt.tokenNumber,
        name: apt.patient.user.name,
        isEmergency: apt.isEmergency,
        symptoms: apt.symptoms || ''
      };
      continue;
    }

    const estWait = trackingIndex * doctorData.avgConsultationTimeMinutes;
    const mappedNode = {
      appointmentId: apt._id,
      patientId: apt.patient._id,
      userId: apt.patient.user._id,
      tokenNumber: apt.tokenNumber,
      name: apt.patient.user.name,
      isEmergency: apt.isEmergency,
      status: apt.status,
      estimatedWaitMinutes: estWait
    };

    if (apt.status === 'Scheduled') {
      waitingCount++;
      if (!nextPatient) {
        nextPatient = mappedNode;
      }
      list.push(mappedNode);
      trackingIndex++;
    } else if (apt.status === 'Skipped') {
      list.push(mappedNode);
      trackingIndex++;
    }
  }

  return {
    doctorId,
    date: targetDate,
    currentPatient,
    nextPatient,
    waitingList: list,
    stats: {
      total: queue.appointments.length,
      served: servedCount,
      waiting: waitingCount,
      avgTime: doctorData.avgConsultationTimeMinutes
    }
  };
};

const pushNotification = async (userId, title, message) => {
  await Notification.create({ user: userId, title, message });
  sendLiveNotification(userId, title, message);
  // Send email too
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('email name');
    if (user && user.email) {
      await sendEmail(user.email, title, `Hi ${user.name},\n\n${message}\n\n— Hospital Queue System`);
    }
  } catch (e) {}
};

const alertUpcomingPatients = async (waitingList) => {
  if (waitingList.length > 0) {
    const first = waitingList[0];
    await pushNotification(first.userId, "Your turn is next!", `Please proceed immediately to the doctor chamber. Your token code is ${first.tokenNumber}.`);
  }
  if (waitingList.length > 1) {
    const second = waitingList[1];
    await pushNotification(second.userId, "Appointment Alert", `Only 1 patient ahead of you. Estimated wait time is approximately ${second.estimatedWaitMinutes} minutes.`);
  }
};

module.exports = {
  setIoInstance,
  emitQueueUpdate,
  getLiveQueueState,
  pushNotification,
  alertUpcomingPatients
};