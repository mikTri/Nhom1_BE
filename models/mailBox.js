const mongoose = require('mongoose');

const mailBoxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  }
});

exports.MailBox = mongoose.model('mailBox', mailBoxSchema);