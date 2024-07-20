const { BookReviews } = require('../models/bookReviews.js');
const express = require('express');
const router = express.Router();

router.get('/visible', async (req, res) => {
    try {
        const visibleReviews = await BookReviews.find({ isVisible: true });
        
        if (!visibleReviews || visibleReviews.length === 0) {
            return res.status(404).json({ message: 'No visible reviews found' });
        }

        res.status(200).json(visibleReviews);
    } catch (error) {
        console.error(`Error fetching reviews: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//http://localhost:4000/api/review/
router.get(`/`, async (req, res) => {

    let  reviews=[];

    try {

        if(req.query.productId!==undefined && req.query.productId!==null && req.query.productId!=="" ){
            reviews = await BookReviews.find({ productId: req.query.productId });
        }else{
            reviews = await BookReviews.find();
        }


        if (!reviews) {
            res.status(500).json({ success: false })
        }

        return res.status(200).json(reviews);

    } catch (error) {
        res.status(500).json({ success: false })
    }


});
// http://localhost:4000/api/review/count
router.get(`/count`, async (req, res) =>{
    const bookReviews = await BookReviews.countDocuments()

    if(!bookReviews) {
        res.status(500).json({success: false})
    } 
    res.send({
        bookReviews: bookReviews
    });
})



router.get('/:id', async (req, res) => {

    const review = await BookReviews.findById(req.params.id);

    if (!review) {
        return res.status(500).json({ message: 'The review with the given ID was not found.' })
    }
    return res.status(200).send(review);
})
// http://localhost:4000/api/review/
router.post('/', async (req, res) => {
    
    let review = new BookReviews({
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        review:req.body.review,
        productId: req.body.productId
    });

    if (!review) {
        res.status(500).json({
            error: err,
            success: false
        })
    }

    review = await review.save();

    res.status(201).json(review);

});
//Update review by custumerId
router.put('/:id', async (req, res) => {
    const reviewId = req.params.id;
    const { customerId } = req.body;

    try {
        // Find the review by ID
        const review = await BookReviews.findById(reviewId);

        // If review not found, return 404
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // // Check if the customerId from the request matches the customerId in the review
        // if (review.customerId !== customerId) {
        //     return res.status(403).json({ message: 'You are not authorized to update this review' });
        // }

        // Update the review with new data
        const updatedReview = await BookReviews.findByIdAndUpdate(
            reviewId,
            req.body,
            { new: true }
        );

        // Return the updated review
        res.status(200).json(updatedReview);
    } catch (error) {
        console.error(`Error updating review: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete review by customerId
router.delete('/customer/:id', async (req, res) => {
    const reviewId = req.params.id;
    const { customerId } = req.body;

    try {
        // Find the review by ID
        const review = await BookReviews.findById(reviewId);

        // If review not found, return 404
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the customerId from the request matches the customerId in the review
        if (review.customerId !== customerId) {
            return res.status(403).json({ message: 'You are not authorized to delete this review' });
        }

        // Delete the review
        await BookReviews.findByIdAndDelete(reviewId);

        // Return a success message
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(`Error deleting review: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete review by admin
router.delete('/:id', async (req, res) => {
    const reviewId = req.params.id;

    try {
        // Find the review by ID
        const review = await BookReviews.findById(reviewId);

        // If review not found, return 404
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Delete the review
        await BookReviews.findByIdAndDelete(reviewId);

        // Return a success message
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(`Error deleting review: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});
module.exports = router;