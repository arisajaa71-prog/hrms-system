const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Load Models
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');

const restoreDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected for Restore...');

        const backupDir = path.join(__dirname, 'backup_data');
        
        const collections = [
            { name: 'employees', model: Employee },
            { name: 'payrolls', model: Payroll },
            { name: 'attendances', model: Attendance },
            { name: 'leaverequests', model: LeaveRequest }
        ];

        for (const col of collections) {
            const filePath = path.join(backupDir, `${col.name}.json`);
            if (fs.existsSync(filePath)) {
                console.log(`♻️  Restoring ${col.name}...`);
                const rawData = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(rawData);
                
                // 1. Clear current data
                await col.model.deleteMany({});
                
                // 2. Insert Backup WITHOUT VALIDATION checks
                if (data.length > 0) {
                    await col.model.insertMany(data, { 
                        validateBeforeSave: false, // <--- THE FIX
                        ordered: false 
                    });
                }
            }
        }

        console.log('✅ System Restored Successfully.');
        process.exit();

    } catch (err) {
        console.error('❌ Restore Failed:', err);
        process.exit(1);
    }
};

restoreDb();