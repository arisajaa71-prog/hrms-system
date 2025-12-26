const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load Env Variables
dotenv.config();

// Load Models
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const Leave = require('./models/Leave'); // Leave Balances
const Performance = require('./models/Performance');
const Training = require('./models/Training');
const Announcement = require('./models/Announcement');

const resetDb = async () => {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 MongoDB Connected...');

        // 2. Find The Owner (YOU)
        // We find by name to be safe. You can also use email.
        const owner = await Employee.findOne({ 
            firstName: 'Ari', 
            lastName: 'Arianto' 
        });

        if (!owner) {
            console.error('❌ CRITICAL ERROR: Owner "Ari Arianto" not found! Aborting reset to prevent total lockout.');
            process.exit(1);
        }

        console.log(`✅ Owner Identified: ${owner.firstName} ${owner.lastName} (${owner.email})`);
        console.log('⏳ Starting System Wipe...');

        // 3. Delete All Other Employees
        const empResult = await Employee.deleteMany({ _id: { $ne: owner._id } });
        console.log(`🗑️  Deleted ${empResult.deletedCount} Employees (Kept Owner).`);

        // 4. Wipe Transactional Data (History)
        // We delete EVERYTHING here (including your history) so the dashboard is clean.
        
        await Payroll.deleteMany({});
        console.log('🗑️  Payroll History: Cleared');

        await Attendance.deleteMany({});
        console.log('🗑️  Attendance History: Cleared');

        await LeaveRequest.deleteMany({});
        console.log('🗑️  Leave Requests: Cleared');
        
        await Performance.deleteMany({});
        console.log('🗑️  Performance Reviews: Cleared');

        await Training.deleteMany({});
        console.log('🗑️  Training Records: Cleared');

        await Announcement.deleteMany({});
        console.log('🗑️  Announcements: Cleared');

        // 5. Reset Leave Balances (Optional)
        // If you store balances in a separate table, clear them except for owner
        await Leave.deleteMany({ employee: { $ne: owner._id } });
        console.log('🗑️  Leave Balances: Cleared (others)');

        // 6. Optional: Reset Owner's specific fields if needed
        // e.g. Clear his chat history or notifications if you have those models

        console.log('------------------------------------------------');
        console.log('✨ SYSTEM RESET COMPLETE ✨');
        console.log('You are the only survivor.');
        console.log('------------------------------------------------');

        process.exit();

    } catch (err) {
        console.error('❌ Error during reset:', err);
        process.exit(1);
    }
};

resetDb();