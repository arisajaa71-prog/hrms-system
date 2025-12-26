const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // <--- IMPORT PATH MODULE
require('dotenv').config(); 

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// --- CRITICAL FIX: SERVE UPLOADS FOLDER ---
// This tells the server: "If the browser asks for a file in /uploads, look in the uploads folder"
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// --- CONNECT TO DATABASE ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms')
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes')); 
app.use('/api/performance', require('./routes/performanceRoutes'));
app.use('/api/training', require('./routes/trainingRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/recruitment', require('./routes/recruitmentRoutes'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));