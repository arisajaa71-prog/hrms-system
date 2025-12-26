const express = require('express');
const router = express.Router();
const Training = require('../models/Training');

// 1. GET ALL TRAININGS (Sorted by newest)
router.get('/', async (req, res) => {
  try {
    const trainings = await Training.find().sort({ createdAt: -1 });
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. ASSIGN NEW TRAINING (Admin)
router.post('/', async (req, res) => {
  try {
    const newTraining = new Training(req.body);
    const savedTraining = await newTraining.save();
    res.status(201).json(savedTraining);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. MARK AS COMPLETED (Employee)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    // If they mark it complete, save the date automatically
    if (status === 'Completed') {
        updateData.completionDate = new Date();
    }

    const updatedTraining = await Training.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    res.json(updatedTraining);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;