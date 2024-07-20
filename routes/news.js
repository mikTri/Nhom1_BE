const express = require('express');
const router = express.Router();
const {News}= require('../models/news.js');

router.post('/', async (req, res) => {
    try {
        const { email } = req.body;

        // Create a new news entry
        const news = new News({ email });
        await news.save();

        res.status(201).json({ success: true, news });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ success: false, message: 'Failed to create news entry' });
    }
});

router.get('/', async (req, res) => {
    try {
        const newsList = await News.find().sort({ creationDate: -1 });

        res.status(200).json({ success: true, newsList });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch news entries' });
    }
});

module.exports = router;