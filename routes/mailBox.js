const { MailBox } = require('../models/mailBox.js');
const express = require('express');
const router = express.Router();

//Create new Mail || http://localhost:4000/api/mailBox/
router.post('/', async (req, res) => { // Ensure the endpoint is '/create'
  try {
    const { name, email, title, content } = req.body;

    // Validate required fields
    if (!name || !email || !title || !content) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new MailBox entry
    const newMail = new MailBox({
      name,
      email,
      title,
      content
    });

    // Save the entry to the database
    await newMail.save();

    res.status(201).json({ message: 'Mail saved successfully', mail: newMail });
  } catch (error) {
    res.status(500).json({ message: 'Error saving mail', error: error.message });
  }
});
//Get by ID
router.get('/:id', async (req, res) => {
  try {
    const mailId = req.params.id;

    const mail = await MailBox.findById(mailId);

    if (!mail) {
      return res.status(404).json({ message: 'Mail not found' });
    }

    res.status(200).json(mail);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mail', error: error.message });
  }
});
//get all || http://localhost:4000/api/mailBox/
router.get('/', async (req, res) => {
  try {
      const mails = await MailBox.find();
      res.status(200).json(mails);
  } catch (error) {
      console.error('Error fetching mails:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;