const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const Employee = require('../models/Employee'); 
const auth = require('../middleware/authMiddleware'); 

// 0. LOAD USER (THE MISSING ROUTE)
// This is called by App.js to check if the user is already logged in
router.get('/', auth, async (req, res) => {
    try {
        // Find user by ID (from the token), exclude password
        const user = await Employee.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 1. LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Employee.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    // Payload matches your specific structure
    const payload = { user: { id: user.id, role: user.role, name: user.firstName } };
    const secret = 'hrms_secret_key_123'; 

    jwt.sign(payload, secret, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, name: user.firstName, role: user.role } });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. CHANGE PASSWORD
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await Employee.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

        if(newPassword.length < 6) return res.status(400).json({ msg: "New password must be 6+ chars" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: "Password updated successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// 3. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Employee.findOne({ email });
        if (!user) return res.status(404).json({ msg: "User not found" });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

        await user.save();

        console.log(`🔒 PASSWORD RESET LINK: http://localhost:3000?resetToken=${resetToken}`);
        res.json({ msg: "Reset link generated (Check Console)" });
    } catch (err) { res.status(500).send("Email error"); }
});

// 4. RESET PASSWORD
router.put('/reset-password/:resetToken', async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
        const user = await Employee.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: "Invalid or Expired Token" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.json({ msg: "Password Reset Successfully! Please Login." });
    } catch (err) { res.status(500).send("Server Error"); }
});

module.exports = router;