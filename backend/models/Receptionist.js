const mongoose = require('mongoose');

const ReceptionistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Receptionist', ReceptionistSchema);