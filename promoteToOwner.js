const mongoose = require('mongoose');
const dotenv = require('dotenv');

// --- FIX: Changed path from './server/models/Employee' to './models/Employee' ---
const Employee = require('./models/Employee'); 

dotenv.config();

const promote = async () => {
    try {
        console.log('🔌 Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        const email = 'arianto@company.com'; 
        
        // Update Role to Owner
        const res = await Employee.updateOne(
            { email: email }, 
            { $set: { role: 'Owner' } }
        );

        if (res.modifiedCount > 0) {
            console.log('-----------------------------------');
            console.log(`🎉 SUCCESS: ${email} is now an OWNER.`);
            console.log('-----------------------------------');
        } else {
            // If modifiedCount is 0, it means the user was found but the role was ALREADY 'Owner'
            // or the user wasn't found. We check specifically here:
            const user = await Employee.findOne({ email });
            if (user) {
                if (user.role === 'Owner') {
                    console.log(`info: User is ALREADY set to Owner.`);
                } else {
                    console.log(`⚠️ User found, but update failed for unknown reason.`);
                }
            } else {
                console.log(`❌ Error: User with email ${email} NOT FOUND.`);
            }
        }
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

promote();