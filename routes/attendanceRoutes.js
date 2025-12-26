const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const verifyToken = require('../middleware/authMiddleware'); 

// 1. GET STATUS (Preserved)
router.get('/status', verifyToken, attendanceController.getStatus);

// 2. GET HISTORY (Smart Admin + Missing Logic Restored)
router.get('/history', verifyToken, async (req, res) => {
    try {
        const { date, month, year } = req.query;
        
        // A. Fetch Current User
        const currentUser = await Employee.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ msg: "User not found" });

        // B. Define "Who Can I See?" (Employee Filter)
        let accessibleEmployeesQuery = {};

        // RULE 1: MASTER ACCESS (Owner, Senior Admin, OR HR Dept)
        if (currentUser.role === 'Owner' || currentUser.role === 'Senior Admin' || currentUser.department === 'Human Resources') {
            accessibleEmployeesQuery = { role: { $ne: 'Owner' } }; // See everyone (except Owner)
        }
        // RULE 2: Manager Admin (See Team + Self)
        else if (currentUser.role === 'Admin') {
            accessibleEmployeesQuery = { 
                $or: [{ reportsTo: currentUser._id }, { _id: currentUser._id }] 
            };
        }
        // RULE 3: Regular Employee (See Self Only)
        else {
            accessibleEmployeesQuery = { _id: currentUser._id };
        }

        // C. Fetch the List of Employees this user is allowed to see
        const accessibleEmployees = await Employee.find(accessibleEmployeesQuery).select('firstName lastName department role profilePicture');
        const accessibleIds = accessibleEmployees.map(e => e._id);

        // D. Build Date Query
        let dateQuery = {};
        if (date) {
            const start = new Date(date); start.setHours(0,0,0,0);
            const end = new Date(date); end.setHours(23,59,59,999);
            dateQuery.date = { $gte: start, $lte: end };
        } else if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            dateQuery.date = { $gte: start, $lte: end };
        }

        // E. Fetch Attendance Records for these employees
        // We look for EITHER 'employee' OR 'userId' to support old & new data
        const attendanceRecords = await Attendance.find({
            ...dateQuery,
            $or: [
                { employee: { $in: accessibleIds } },
                { userId: { $in: accessibleIds } }
            ]
        })
        .populate('employee', 'firstName lastName department designation employeeId profilePicture')
        .populate('userId', 'firstName lastName department designation employeeId profilePicture') // Populate legacy field
        .sort({ date: -1 });

        // F. Calculate "Missing" (Who hasn't clocked in?)
        // Only calculate if viewing a specific "Day"
        let missing = [];
        if (date) {
            const clockedInIds = attendanceRecords.map(r => (r.employee?._id || r.userId?._id || '').toString());
            
            missing = accessibleEmployees.filter(emp => {
                // Don't mark Owner as missing
                if (emp.role === 'Owner') return false;
                // Check if they are in the clockedIn list
                return !clockedInIds.includes(emp._id.toString());
            });
        }

        // Return the structure the Frontend expects
        res.json({
            attendance: attendanceRecords,
            missing: missing
        });

    } catch (err) {
        console.error("History Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// 3. CLOCK IN
router.post('/clock-in', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({ 
            employee: req.user.id, 
            date: { $gte: today } 
        });

        if (existing) return res.status(400).json({ msg: 'Already clocked in today' });

        const newRecord = new Attendance({
            employee: req.user.id, // Save to NEW field
            date: new Date(),
            clockIn: new Date(),
            status: 'Present'
        });

        await newRecord.save();
        res.json(newRecord);
    } catch (err) {
        console.error("Clock In Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// 4. CLOCK OUT
router.put('/clock-out', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check both fields for robustness
        const record = await Attendance.findOne({ 
            $or: [{ employee: req.user.id }, { userId: req.user.id }],
            date: { $gte: today } 
        });

        if (!record) return res.status(400).json({ msg: 'No clock-in record found' });
        if (record.clockOut) return res.status(400).json({ msg: 'Already clocked out' });

        record.clockOut = new Date();
        
        // Calculate Hours
        const inTime = record.clockIn || record.clockInTime;
        const diff = Math.abs(record.clockOut - inTime) / 36e5; 
        record.workHours = diff.toFixed(2);
        
        await record.save();
        res.json(record);
    } catch (err) {
        console.error("Clock Out Error:", err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;