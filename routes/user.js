
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

// router.post('/signup', async (req, res) => {
//     const { name, phone, address, email, password, isAdmin, images, createdDate } = req.body;
  
//     console.log("Received signup request with data:", req.body);
  
//     try {
//       // Kiểm tra xem email đã tồn tại chưa
//       const existingUser = await User.findOne({ email: email });
//       if (existingUser) {
//         return res.status(400).json({ error: true, msg: "Email đã được sử dụng!" });
//       }
  
//       // Mã hóa mật khẩu
//       const hashedPassword = await bcrypt.hash(password, 10);
  
//       // Tạo người dùng mới
//       const newUser = new User({
//         name: name,
//         phone: phone,
//         address: address,
//         email: email,
//         password: hashedPassword,
//         isAdmin: isAdmin || false,
//         images: images || [],
//         createdDate: createdDate || Date.now()
//       });
  
//       console.log("New user data to be saved:", newUser);
  
//       // Lưu người dùng vào MongoDB
//       await newUser.save();
  
//       // Tạo JWT token
//       const token = jwt.sign({ email: newUser.email, id: newUser._id }, process.env.JSON_WEB_TOKEN_SECRET_KEY);
  
//       // Trả về kết quả thành công
//       res.status(201).json({ user: newUser, token: token });
//     } 
//     catch (error) {
//       console.error('Lỗi khi đăng ký:', error);
//       res.status(500).json({ error: true, msg: 'Đăng ký không thành công' });
//     }
    
//   });

// router.post('/changePassword/:id', async (req, res) => {
//     const { oldPassword, newPassword } = req.body;
//     const userId = req.params.id;

//     try {
//         // Tìm người dùng trong cơ sở dữ liệu
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ error: true, msg: 'Người dùng không tồn tại' });
//         }

//         // So sánh mật khẩu cũ
//         const isMatch = await bcrypt.compare(oldPassword, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ error: true, msg: 'Mật khẩu cũ không chính xác' });
//         }

//         // Mã hóa mật khẩu mới
//         const hashedNewPassword = await bcrypt.hash(newPassword, 10);

//         // Cập nhật mật khẩu mới vào cơ sở dữ liệu
//         user.password = hashedNewPassword;
//         await user.save();

//         // Trả về kết quả thành công
//         res.json({ success: true, msg: 'Mật khẩu đã được thay đổi thành công' });
//     } catch (error) {
//         console.error('Lỗi khi thay đổi mật khẩu:', error);
//         res.status(500).json({ error: true, msg: 'Đã xảy ra lỗi khi thay đổi mật khẩu' });
//     }
// }); 


// POST (Sign in) (ok)
router.post(`/signin`, async (req, res) => {
    const {email, password} = req.body;

    try{
        const existingUser = await User.findOne({ email: email });
        if(!existingUser){
            res.status(404).json({error:true, msg:"User not found!"});
        }

        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if(!matchPassword){
            return res.status(400).json({error:true,msg:"Mật khẩu của bạn không đúng!"});
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
router.put(`/changePassword/:id`, async (req, res) => {
   
    const { name, phone, email, password, newPass, images } = req.body;

   // console.log(req.body)
    const existingUser = await User.findOne({ email: email });
    if(!existingUser){
        res.status(404).json({error:true, msg:"User not found!"})
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if(!matchPassword){
        return res.json({error:true,msg:"current password wrong"})
    }
    else{
        let newPassword
        if(newPass) {
            newPassword = bcrypt.hashSync(newPass, 10)
        } else {
            newPassword = existingUser.password;
        }
     
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                name:name,
                phone:phone,
                email:email,
                password:newPassword,
                images: images,
            },
            { new: true}
        )
    
        if(!user)
        return res.status(400).send('the user cannot be Updated!')
    
        res.send(user);
    }
})

// PUT (đổi password - dành cho Admin đổi cho user (không cần nhập password cũ))
router.put(`/changePasswordbyAdmin/:id`, async (req, res) => {
    const { email, password, role, newPassword } = req.body;

    try {
        // Check if staff is authenticated and has admin role (role = 1)
        const staff = await Staff.findOne({ email: email, password: password, role: 1 });
        if (!staff) {
            return res.status(401).json({ error: 'Unauthorized access' });
        }

        // Hash the new password before updating
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const userUpd = await User.findByIdAndUpdate(
            req.params.id,
            {
                password:hashedPassword
            },
            { new: true}
        );
    
        if(!userUpd)
            return res.status(400).send('the user cannot be Updated!');
    
        res.send(userUpd);

    } catch (error) {
        console.error(error);
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