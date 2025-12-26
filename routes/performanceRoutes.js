const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware'); // Consistent naming
const Performance = require('../models/Performance');
const Employee = require('../models/Employee'); 

// 1. GET REVIEWS (Unified Route)
// Admin sees ALL reviews. Employees see only THEIR OWN.
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};

    // If NOT Admin, force filter by their ID
    if (req.user.role === 'Employee') {
        query.employee = req.user.id;
    }

    // Populate 'employee' to show Name instead of just ID
    const reviews = await Performance.find(query)
        .populate('employee', 'firstName lastName department profilePicture')
        .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("❌ Error fetching reviews:", err.message);
    res.status(500).send('Server Error');
  }
});

// 2. SUBMIT REVIEW (Admin Only usually, but we allow Manager logic here)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { employeeId, rating, feedback } = req.body;

    // Validation
    if (!employeeId || !rating) {
        return res.status(400).json({ msg: "Please provide employee and rating." });
    }

    const newReview = new Performance({
      employee: employeeId,
      rating,
      feedback,
      reviewer: req.user.id // Optional: Track who wrote the review
    });

    const review = await newReview.save();
    
    // Populate the return data so the UI updates instantly with the name
    await review.populate('employee', 'firstName lastName');
    
    res.json(review);
  } catch (err) {
    console.error("❌ Error Saving Review:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;