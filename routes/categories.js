const { Category } = require('../models/categories.js');
const express = require('express');
const router = express.Router();


router.get(`/`, async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;
        const totalPosts = await Category.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return res.status(404).json({ message: "No data found!" })
        }

        const categoryList = await Category.find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();


        if (!categoryList) {
            res.status(500).json({ success: false })
        }

        return res.status(200).json({
            "categoryList": categoryList,
            "totalPages": totalPages,
            "page": page
        });

    } catch (error) {
        res.status(500).json({ success: false })
    }
});

// GET (cat theo id)
router.get('/:id', async(req,res)=>{
    const cat = await Category.findById(req.params.id);
    if(!cat) {
        res.status(500).json({message: 'The category with the given ID was not found.'})
    } 
    res.status(200).send(cat);
})

router.post('/add', async (req, res) => {
    try {
        const { name } = req.body;

        // Kiểm tra xem name đã tồn tại chưa
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ status: false, msg: "Category already exists" });
        }

        // Tạo category mới với ctnBook mặc định là 0
        const newCategory = new Category({
            name
        });

        // Lưu category mới
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (err) {
        res.status(500).json({ error: err.message, success: false });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Tìm và xóa category
        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
});

// ok
router.get('/get/count', async (req, res) => {
    try {
        const categoryCount = await Category.countDocuments();

        res.status(200).json({
            success: true,
            categoryCount: categoryCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving category count',
            error: error.message
        });
    }
});

module.exports = router;


