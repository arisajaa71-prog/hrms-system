const mongoose = require('mongoose');

const PasswordRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String }, 
  status: { 
    type: String, 
    enum: ['Pending', 'Resolved'], 
    default: 'Pending' 
  },
  requestDate: { type: Date, default: Date.now },
  // --- NEW FIELDS FOR HISTORY ---
  resolvedAt: { type: Date },
  adminNote: { type: String } // e.g., "Reset to Welcome2025"
});

module.exports = mongoose.model('PasswordRequest', PasswordRequestSchema);