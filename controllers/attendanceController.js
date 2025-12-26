const Attendance = require('../models/Attendance');
const User = require('../models/Employee'); 
const Leave = require('../models/Leave');
const BlockedDate = require('../models/BlockedDate'); 

// CONFIGURATION: Office Location (Zulekha Colonnade)
const OFFICE_LOCATION = {
    latitude: 25.29190484228818,
    longitude: 55.40298781183994
};
const MAX_DISTANCE_METERS = 100; 

// Helper: Calculate Distance (Haversine Formula)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const toRad = (val) => (val * Math.PI) / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper: Check Shift Timing
function checkShiftStatus(userShift) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalCurrentMinutes = (currentHour * 60) + currentMinute;

    // Shift Start Times
    let shiftStartMinutes = 480; // Normal 08:00
    if (userShift === 'Morning') shiftStartMinutes = 510; // 08:30
    if (userShift === 'Evening') shiftStartMinutes = 720; // 12:00
    
    const gracePeriod = 10; 
    const lateThreshold = shiftStartMinutes + gracePeriod;

    if (totalCurrentMinutes > lateThreshold) {
        return { status: 'Late', lateMinutes: totalCurrentMinutes - shiftStartMinutes };
    }
    
    return { status: 'Present', lateMinutes: 0 };
}

// ==========================================
// 1. GET STATUS (Dashboard Load)
// ==========================================
exports.getStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        const activeLeave = await Leave.findOne({
            userId,
            status: 'Approved',
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        if (activeLeave) {
            return res.json({ status: 'On Leave', leaveType: activeLeave.leaveType });
        }

        const startOfDay = new Date(today); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(today); endOfDay.setHours(23,59,59,999);

        const attendance = await Attendance.findOne({ 
            userId, 
            date: { $gte: startOfDay, $lte: endOfDay } 
        });

        if (!attendance) return res.json({ status: 'Absent' }); 
        if (attendance.clockOutTime) return res.json({ status: 'Completed' }); 
        return res.json({ status: 'Present', clockInTime: attendance.clockInTime }); 

    } catch (error) {
        console.error("❌ GET STATUS ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==========================================
// 2. CLOCK IN
// ==========================================
exports.clockIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Location is required to clock in.' });
        }
        
        const distance = getDistanceInMeters(
            latitude, longitude, 
            OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude
        );

        if (distance > MAX_DISTANCE_METERS) {
            return res.status(403).json({ 
                message: `You are too far from office (${Math.round(distance)}m). Move closer to clock in.` 
            });
        }

        const today = new Date();
        const startOfDay = new Date(today); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(today); endOfDay.setHours(23,59,59,999);

        const existing = await Attendance.findOne({ 
            userId, 
            date: { $gte: startOfDay, $lte: endOfDay } 
        });

        if (existing) {
            return res.status(400).json({ message: 'You have already clocked in today.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User profile not found.' });

        const { status, lateMinutes } = checkShiftStatus(user.workShift);

        // --- OVERTIME CHECK ---
        let isOvertime = false;
        const day = today.getDay();
        if (day === 0 || day === 6) isOvertime = true;

        const isHoliday = await BlockedDate.findOne({
            startDate: { $lte: endOfDay },
            endDate: { $gte: startOfDay }
        });
        
        if (isHoliday) isOvertime = true;

        const newAttendance = new Attendance({
            userId,
            date: today,
            clockInTime: new Date(),
            status: isOvertime ? 'Present' : status,
            lateMinutes: isOvertime ? 0 : lateMinutes,
            isOvertime: isOvertime,
            locationParams: { latitude, longitude }
        });

        await newAttendance.save();
        
        const successMsg = isOvertime 
            ? "Clocked in! (Counted as Overtime/Weekend Work)" 
            : `Clocked in successfully. Status: ${status}`;

        res.json({ message: successMsg, attendance: newAttendance });

    } catch (error) {
        console.error("❌ CLOCK IN ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==========================================
// 3. CLOCK OUT
// ==========================================
exports.clockOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        
        const startOfDay = new Date(today); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(today); endOfDay.setHours(23,59,59,999);

        const attendance = await Attendance.findOne({ 
            userId, 
            date: { $gte: startOfDay, $lte: endOfDay } 
        });

        if (!attendance) return res.status(400).json({ message: 'You have not clocked in yet.' });
        if (attendance.clockOutTime) return res.status(400).json({ message: 'You have already clocked out.' });

        attendance.clockOutTime = new Date();
        const duration = (attendance.clockOutTime - attendance.clockInTime) / (1000 * 60);
        attendance.workDuration = Math.round(duration);

        await attendance.save();
        res.json({ message: 'Clocked out successfully.', attendance });

    } catch (error) {
        console.error("❌ CLOCK OUT ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==========================================
// 4. GET HISTORY (Updated: Fixed Missing Logic)
// ==========================================
exports.getHistory = async (req, res) => {
    try {
        const { role, id } = req.user;
        const { date, month } = req.query; 

        let query = {};
        if (role === 'Employee') query.userId = id;

        if (date) {
            const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(date); endOfDay.setHours(23,59,59,999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        } 
        else if (month) {
            const [y, m] = month.split('-');
            const startOfMonth = new Date(y, m - 1, 1);
            const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999); 
            query.date = { $gte: startOfMonth, $lte: endOfMonth };
        }
        else {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            query.date = { $gte: startOfMonth, $lte: endOfMonth };
        }

        const attendanceRecords = await Attendance.find(query)
            .populate('userId', 'firstName lastName email department profilePicture role') // Added 'role'
            .sort({ date: -1 });

        // --- ADMIN ONLY: "WHO IS MISSING?" LOGIC ---
        if (role !== 'Employee' && date) {
            const targetDate = new Date(date);
            targetDate.setHours(12,0,0,0); 

            const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(date); endOfDay.setHours(23,59,59,999);

            // 1. Check Holiday
            const isHoliday = await BlockedDate.findOne({
                startDate: { $lte: endOfDay },
                endDate: { $gte: startOfDay }
            });

            if (isHoliday) {
                return res.json({ attendance: attendanceRecords, missing: [] });
            }

            // 2. Check Weekend
            const dayOfWeek = targetDate.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            // 3. Fetch All Employees (FIXED: Added 'role')
            const allEmployees = await User.find({ isActive: true })
                .select('firstName lastName department profilePicture workShift role');
            
            // 4. Check Approved Leave
            const peopleOnLeave = await Leave.find({
                status: 'Approved',
                startDate: { $lte: endOfDay },
                endDate: { $gte: startOfDay }
            }).select('employee');

            const onLeaveIds = peopleOnLeave.map(l => l.employee.toString());
            const presentIds = attendanceRecords.map(r => r.userId ? r.userId._id.toString() : null);

            // 5. Filter "Missing" List
            const missingEmployees = allEmployees.filter(emp => {
                const empId = emp._id.toString();

                // --- FIX: Exclude Owner from Missing List ---
                if (emp.role === 'Owner') return false; 

                // If Present, not missing
                if (presentIds.includes(empId)) return false;

                // If on Leave, not missing
                if (onLeaveIds.includes(empId)) return false;

                // If Weekend AND Normal Shift, not missing
                if (isWeekend && emp.workShift === 'Normal') return false;

                return true;
            });

            return res.json({ 
                attendance: attendanceRecords, 
                missing: missingEmployees 
            });
        }

        res.json({ attendance: attendanceRecords });

    } catch (error) {
        console.error("❌ HISTORY ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};