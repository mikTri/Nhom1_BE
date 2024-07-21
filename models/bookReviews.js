const mongoose = require('mongoose');

const bookReviewsSchema = mongoose.Schema({
    productId:{
        type:String,
        required:true
    },
    customerName:{
        type:String,
        required:true
    },
    customerId:{
        type:String,
        required:true
    },
    review:{
        type:String,
        required:true,
        default:""
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    isVisible: {
        type: Boolean,
        required:true,
        default: true
    }
})
exports.BookReviews = mongoose.model('BookReviews', bookReviewsSchema);