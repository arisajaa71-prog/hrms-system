const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/authMiddleware');
const Leave = require('../models/Leave'); 
const Employee = require('../models/Employee'); 

// ==========================================
// 0. MULTER CONFIGURATION (For File Uploads)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

const getDuration = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
};

// ==========================================
// 1. GET LEAVES
// ==========================================
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Employee') {
        query.employee = req.user.id;
    }
    const leaves = await Leave.find(query)
        .populate('employee', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 2. APPLY FOR LEAVE
// ==========================================
router.post('/', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const daysRequested = getDuration(startDate, endDate);

    const employee = await Employee.findById(req.user.id);
    if (!employee) return res.status(404).json({ msg: 'User not found' });

    let balanceKey = null;
    if (['Annual', 'Annual Leave'].includes(leaveType)) balanceKey = 'annual';
    if (['Lieu Day'].includes(leaveType)) balanceKey = 'lieu';
    if (['Comp Off'].includes(leaveType)) balanceKey = 'compOff';
    if (['Sick', 'Sick Leave'].includes(leaveType)) balanceKey = 'sick';

    if (balanceKey && employee.leaveBalance && employee.leaveBalance[balanceKey] !== undefined) {
        if (employee.leaveBalance[balanceKey] < daysRequested) {
            return res.status(400).json({ 
                msg: `Insufficient Balance. Available: ${employee.leaveBalance[balanceKey]}, Requested: ${daysRequested}.` 
            });
        }
    }

    const newLeave = new Leave({
      employee: req.user.id,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      attachment: req.file ? req.file.path : null 
    });

    const leave = await newLeave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 3. ADMIN: ADJUST BALANCE (MOVED UP!)
// ==========================================
// This MUST come before the /:id route, otherwise Express thinks "adjust-balance" is an ID.
router.put('/adjust-balance', auth, async (req, res) => {
    try {
        const { employeeId, type, amount } = req.body;
        const employee = await Employee.findById(employeeId);
        
        if (employee && employee.leaveBalance) {
            const current = employee.leaveBalance[type] || 0;
            employee.leaveBalance[type] = current + parseInt(amount);
            await employee.save();
            res.json(employee);
        } else {
            res.status(400).json({ msg: "Invalid Data" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// ==========================================
// 4. UPDATE STATUS (Approve & Deduct)
// ==========================================
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body; 
    let leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

    if (status === 'Approved' && leave.status !== 'Approved') {
        const employee = await Employee.findById(leave.employee);
        const days = getDuration(leave.startDate, leave.endDate);
        
        let balanceKey = null;
        if (['Annual', 'Annual Leave'].includes(leave.leaveType)) balanceKey = 'annual';
        if (['Lieu Day'].includes(leave.leaveType)) balanceKey = 'lieu';
        if (['Comp Off'].includes(leave.leaveType)) balanceKey = 'compOff';
        if (['Sick', 'Sick Leave'].includes(leave.leaveType)) balanceKey = 'sick';

        if (balanceKey && employee && employee.leaveBalance) {
            const currentBal = employee.leaveBalance[balanceKey] || 0;
            employee.leaveBalance[balanceKey] = currentBal - days;
            await employee.save();
        }
    }

    leave.status = status;
    await leave.save();
    res.json(leave);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 5. BLOCK DATES
// ==========================================
router.post('/block-dates', auth, async (req, res) => {
    res.json({ msg: "Date Blocked" });
});

// ==========================================
// 6. CANCEL / REVOKE LEAVE
// ==========================================
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });

    const isAdmin = ['Owner', 'Admin', 'Senior Admin'].includes(req.user.role);
    const isOwnerOfLeave = leave.employee.toString() === req.user.id;

    if (!isAdmin && !isOwnerOfLeave) {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    if (leave.status === 'Approved') {
        const employee = await Employee.findById(leave.employee);
        const days = getDuration(leave.startDate, leave.endDate);
        
        let balanceKey = null;
        if (['Annual', 'Annual Leave'].includes(leave.leaveType)) balanceKey = 'annual';
        if (['Lieu Day'].includes(leave.leaveType)) balanceKey = 'lieu';
        if (['Comp Off'].includes(leave.leaveType)) balanceKey = 'compOff';
        if (['Sick', 'Sick Leave'].includes(leave.leaveType)) balanceKey = 'sick';

        if (balanceKey && employee && employee.leaveBalance) {
            const currentBalance = employee.leaveBalance[balanceKey] || 0;
            employee.leaveBalance[balanceKey] = currentBalance + days;
            await employee.save();
        }
    }

    leave.status = 'Cancelled';
    await leave.save();
    res.json(leave);

  } catch (err) {
    console.error("Cancel Error:", err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;