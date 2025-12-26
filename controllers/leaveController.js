const Leave = require('../models/Leave');
const Employee = require('../models/Employee'); 
const BlockedDate = require('../models/BlockedDate'); // <--- NEW IMPORT

// Helper: Calculate number of days between two dates
const getDuration = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    // Add 1 because if you take leave on Dec 1st to Dec 1st, it is 1 day, not 0.
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
};

// 1. GET ALL LEAVES (Admin sees all, Employee sees own)
exports.getLeaves = async (req, res) => {
    try {
        const { role, id } = req.user;
        let query = {};
        
        // If Employee, only show their own leaves
        if (role === 'Employee') {
            query.employee = id;
        }

        const leaves = await Leave.find(query)
            .populate('employee', 'firstName lastName department profilePicture leaveBalance') 
            .sort({ createdAt: -1 });
            
        res.json(leaves);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Server Error'); 
    }
};

// 2. APPLY FOR LEAVE (With Blocked Date & Balance Check)
exports.addLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // --- A. CHECK FOR BLOCKED DATES (NEW) ---
        // Find any block that overlaps with the requested range
        // Logic: (BlockStart <= RequestEnd) AND (BlockEnd >= RequestStart)
        const blocked = await BlockedDate.findOne({
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } } 
            ]
        });

        if (blocked) {
            return res.status(400).json({ 
                msg: `Request Failed: These dates are blocked due to '${blocked.reason}'. Please contact HR.` 
            });
        }

        // --- B. CHECK USER & BALANCE ---
        const employee = await Employee.findById(req.user.id);
        if (!employee) return res.status(404).json({ msg: "Employee not found" });

        const requestedDays = getDuration(startDate, endDate);
        
        // Map "Form Option" to "Database Field"
        let balanceKey = '';
        if (leaveType === 'Annual') balanceKey = 'annual';
        if (leaveType === 'Lieu Day') balanceKey = 'lieu';
        if (leaveType === 'Comp Off') balanceKey = 'compOff';
        if (leaveType === 'Sick') balanceKey = 'sick';

        // Check Balance (Prevent overdraft)
        if (balanceKey) {
            const currentBalance = employee.leaveBalance[balanceKey];
            if (currentBalance < requestedDays) {
                return res.status(400).json({ 
                    msg: `Insufficient ${leaveType} Balance. You have ${currentBalance} days, but requested ${requestedDays} days.` 
                });
            }
        }

        // --- C. CREATE LEAVE ---
        const newLeave = new Leave({
            employee: req.user.id,
            leaveType, 
            startDate, 
            endDate, 
            reason,
            status: 'Pending'
        });

        const leave = await newLeave.save();
        res.json(leave);

    } catch (err) { 
        console.error(err);
        res.status(500).send('Server Error'); 
    }
};

// 3. APPROVE/REJECT LEAVE (And Deduct Balance)
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ msg: 'Leave not found' });

        // LOGIC: If status changing to 'Approved', deduct the balance
        if (status === 'Approved' && leave.status !== 'Approved') {
            const employee = await Employee.findById(leave.employee);
            const days = getDuration(leave.startDate, leave.endDate);
            
            let balanceKey = '';
            if (leave.leaveType === 'Annual') balanceKey = 'annual';
            if (leave.leaveType === 'Lieu Day') balanceKey = 'lieu';
            if (leave.leaveType === 'Comp Off') balanceKey = 'compOff';
            if (leave.leaveType === 'Sick') balanceKey = 'sick';

            // Deduct from wallet
            if (balanceKey) {
                if (employee.leaveBalance[balanceKey] < days) {
                     return res.status(400).json({ msg: "Cannot approve: Employee has insufficient balance." });
                }
                employee.leaveBalance[balanceKey] -= days;
                await employee.save();
            }
        }

        leave.status = status;
        await leave.save();
        res.json(leave);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// 4. ADMIN: ADJUST BALANCE (Add Credits)
exports.adjustBalance = async (req, res) => {
    try {
        const { employeeId, type, amount } = req.body;
        
        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ msg: "Employee not found" });

        if (employee.leaveBalance[type] !== undefined) {
            employee.leaveBalance[type] += parseInt(amount);
            await employee.save();
            res.json(employee);
        } else {
            res.status(400).json({ msg: "Invalid leave type provided." });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// 5. ADMIN: BLOCK DATES (Freeze Period)
exports.blockDates = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const newBlock = new BlockedDate({
            startDate, endDate, reason, addedBy: req.user.id
        });
        await newBlock.save();
        res.json(newBlock);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// 6. GET BLOCKED DATES
exports.getBlockedDates = async (req, res) => {
    try {
        const blocks = await BlockedDate.find().sort({ startDate: 1 });
        res.json(blocks);
    } catch (err) { res.status(500).send('Server Error'); }
};