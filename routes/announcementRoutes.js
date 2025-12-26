const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/authMiddleware');

// GET ALL NEWS
router.get('/', auth, async (req, res) => {
  try {
    // Newest first
    const news = await Announcement.find().sort({ createdAt: -1 }).limit(10);
    res.json(news);
  } catch (err) { res.status(500).send('Server Error'); }
});

// POST NEWS (Admin Only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'Employee') return res.status(403).json({ msg: "Access Denied" });

    const newNews = new Announcement({
      title: req.body.title,
      content: req.body.content,
      postedBy: req.user.name
    });

    await newNews.save();
    res.json(newNews);
  } catch (err) { res.status(500).send('Server Error'); }
});

// DELETE NEWS
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role === 'Employee') return res.status(403).json({ msg: "Access Denied" });
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ msg: "Deleted" });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;