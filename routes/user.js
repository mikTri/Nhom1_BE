
const { User } = require('../models/user');
const { Staff } = require('../models/staff');
const { ImageUpload } = require('../models/imageUpload');

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const multer = require('multer');
const fs = require("fs");

const cloudinary = require("../helper/cloudinary");
const { Console } = require('console');

// Cấu hình Multer để lưu trữ tạm thời ảnh tải lên:
var imagesArr = [];
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
})
const upload = multer({ storage: storage })

// POST (images) 
router.post('/uploadImage', async (req, res) => {
    // console.log(req.body);
    const {image} =  req.body;
    const uploadedImage = await cloudinary.uploader.upload(image, 
        {
        folder: 'User_Avatar',
        upload_preset: 'unsigned_upload',
        allowed_formats: ['png', 'jpg', 'jpeg', 'svg', 'ico', 'jfif', 'webp'],
    },

    function(error, result){  
        if(error){
            console.log(error);
        }
        
        console.log(result); });

        try {
            res.status(200).json(uploadedImage);
        } catch (error) {
            console.log(error);
        }
})

// POST (signUp)
router.post(`/signup`, async (req, res) => {
    const { name, phone, address, email, password, isAdmin, images, createdDate } = req.body;

    try {
        const existingUser = await User.findOne({ email: email });
        const existingUserByPh = await User.findOne({ phone: phone });

        if (existingUser || existingUserByPh) {
            res.status(400).json({error:true, msg: "Tài khoản này đã tồn tại!" })
        }

        const hashPassword = await bcrypt.hash(password,10);

        const result = await User.create({
                                        name:name,
                                        phone:phone,
                                        address: address,
                                        email:email,
                                        password:hashPassword,
                                        isAdmin: false,
                                        images: images || [],
                                        createdDate: createdDate || Date.now()
                                        });

        const token = jwt.sign({email:result.email, id: result._id}, process.env.JSON_WEB_TOKEN_SECRET_KEY);
        res.status(200).json({user:result, token:token })
    } 
    catch (error) {
        console.log(error);
        res.status(500).json({error:true, msg:"Lỗi"});
    }
})

// POST (Sign in) (ok)
router.post(`/signin`, async (req, res) => {
    const {email, password} = req.body;

    try{
        const existingUser = await User.findOne({ email: email });
        if(!existingUser){
            return res.status(404).json({error:true, msg:"User not found!"});
        }

        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if(!matchPassword){
            return res.status(404).json({error:true,msg:"Mật khẩu của bạn không đúng!"});
        }

        const token = jwt.sign({email:existingUser.email, id: existingUser._id}, process.env.JSON_WEB_TOKEN_SECRET_KEY);
        console.log({ user:existingUser,  token:token, msg:"user Authenticated" });

       return res.status(200).send({ user:existingUser, token:token, msg:"user Authenticated" });
    }
    catch (error) {
       res.status(500).json({error:true,msg:"Lỗi đăng nhập!"});
    }
})


// GET (userList)   (ok)
router.get(`/`, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalUserPosts = await User.countDocuments();
    const totalPages = Math.ceil(totalUserPosts / perPage);

    if (page > totalPages) {
        return res.status(404).json({ message: "Page not found" })
    }

	const userList = await User.find();
	if(!userList) {
		res.status(500).json({success: false})
	} 
	return res.status(200).json({
								"users": userList,
								"totalPages": totalPages,
								"page": page
							});
});


// GET (user theo id)
router.get('/:id', async(req,res)=>{
    const user = await User.findById(req.params.id);

    if(!user) {
        res.status(500).json({message: 'The user with the given ID was not found.'})
    } 
    res.status(200).send(user);
})


// DELETE (user theo id)    (ok)
router.delete('/:id', async(req, res)=>{
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
        res.status(404).json({ message: 'Không tìm thấy tài khoản này!', success: false })
    }
    res.status(200).json({ success: true, message: 'Tài khoản đã được xóa!' })
})


// GET (theo số lượng)
router.get(`/get/count`, async (req, res) =>{
    const userCount = await User.countDocuments()

    if(!userCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        userCount: userCount
    });
})


