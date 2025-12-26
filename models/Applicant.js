const mongoose = require('mongoose');

const ApplicantSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  resume: { type: String }, // Path to file
  
  // RECRUITMENT STAGES
  stage: { 
    type: String, 
    enum: ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'], 
    default: 'New' 
  },
  
  notes: { type: String },
  appliedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Applicant', ApplicantSchema);