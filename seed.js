const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error(err); process.exit(1); });

// --- FIXED PATHS HERE ---
// Removed "server/" because the models are in the root folder
const Employee = require('./models/Employee'); 
const Leave = require('./models/Leave');

const seedDB = async () => {
  try {
    await Employee.deleteMany({});
    await Leave.deleteMany({});
    console.log('🗑️  Cleaned old data...');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // 1. CREATE ADMIN (ARI)
    const seniorAdmin = new Employee({
      firstName: 'Arianto', lastName: 'Admin', email: 'arianto@company.com',
      password: password, role: 'Senior Admin',
      department: 'Management', designation: 'CEO', employeeId: 'SA001',
      dob: new Date('1985-01-01'), salary: 10000, mobile: '555-0001', address: '123 CEO Lane'
    });

    // 2. CREATE JOHN (With Birthday set to TODAY for testing)
    const today = new Date();
    // Create a date that is "Today" but in the year 1990
    const johnBirthday = new Date(1990, today.getMonth(), today.getDate());

    const employee = new Employee({
      firstName: 'John', lastName: 'Doe', email: 'john@company.com',
      password: password, role: 'Employee',
      department: 'IT', designation: 'Developer', employeeId: 'EM001',
      dob: johnBirthday, // <--- HAPPY BIRTHDAY JOHN!
      salary: 5000, mobile: '555-0002', address: '456 Developer St'
    });

    await seniorAdmin.save();
    const savedJohn = await employee.save();

    // 3. CREATE ACTIVE LEAVE (For "Who's Out" Widget)
    // Let's say John is on leave TODAY
    const leave = new Leave({
      employee: savedJohn._id,
      leaveType: 'Sick Leave',
      startDate: new Date(), // Starts Today
      endDate: new Date(new Date().setDate(new Date().getDate() + 2)), // Ends in 2 days
      reason: 'Flu',
      status: 'Approved'
    });

    await leave.save();

    console.log('✅ Database Reseeded with Profile Data & Active Events');
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();