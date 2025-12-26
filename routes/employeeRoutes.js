const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs'); 
const multer = require('multer');
const path = require('path');

// --- 1. SETUP IMAGE UPLOAD ENGINE (Multer) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Images save to 'uploads' folder
    },
    filename: function (req, file, cb) {
        // Unique name: Fieldname + Date + Extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// --- ROUTES ---

// 1. GET ALL EMPLOYEES
router.get('/', auth, async (req, res) => {
    try {
        const employees = await Employee.find({ role: { $ne: 'Owner' } })
            .select('-password') 
            .populate('reportsTo', 'firstName lastName designation')
            .sort({ createdAt: -1 });
        res.json(employees);
    } catch (err) {
        console.error("Error fetching employees:", err.message);
        res.status(500).send('Server Error');
    }
});

// 2. ADD NEW EMPLOYEE (With Image & ID)
router.post('/add', auth, upload.single('image'), async (req, res) => {
    try {
        const { 
            firstName, lastName, email, department, designation, 
            role, joiningDate, password, employeeId, reportsTo,
            mobile, dob, workLocation
        } = req.body;

        // Check Email
        let userByEmail = await Employee.findOne({ email });
        if (userByEmail) return res.status(400).json({ msg: 'User with this email already exists' });

        // Check Employee ID
        let finalEmpId = employeeId;
        if (finalEmpId) {
            let userById = await Employee.findOne({ employeeId: finalEmpId });
            if (userById) return res.status(400).json({ msg: 'This Employee ID is already taken' });
        } else {
            finalEmpId = 'EMP' + Math.floor(100 + Math.random() * 900);
        }

        const user = new Employee({
            firstName, lastName, email, department, designation, role, joiningDate,
            password: password || '123456',
            employeeId: finalEmpId,
            reportsTo: reportsTo || null,
            mobile, dob, workLocation,
            profilePicture: req.file ? req.file.path.replace(/\\/g, "/") : ''
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();
        res.json(user);
    } catch (err) {
        console.error("Error adding employee:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- [NEW ROUTE] GET MY TEAM ---
// This MUST come BEFORE the /:id route, otherwise "team" is read as an ID
router.get('/team', auth, async (req, res) => {
    try {
        // Find all employees where 'reportsTo' matches the logged-in user's ID
        const team = await Employee.find({ reportsTo: req.user.id })
            .select('-password')
            .populate('reportsTo', 'firstName lastName')
            .sort({ firstName: 1 });
        
        res.json(team);
    } catch (err) {
        console.error("Team Fetch Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// 3. GET SINGLE EMPLOYEE (Moved down to accommodate /team)
router.get('/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .select('-password')
            .populate('reportsTo', 'firstName lastName designation');
        if (!employee) return res.status(404).json({ msg: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        // If the ID is invalid (like "team" if the order was wrong), this catches it
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Employee not found' });
        res.status(500).send('Server Error');
    }
});

// 4. UPDATE EMPLOYEE PROFILE
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { 
            firstName, lastName, department, designation, role, 
            employeeId, email, mobile, dob, joiningDate, reportsTo, workLocation 
        } = req.body;
        
        if (employeeId) {
            const existingUser = await Employee.findOne({ employeeId });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ msg: "Error: This Employee ID is already taken." });
            }
        }

        let updateData = {
            firstName, lastName, department, designation, role, 
            employeeId, email, mobile, dob, joiningDate, workLocation
        };

        if (reportsTo === "" || reportsTo === "null" || !reportsTo) {
            updateData.reportsTo = null;
        } else {
            updateData.reportsTo = reportsTo;
        }

        if (req.file) {
            updateData.profilePicture = req.file.path.replace(/\\/g, "/");
        }

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        )
        .select('-password')
        .populate('reportsTo', 'firstName lastName designation');

        res.json(employee);
    } catch (err) {
        console.error("Update Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// 5. UPDATE COMPENSATION
router.put('/:id/compensation', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') {
            return res.status(403).json({ msg: 'Not Authorized' });
        }

        const { salaryDetails, bankDetails, salary } = req.body;
        
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    salaryDetails: salaryDetails, 
                    bankDetails: bankDetails,
                    salary: salary 
                } 
            },
            { new: true }
        );

        res.json(employee);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 6. DELETE EMPLOYEE
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') {
            return res.status(403).json({ msg: 'Not Authorized' });
        }
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Employee Removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 7. ADMIN FORCE RESET PASSWORD
router.put('/:id/force-reset', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') {
            return res.status(403).json({ msg: 'Not Authorized' });
        }
        const { newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await Employee.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ msg: 'Password Reset Successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 8. PROMOTE EMPLOYEE
router.put('/:id/promote', auth, async (req, res) => {
    try {
        if (req.user.role !== 'Owner' && req.user.role !== 'Senior Admin') {
            return res.status(403).json({ msg: 'Not Authorized' });
        }
        const { newDesignation, newDepartment, newReportsTo, newLocation } = req.body;
        
        let updateData = {
            designation: newDesignation,
            department: newDepartment,
            workLocation: newLocation
        };
        
        if (newReportsTo) updateData.reportsTo = newReportsTo;

        const employee = await Employee.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData },
            { new: true }
        );
        res.json(employee);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;