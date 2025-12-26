const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Work Email
  password: { type: String, required: true },
  
  // --- JOB DETAILS ---
  department: { type: String, required: true },
  designation: { type: String, required: true }, // "Job Title"
  workLocation: { type: String, default: 'Head Office' }, 
  
  role: { 
    type: String, 
    enum: ['Owner', 'Senior Admin', 'Admin', 'Employee'],
    default: 'Employee' 
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', 
    default: null
  },
  joiningDate: { type: Date, default: Date.now },
  workShift: {
    type: String,
    enum: ['Morning', 'Evening', 'Normal'], 
    default: 'Normal' 
  },

  // --- UAE PAYROLL STRUCTURE ---
  // We keep 'salary' as "Total Gross" for easy display, 
  // but logic will use 'salaryDetails' for calculations.
  salary: { type: Number, default: 0 }, 
  
  salaryDetails: {
    basic: { type: Number, default: 0 },      // Vital for Gratuity/OT
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    telecom: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // --- WPS & BANK DETAILS ---
  bankDetails: {
    bankName: { type: String, default: '' },
    iban: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    wpsId: { type: String, default: '' } // Labour Card ID / Personal ID
  },

  // --- JOB HISTORY (For Promotions) ---
  jobHistory: [{
    title: { type: String },
    department: { type: String },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    location: { type: String },
    startDate: { type: Date },
    endDate: { type: Date }
  }],

  // --- PERSONAL DETAILS (Extended) ---
  profilePicture: { type: String, default: '' },
  dob: { type: Date }, 
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', ''], default: '' },
  nationality: { type: String, default: '' },
  citizenship1: { type: String, default: '' },
  citizenship2: { type: String, default: '' },

  // --- [NEW] PERMANENT DOCUMENT STORAGE ---
  // Stores file paths transferred from Onboarding
  documents: {
    passport: { type: String, default: '' },
    nationalId: { type: String, default: '' },
    resume: { type: String, default: '' },
    contract: { type: String, default: '' }
  },

  // --- ADDRESS DETAILS (Detailed) ---
  address: { type: String }, 
  street1: { type: String, default: '' },
  street2: { type: String, default: '' },
  city: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: '' },

  // --- CONTACT DETAILS (Extended) ---
  mobile: { type: String }, 
  workPhone: { type: String, default: '' },
  extension: { type: String, default: '' },
  homePhone: { type: String, default: '' },
  personalEmail: { type: String, default: '' },

  // --- LEAVE BALANCE WALLET ---
  leaveBalance: {
    annual: { type: Number, default: 22 }, 
    lieu: { type: Number, default: 0 },    
    compOff: { type: Number, default: 0 }, 
    sick: { type: Number, default: 15 }    
  },

  // --- SECURITY FIELDS ---
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Employee', EmployeeSchema);