const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  specialization: { type: String, required: true },
  avgConsultationTimeMinutes: { type: Number, default: 15 },
  isAvailable: { type: Boolean, default: true },
  isOnLeave: { type: Boolean, default: false },
  queuePaused: { type: Boolean, default: false },
  maxPatientsPerDay: { type: Number, default: 30 },
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
  slotPreference: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Full Day'], default: 'Full Day' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);