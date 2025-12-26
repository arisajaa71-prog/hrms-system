const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Links to the Employee getting paid
    required: true
  },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  
  // Fixed Components (Snapshot at time of generation)
  basic: { type: Number, default: 0 },
  housing: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  otherAllowances: { type: Number, default: 0 },
  
  // Input Data (The variables you type in)
  inputData: {
    overtimeNormalHours: { type: Number, default: 0 },
    overtimeNightHours: { type: Number, default: 0 },
    overtimeHolidayHours: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    loanDeductionAmount: { type: Number, default: 0 },
    arrearsAmount: { type: Number, default: 0 } // Stores the input value
  },

  // Totals (The calculated results)
  totals: {
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    arrears: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    gross: { type: Number, default: 0 }
  },

  daysWorked: { type: Number, default: 30 },
  netSalary: { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'Paid'],
    default: 'Draft'
  },
  
  // --- THE FIX IS HERE ---
  // We changed ref: 'User' to ref: 'Employee'
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee' 
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: { type: Date },

}, { timestamps: true });

// Prevent duplicate payrolls for the same employee in the same month
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);