const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  date: { type: Date, required: true },
  tokenNumber: { type: Number, required: true },
  status: { type: String, enum: ['Scheduled', 'Serving', 'Completed', 'Skipped', 'Cancelled'], default: 'Scheduled' },
  isEmergency: { type: Boolean, default: false },
  symptoms: { type: String },
  diagnosis: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);