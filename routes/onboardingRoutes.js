const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Onboarding = require('../models/Onboarding');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto'); // Built-in node module for random codes

// --- SETUP FILE UPLOAD ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'doc-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// 1. HR ROUTES (Requires Login)
// ==========================================

// INITIATE ONBOARDING
router.post('/initiate', auth, async (req, res) => {
    try {
        const { firstName, lastName, email, department, designation, reportsTo, joiningDate, offerSalary } = req.body;

        const existingEmp = await Employee.findOne({ email });
        if (existingEmp) return res.status(400).json({ msg: "This email already belongs to an active employee." });

        const accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const newOnboard = new Onboarding({
            firstName, lastName, email, department, designation, reportsTo, joiningDate, offerSalary,
            accessCode,
            status: 'Pending Candidate'
        });

        await newOnboard.save();
        res.json({ msg: "Onboarding Initiated", accessCode, record: newOnboard });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET ALL ONBOARDING RECORDS
router.get('/', auth, async (req, res) => {
    try {
        const list = await Onboarding.find().sort({ createdAt: -1 }).populate('reportsTo', 'firstName lastName');
        res.json(list);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 2. CANDIDATE ROUTES (Public Access)
// ==========================================

// VERIFY ACCESS CODE
router.post('/verify', async (req, res) => {
    try {
        const { accessCode } = req.body;
        const candidate = await Onboarding.findOne({ accessCode });
        
        if (!candidate) return res.status(400).json({ msg: "Invalid Access Code" });
        if (candidate.status === 'Completed') return res.status(400).json({ msg: "This onboarding is already completed." });

        res.json(candidate); 
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// CANDIDATE SUBMIT DATA
router.put('/candidate-submit/:id', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'contract', maxCount: 1 }
]), async (req, res) => {
    try {
        const { 
            mobile, dob, gender, address, 
            emergencyName, emergencyRelation, emergencyPhone,
            bankName, accountNumber, iban, swiftCode 
        } = req.body;

        let docPaths = {};
        if (req.files['passport']) docPaths.passport = req.files['passport'][0].path.replace(/\\/g, "/");
        if (req.files['nationalId']) docPaths.nationalId = req.files['nationalId'][0].path.replace(/\\/g, "/");
        if (req.files['resume']) docPaths.resume = req.files['resume'][0].path.replace(/\\/g, "/");
        if (req.files['contract']) docPaths.contract = req.files['contract'][0].path.replace(/\\/g, "/");

        await Onboarding.findByIdAndUpdate(req.params.id, {
            $set: {
                mobile, dob, gender, address,
                emergencyContact: { name: emergencyName, relation: emergencyRelation, phone: emergencyPhone },
                bankDetails: { bankName, accountNumber, iban, swiftCode },
                documents: docPaths, 
                status: 'Reviewing' 
            }
        });

        res.json({ msg: "Information Submitted Successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// 3. INTERNAL HR ROUTES
// ==========================================

// [NEW] REQUEST CHANGES (Rejects submission)
router.put('/request-changes/:id', auth, async (req, res) => {
    try {
        const updatedRecord = await Onboarding.findByIdAndUpdate(
            req.params.id,
            { status: 'Pending Candidate' },
            { new: true }
        );
        res.json(updatedRecord);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE CHECKLIST STATUS
router.put('/update-checklist/:id', auth, async (req, res) => {
    try {
        const { task, status } = req.body; 
        const updateField = {};
        updateField[`checklist.${task}`] = status;

        const updatedRecord = await Onboarding.findByIdAndUpdate(
            req.params.id,
            { $set: updateField },
            { new: true }
        );

        res.json(updatedRecord);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// APPROVE & HIRE (With Work Email & Document Transfer)
router.post('/approve/:id', auth, async (req, res) => {
    try {
        const { workEmail } = req.body;

        if (!workEmail) return res.status(400).json({ msg: "Work Email is required to create an account." });
        const existingUser = await Employee.findOne({ email: workEmail });
        if (existingUser) return res.status(400).json({ msg: "This Work Email is already in use by another employee." });

        const ob = await Onboarding.findById(req.params.id);
        if (!ob) return res.status(404).json({ msg: "Record not found" });
        if (ob.status === 'Completed') return res.status(400).json({ msg: "Already hired" });

        const empId = 'EMP' + Math.floor(1000 + Math.random() * 9000);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const newEmployee = new Employee({
            employeeId: empId,
            firstName: ob.firstName,
            lastName: ob.lastName,
            email: workEmail, 
            personalEmail: ob.email, 
            password: hashedPassword,
            department: ob.department,
            designation: ob.designation,
            role: 'Employee',
            reportsTo: ob.reportsTo,
            joiningDate: ob.joiningDate,
            workLocation: ob.workLocation,
            mobile: ob.mobile,
            dob: ob.dob,
            gender: ob.gender,
            bankDetails: ob.bankDetails, 
            salary: ob.offerSalary,
            
            // --- TRANSFER DOCUMENTS ---
            documents: ob.documents 
        });

        await newEmployee.save();

        ob.status = 'Completed';
        await ob.save();

        res.json({ msg: "Employee Hired Successfully!", employee: newEmployee });

    } catch (err) {
        console.error("Hiring Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE ONBOARDING RECORD
router.delete('/:id', auth, async (req, res) => {
    try {
        await Onboarding.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Onboarding Record Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;