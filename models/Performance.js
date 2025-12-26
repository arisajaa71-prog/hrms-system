const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Links this review to an Employee
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true
  },
  reviewDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Performance', PerformanceSchema);