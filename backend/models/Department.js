const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  description: { type: String }
}, { timestamps: true });

DepartmentSchema.index({ name: 1, hospital: 1 }, { unique: true });

module.exports = mongoose.model('Department', DepartmentSchema);