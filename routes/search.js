const { Book } = require('../models/books.js');
const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");

router.get('/', async (req, res) => {
    console.log('Received a GET request at /api/search');
    try {
        const query = req.query.q;
        console.log('Received query:', query);  // Log the query parameter
        if (!query) {
            return res.status(400).json({ msg: 'Query is required' });
        }

        // Aggregate query to prioritize results
        const items = await Book.aggregate([
            {
                $match: {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { author: { $regex: query, $options: 'i' } },
                        { genres: { $regex: query, $options: 'i' } },
                    ]
                }
            },
            {
                $addFields: {
                    titleScore: { $cond: [{ $regexMatch: { input: "$title", regex: new RegExp(query, 'i') } }, 3, 0] },
                    authorScore: { $cond: [{ $regexMatch: { input: "$author", regex: new RegExp(query, 'i') } }, 2, 0] },
                    genresScore: { $cond: [{ $regexMatch: { input: "$genres", regex: new RegExp(query, 'i') } }, 1, 0] }
                }
            },
            {
                $addFields: {
                    totalScore: { $add: ["$titleScore", "$authorScore", "$genresScore"] }
                }
            },
            {
                $sort: { totalScore: -1 }
            },
            {
                $project: {
                    titleScore: 0,
                    authorScore: 0,
                    genresScore: 0,
                    totalScore: 0
                }
            }
        ]);

        console.log('Aggregated items:', items);  // Log the aggregated items
        res.json(items);
    } catch (err) {
        console.log('Error:', err);  // Log any errors
        res.status(500).json({ msg: 'Server error' });
    }
});



module.exports = router;
