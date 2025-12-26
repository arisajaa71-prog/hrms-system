const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 1. Force Load Env
dotenv.config(); 

// 2. Import Models
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');

const backupDb = async () => {
    try {
        console.log('🔄 Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 3. Define & Print Path
        const backupDir = path.join(__dirname, 'backup_data');
        console.log(`📂 Target Folder: ${backupDir}`);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
            console.log('✨ Created backup_data folder.');
        }

        const collections = [
            { name: 'employees', model: Employee },
            { name: 'payrolls', model: Payroll },
            { name: 'attendances', model: Attendance },
            { name: 'leaverequests', model: LeaveRequest }
        ];

        let totalRecords = 0;

        for (const col of collections) {
            const data = await col.model.find({});
            const filePath = path.join(backupDir, `${col.name}.json`);
            
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`📄 Saved ${col.name}.json (${data.length} records)`);
            totalRecords += data.length;
        }

        console.log(`\n✅ BACKUP SUCCESSFUL! Saved ${totalRecords} records total.`);
        console.log(`👉 Check this folder: ${backupDir}`);
        
        process.exit();

    } catch (err) {
        console.error('❌ BACKUP FAILED:', err.message);
        process.exit(1);
    }
};

backupDb();