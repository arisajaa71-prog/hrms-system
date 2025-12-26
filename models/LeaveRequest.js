const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true }, // Ideally links to Employee ID
  name: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending' } // Pending, Approved, Rejected
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);