// models/User.js (Update this existing file)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ... keep your existing name, email, password, role ...
  
  // NEW FIELDS FOR SHIFT MANAGEMENT
  workShift: {
    type: String,
    enum: ['Morning', 'Evening', 'Normal'], 
    default: 'Normal' // Default to 9-5
  },
  // We can store shift times directly here or in a config file. 
  // For simplicity, we will handle the logic in the Controller based on the name above.

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);