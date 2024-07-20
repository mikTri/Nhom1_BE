require("dotenv").config();

const express = require("express");
const router = express.Router();
const cloudinary = require("../helper/cloudinary");
const cloudinaryClientFolder = process.env.cloudinary_folder_userAvatar;
const cloudinaryStaffFolder = process.env.cloudinary_folder_staffAvatar;


// post to client folder
router.post("/uploadImage", async(req, res)=>{
  // console.log(req.body);
  const {image} =  req.body;
  const uploadedImage = await cloudinary.uploader.upload(image, {
      folder: cloudinaryClientFolder,
      // upload_preset: 'unsigned_upload',
      allowed_formats: ['png', 'jpg', 'jpeg', 'svg', 'ico', 'jfif', 'webp'],
    },

    function(error, result){  
      if(error){ console.log(error); }
      console.log(result); 
    } 
  );

  try {
      res.status(200).json(uploadedImage);
  } catch (error) {
      console.log(error);
  }

});


// post to staff folder
router.post("/uploadStaffImage", async(req, res)=>{
  // console.log(req.body);
  const {image} =  req.body;
  const uploadedImage = await cloudinary.uploader.upload(image, {
      folder: cloudinaryStaffFolder,
      // upload_preset: 'unsigned_upload',
      allowed_formats: ['png', 'jpg', 'jpeg', 'svg', 'ico', 'jfif', 'webp'],
    },

    function(error, result){  
      if(error){ console.log(error); }
      console.log(result); 
    } 
  );

  try {
      res.status(200).json(uploadedImage);
  } catch (error) {
      console.log(error);
  }

});

module.exports = router;
