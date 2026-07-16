const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  currentServingIndex: { type: Number, default: -1 }
}, { timestamps: true });

QueueSchema.index({ doctor: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Queue', QueueSchema);