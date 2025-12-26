const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, default: 'Head Office' },
  type: { type: String, enum: ['Full Time', 'Part Time', 'Contract'], default: 'Full Time' },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema);