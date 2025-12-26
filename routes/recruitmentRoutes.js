const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');
const Onboarding = require('../models/Onboarding'); // <--- THE BRIDGE
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

// Setup Upload for Resumes
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'resume-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==========================================
// 1. JOB MANAGEMENT
// ==========================================

// Create Job
router.post('/jobs', auth, async (req, res) => {
    try {
        const newJob = new Job(req.body);
        await newJob.save();
        res.json(newJob);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Get All Jobs
router.get('/jobs', auth, async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// 2. APPLICANT TRACKING
// ==========================================

// Add Applicant (HR Manual Add or Public Form)
router.post('/applicants', auth, upload.single('resume'), async (req, res) => {
    try {
        const { jobId, firstName, lastName, email, phone } = req.body;
        const resumePath = req.file ? req.file.path.replace(/\\/g, "/") : '';

        const newApplicant = new Applicant({
            jobId, firstName, lastName, email, phone, resume: resumePath
        });
        await newApplicant.save();
        res.json(newApplicant);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Get Applicants for a specific Job
router.get('/applicants/:jobId', auth, async (req, res) => {
    try {
        const applicants = await Applicant.find({ jobId: req.params.jobId });
        res.json(applicants);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Move Applicant Stage (e.g., Interview -> Offer)
router.put('/applicants/stage/:id', auth, async (req, res) => {
    try {
        const { stage } = req.body;
        const applicant = await Applicant.findByIdAndUpdate(req.params.id, { stage }, { new: true });
        res.json(applicant);
    } catch (err) { res.status(500).send('Server Error'); }
});

// ==========================================
// 3. THE MAGIC LINK: RECRUITMENT -> ONBOARDING
// ==========================================
router.post('/hire/:id', auth, async (req, res) => {
    try {
        const { offerSalary, joiningDate, reportsTo } = req.body; // Data needed for onboarding but not in recruitment
        
        // 1. Get Applicant & Job Info
        const applicant = await Applicant.findById(req.params.id).populate('jobId');
        if (!applicant) return res.status(404).json({ msg: "Applicant not found" });

        // 2. Check if already hired
        if (applicant.stage === 'Hired') return res.status(400).json({ msg: "Applicant already hired" });

        // 3. Generate Onboarding Access Code
        const accessCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        // 4. Create Onboarding Record (Pre-filling data from Recruitment)
        const newOnboard = new Onboarding({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            email: applicant.email,
            mobile: applicant.phone,
            
            department: applicant.jobId.department,
            designation: applicant.jobId.title, // Job Title becomes Designation
            
            reportsTo: reportsTo, // From the popup
            offerSalary: offerSalary, // From the popup
            joiningDate: joiningDate, // From the popup
            
            // Transfer Resume to Onboarding Docs
            documents: { resume: applicant.resume }, 
            
            accessCode,
            status: 'Pending Candidate'
        });

        await newOnboard.save();

        // 5. Mark Applicant as 'Hired' in Recruitment
        applicant.stage = 'Hired';
        await applicant.save();

        res.json({ msg: "Moved to Onboarding!", accessCode });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;