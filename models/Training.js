const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema({
  employeeId: { type: String, required: true }, // Who is this for?
  courseName: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  status: { 
    type: String, 
    enum: ['Assigned', 'In Progress', 'Completed'], 
    default: 'Assigned' 
  },
  completionDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Training', TrainingSchema);