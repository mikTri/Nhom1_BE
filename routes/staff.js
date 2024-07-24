
const { Staff } = require('../models/staff');
const { ImageUpload } = require('../models/imageUpload');

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const multer = require('multer');
const fs = require("fs");
const cloudinary = require("../helper/cloudinary");

require('dotenv').config();



// Cấu hình Multer để lưu trữ tạm thời ảnh tải lên:
var imagesArr = [];
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
        //imagesArr.push(`${Date.now()}_${file.originalname}`)
    },
})
const upload = multer({ storage: storage })


// POST (images)
router.post('/uploadStaffImage', async (req, res) => {
    // console.log(req.body);
    const {image} =  req.body;
    const uploadedImage = await cloudinary.uploader.upload(image, 
        {
        folder: 'Staff_Avatar',
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

// POST (Sign up)
router.post(`/signup`, async (req, res) => {
    const { name, phone, address, email, password, role, images, createdDate } = req.body;

    try {
        const existingStaff = await Staff.findOne({ email: email });
        const existingStaffByPh = await Staff.findOne({ phone: phone });

        if (existingStaff && existingStaffByPh) {
            res.status(400).json({error:true, msg: "Tài khoản này đã tồn tại!" })
        }

        const hashPassword = await bcrypt.hash(password,10);

        const result = await Staff.create({
                                        name:name,
                                        phone:phone,
                                        address: address,
                                        email:email,
                                        password:hashPassword,
                                        role: role,    
                                        images: images || [],
                                        createdDate: createdDate || Date.now()
                                        });

        const token = jwt.sign({email:result.email, id: result._id}, process.env.JSON_WEB_TOKEN_SECRET_KEY);
        res.status(200).json({ staff:result, token:token })
    } 
    catch (error) {
        console.log(error);
        res.status(500).json({error:true, msg:"Lỗi"});
    }
})


// POST (Sign in)
router.post(`/signin`, async (req, res) => {
    const {email, password} = req.body;

    try{
        const existingStaff = await Staff.findOne({ email: email });
        if(!existingStaff){
            return res.status(404).json({error:true, msg:"Tài khoản của bạn không tồn tại!"});
        }

        const matchPassword = await bcrypt.compare(password, existingStaff.password);
        if(!matchPassword){
            return res.status(400).json({error:true,msg:"Mật khẩu của bạn không đúng!"})
        }

        const token = jwt.sign({email:existingStaff.email, id: existingStaff._id}, process.env.JSON_WEB_TOKEN_SECRET_KEY);
        console.log({ staff:existingStaff, token:token, msg:"staff Authenticated" });

       return res.status(200).send({ staff:existingStaff, token:token, msg:"staff Authenticated" });
    }
    catch (error) {
        res.status(500).json({error:true,msg:"Lỗi đăng nhập!"});
    }

})

// GET (staffList)   (ok)
router.get(`/`, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage);
    const totalPosts = await Staff.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
        return res.status(404).json({ message: "Page not found" })
    }

	const staffList = await Staff.find();
	if(!staffList) {
		res.status(500).json({success: false})
	} 
	return res.status(200).json({
								"staffs": staffList,
								"totalPages": totalPages,
								"page": page
							});
});

// GET (staff theo id)
router.get('/:id', async(req,res)=>{
    const staff = await Staff.findById(req.params.id);

    if(!staff) {
        res.status(500).json({message: 'The staff with the given ID was not found.'})
    } 
    res.status(200).send(staff);
})

// GET (theo số lượng)
router.get(`/get/count`, async (req, res) =>{
    const staffCount = await Staff.countDocuments()

    if(!staffCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        staffCount: staffCount
    });
})

// PUT (thay đổi name, phone, address, email, image, role theo ID)
router.put('/:id',async (req, res)=> {

    const { name, phone, email, address, images, role} = req.body;

    const staffExist = await Staff.findById(req.params.id);
    if(!staffExist){
        res.status(404).json({error:true, msg:"Tài khoản không tồn tại"})
    }

    // // change password
    // if(req.body.password) {
    //     newPassword = bcrypt.hashSync(req.body.password, 10)
    // } else {
    //     newPassword = staffExist.password;
    // }

    const staff = await Staff.findByIdAndUpdate(
        req.params.id,
        {
            name:name,
            phone:phone,
            email:email,
            address:address,
            images: images,
            role: role,
        },
        { new: true}
    )

    if(!staff)
    return res.status(400).send('Tài khoản không cập nhật thành công!')

    res.send(staff);
})

// PUT (đổi password - dành cho staff tự đổi)
router.put('/changePassword/:id', async (req, res) => {
    const { email, password, newPass } = req.body;

    try {
        console.log("Received request to change password for email");

        // Tìm nhân viên bằng email
        const existingStaff = await Staff.findOne({ email: email });
        if (!existingStaff) {
            console.log("Staff not found with email:", email);
            return res.status(404).json({ error: true, msg: "Không tìm thấy email của bạn!" });
        }
        console.log("Staff found:", existingStaff);

        // Kiểm tra mật khẩu hiện tại
        const matchPassword = await bcrypt.compare(password, existingStaff.password);
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
                const staff = await Staff.findByIdAndUpdate(
                    req.params.id,
                    { password: newPassword },
                    { new: true }
                );
        
                if (!staff) {
                    console.log("Failed to update staff with id:", req.params.id);
                    return res.status(400).json({ error: true, msg: 'Không thể cập nhật mật khẩu cho nhân viên!' });
                }
                else{
                    console.log("Staff password updated successfully:", staff);
        
                    res.json({ success: true, staff });
                }
                
            }
            
        }
        
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: true, msg: "Server error" });
    }
})


// PUT (đổi password - dành cho Admin đổi cho staff (không cần nhập password cũ))
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
        const updatedUser = await Staff.findByIdAndUpdate(
            req.params.id,
            { password:hashedPassword },
            { new: true}
        );
    
        if(!updatedUser){
            return res.status(400).send('Không thể cập nhật mật khẩu cho nhân viên!');
        }
        console.log("update new user password");
            
        res.json({ success: true, staff: updatedUser });

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

// DELETE (staff theo id)    (ok)
router.delete('/:id', async(req, res)=>{
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);

    if (!deletedStaff) {
        res.status(404).json({ message: 'Staff not found!', success: false })
    }
    res.status(200).json({ success: true, message: 'the staff is deleted!' })
})



module.exports = router;




















// router.post(`/upload`, upload.array("images"), async (req, res) => {
//     imagesArr=[];

//     try{
//         for (let i = 0; i < req?.files?.length; i++) {
//             const options = {
//                 use_filename: true,
//                 unique_filename: false,
//                 overwrite: false,
//             };
    
//             const img = await cloudinary.uploader.upload(req.files[i].path, options,
//                 function (error, result) {
//                     imagesArr.push(result.secure_url);
//                     fs.unlinkSync(`uploads/${req.files[i].filename}`);  // Delete local file after upload
//                 });
//         }

//         let imagesUploaded = new ImageUpload({
//             images: imagesArr,
//         });

//         imagesUploaded = await imagesUploaded.save();
//         return res.status(200).json(imagesArr);

//     }catch(error){
//         console.log(error);
//     }

// });
