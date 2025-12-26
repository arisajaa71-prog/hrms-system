const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  // --- NEW FIELD (Standard) ---
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  // --- OLD FIELD (Legacy Support) ---
  // We keep this so old records are still readable
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  date: { type: Date, default: Date.now },
  clockIn: { type: Date },      // New format
  clockInTime: { type: Date },  // Old format support
  clockOut: { type: Date },     // New format
  clockOutTime: { type: Date }, // Old format support
  
  status: {
    type: String,
    enum: ['Present', 'Late', 'Half Day', 'Absent', 'On Leave'], 
    default: 'Present'
  },
  workHours: { type: Number, default: 0 },
  lateMinutes: { type: Number, default: 0 },
  isOvertime: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

// Index both fields for performance
AttendanceSchema.index({ employee: 1, date: 1 });
AttendanceSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);