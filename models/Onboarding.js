const mongoose = require('mongoose');

const OnboardingSchema = new mongoose.Schema({
  // --- 1. OFFER DETAILS ---
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  joiningDate: { type: Date, required: true },
  offerSalary: { type: Number, default: 0 },
  workLocation: { type: String, default: 'Head Office' },

  // --- 2. CANDIDATE INPUTS ---
  dob: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: { type: String },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  
  // --- 3. BANK DETAILS ---
  bankDetails: {
    bankName: String,
    accountNumber: String,
    iban: String,
    swiftCode: String
  },

  // --- 4. DOCUMENTS ---
  documents: {
    passport: String,
    nationalId: String,
    resume: String,
    contract: String
  },

  // --- 5. NEW: INTERNAL CHECKLIST (HR Tasks) ---
  checklist: {
    itSetup: { type: Boolean, default: false },       // Laptop/Email
    accessCard: { type: Boolean, default: false },    // Physical access
    contractSigned: { type: Boolean, default: false },// HR signed it
    orientationScheduled: { type: Boolean, default: false }, // Calendar invite
    welcomeKit: { type: Boolean, default: false }     // Swag/Notebooks
  },

  // --- 6. PROCESS TRACKING ---
  status: {
    type: String,
    enum: ['Initiated', 'Pending Candidate', 'Reviewing', 'Completed'],
    default: 'Initiated'
  },
  accessCode: { type: String, required: true }, 

}, { timestamps: true });

module.exports = mongoose.model('Onboarding', OnboardingSchema);