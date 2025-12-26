const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', 
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: [
        'Sick Leave', 'Casual Leave', 'Annual Leave', 
        'Annual', 'Sick', 'Casual',                   
        'Lieu Day', 'Comp Off', 'Unpaid', 'Unpaid Leave' 
    ]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  attachment: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'Pending',
    // --- FIX: ADD 'Cancelled' TO THIS LIST ---
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'] 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Leave', LeaveSchema);