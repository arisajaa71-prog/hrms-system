const express = require('express');
const router = express.Router();
const PasswordRequest = require('../models/PasswordRequest');
const Employee = require('../models/Employee');
const auth = require('../middleware/authMiddleware');

// 1. PUBLIC: CREATE REQUEST
router.post('/create', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Employee.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User email not found." });

    const existing = await PasswordRequest.findOne({ email, status: 'Pending' });
    if (existing) return res.json({ msg: "Request pending." });

    const newReq = new PasswordRequest({
      email,
      name: `${user.firstName} ${user.lastName}`
    });

    await newReq.save();
    res.json({ msg: "Request received!" });
  } catch (err) { res.status(500).send('Server Error'); }
});

// 2. ADMIN: GET PENDING REQUESTS
router.get('/pending', auth, async (req, res) => {
  try {
    const requests = await PasswordRequest.find({ status: 'Pending' }).sort({ requestDate: -1 });
    res.json(requests);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 3. ADMIN: GET RESOLVED HISTORY (NEW)
router.get('/history', auth, async (req, res) => {
  try {
    // Get last 20 resolved requests
    const requests = await PasswordRequest.find({ status: 'Resolved' })
        .sort({ resolvedAt: -1 })
        .limit(20);
    res.json(requests);
  } catch (err) { res.status(500).send('Server Error'); }
});

// 4. ADMIN: MARK RESOLVED (UPDATED)
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    // Save the time and a note
    await PasswordRequest.findByIdAndUpdate(req.params.id, { 
        status: 'Resolved',
        resolvedAt: Date.now(),
        adminNote: 'Reset performed manually' 
    });
    res.json({ msg: "Request marked resolved" });
  } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;