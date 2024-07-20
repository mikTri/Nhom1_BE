const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsSchema = new Schema({
    email: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

//aaaaa
exports.News = mongoose.model('News', newsSchema);