// PUT (thay đổi name, phone, address, email, image theo ID) (ok)
router.put('/:id',async (req, res)=> {

    const { name, phone, email, address, images} = req.body;

    // check ID 
    const userExist = await User.findById(req.params.id);
    if(!userExist){
        res.status(404).json({error:true, msg:"Tài khoản không tồn tại"})
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name:name,
            phone:phone,
            email:email,
            address:address,
            images: images
        },
        { new: true}
    )

    if(!user)
    return res.status(400).send('Tài khoản không cập nhật thành công!')

    res.send(user);
})

// PUT (đổi password - dành cho user tự đổi)
router.put('/changePassword/:id', async (req, res) => {
    const { email, password, newPass } = req.body;

    try {
        console.log("Received request to change password for email");

        // Tìm nhân viên bằng email
        const existingUser = await User.findOne({ email: email });
        if (!existingUser) {
            console.log("User not found with email:", email);
            return res.status(404).json({ error: true, msg: "Không tìm thấy email của bạn!" });
        }
        console.log("User found:", existingUser);

        // Kiểm tra mật khẩu hiện tại
        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if (!matchPassword) {
            console.log("Current password is incorrect for email:", email, ", " , password, ", ", newPass);
            return res.status(400).json({ error: true, msg: "Mật khẩu hiện tại không đúng" });
        }
        else{
            console.log("Current password is correctL: ", email, ", " , password, ", ", newPass);

            // Kiểm tra mật khẩu mới
            if (!newPass) {
                console.log("New password is not provided", email, ", " , password, ", ", newPass);
                return res.status(400).json({ error: true, msg: "Vui lòng cùng cấp mật khẩu mới" });
            }
            else{
                console.log("New password provided");
    
                const newPassword = bcrypt.hashSync(newPass, 10);
                console.log("New password hashed");
        
                // Cập nhật mật khẩu
                const user = await User.findByIdAndUpdate(
                    req.params.id,
                    { password: newPassword },
                    { new: true }
                );
        
                if (!user) {
                    console.log("Failed to update User with id:", req.params.id);
                    return res.status(400).json({ error: true, msg: 'Không thể cập nhật mật khẩu cho nhân viên!' });
                }
                else{
                    console.log("User password updated successfully:", user);
        
                    res.json({ success: true, user });
                }
            }
        }
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: true, msg: "Server error" });
    }
})


// PUT (đổi password - dành cho Admin đổi cho user (không cần nhập password cũ))
router.put(`/changePasswordbyAdmin/:id`, async (req, res) => {
    const { email, password, newPass } = req.body;
    console.log("email, password, newPassword:  ", email, password, newPass);

    try {
        // Tìm admin bằng email
        const admin = await Staff.findOne({ email: email });
        if (!admin || admin.role !== 1) {
            return res.status(403).json({ error: true, msg: 'Đây không phải là tài khoản admin' });
        }
        console.log("Tìm admin bằng email thành công");

        // Xác thực mật khẩu admin
        const matchPassword = await bcrypt.compare(password, admin.password);
        if (!matchPassword) {
            return res.status(401).json({ error: true, msg: 'Mật khẩu admin không đúng' });
        }
        console.log("Xác thực mật khẩu admin thành công");

        // Kiểm tra xem mật khẩu mới có hợp lệ không
        if (!newPass || typeof newPass !== 'string') {
            console.log("Mật khẩu mới không hợp lệ hoặc không được cung cấp");
            return res.status(400).json({ error: true, msg: 'Mật khẩu mới không hợp lệ' });
        }

        // Hash the user's password 
        const hashedPassword = await bcrypt.hash(newPass, 10);

        // update new user's password
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { password:hashedPassword },
            { new: true}
        );
    
        if(!updatedUser){
            return res.status(400).send('Không thể cập nhật mật khẩu cho nhân viên!');
        }
        console.log("update new user password");
            
        res.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Lỗi cập nhật mật khẩu bằng tài khoản admin", error);
        res.status(500).json({ error: 'Server error' });
    }
});


//DELETE (xóa hình ảnh)
router.delete('/deleteImage', async (req, res) => {
    try {
        const imgUrl = req.query.img;
        if (!imgUrl) {
            return res.status(400).json({ error: "Missing image URL" });
        }

        const urlArr = imgUrl.split('/');
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split('.')[0];

        // Delete image from Cloudinary
        const response = await cloudinary.uploader.destroy(imageName);

        if (response.result === 'ok') {
            res.status(200).json({ message: "Image deleted successfully" });
        } else {
            res.status(400).json({ error: "Failed to delete image" });
        }
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;