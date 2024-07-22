const mongoose = require('mongoose');

const booksSchema = new mongoose.Schema({
    title: String,
    author: String,
    rating: Number,
    description: String,
    language: String,
    genres: String,
    pages: Number,
    basePrice: { type: Number, required: true },
    discountPercent:  {type: Number, default: 0 },
    discountPrice: Number,
    publisher: String,
    cover: String,
    salesNum: { type: Number,  default: 0 },
    isFSale: { type:Boolean, default: false }
});


booksSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

booksSchema.set('toJSON', {
    virtuals: true,
});

exports.Book = mongoose.model('book', booksSchema);