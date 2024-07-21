const { Authors } = require('../models/authors.js');
const express = require('express');
const router = express.Router();


//get all (truc adds)
router.get(`/all`, async (req, res) => {
    try {

        const authorList = await Authors.find(req.query);

        if (!authorList) {
            res.status(500).json({ success: false })
        }

        return res.status(200).json(authorList);

    } catch (error) {
        res.status(500).json({ success: false })
    }
});

router.get(`/`, async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;

        // Lấy query parameter 'name'
        const name = req.query.name;

        // Tạo filter
        let filter = {};
        if (name) {
            filter.name = { $regex: name, $options: 'i' }; 
        }

        const totalAuthors = await Authors.countDocuments();
        const totalPages = Math.ceil(totalAuthors / perPage);

        if (page > totalPages) {
            return res.status(404).json({ message: "No data found!" })
        }

        // Lấy danh sách tác giả với phân trang và filter
        const authorList = await Authors.find(filter)
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!authorList) {
            res.status(500).json({ success: false })
        }

        return res.status(200).json({
            "authorList": authorList,
            "totalPages": totalPages,
            "page": page
        });

    } catch (error) {
        console.error(`Error fetching authors: ${error}`);
        res.status(500).json({ success: false })
    }
});

router.get('/get/count', async (req, res) => {
    try {
        const authorCount = await Authors.countDocuments();

        res.status(200).json({
            success: true,
            authorCount: authorCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving author count',
            error: error.message
        });
    }
});

// GET author theo Id
router.get("/:id", async (req, res) => {
  try {
    const author = await Authors.findById(req.params.id);
    if (!author) {
      console.log(`Author with ID: ${author._id} not found`);
      return res.status(404).json({ message: "Author not found" });
    }
    console.log(`Author found:`, author);
    res.status(200).json(author);
  } catch (error) {
    console.error(`Error fetching author: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post('/add', async (req, res) => {
    try {
        const { name } = req.body;

        // Kiểm tra xem name đã tồn tại chưa
        const existingAuthor = await Authors.findOne({ name });
        if (existingAuthor) {
            return res.status(400).json({ status: false, msg: "Author already exists" });
        }

        // Tạo category mới với ctnBook mặc định là 0
        const newAuthor = new Authors({
            name: req.body.name
        });

        // Lưu category mới
        await newAuthor.save();

        res.status(201).json(newAuthor);
    } catch (err) {
        res.status(500).json({ error: err.message, success: false });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const authorId = req.params.id;

        // Tìm và xóa category
        const deletedAuthor = await Authors.findByIdAndDelete(authorId);

        if (!deletedAuthor) {
            return res.status(404).json({ success: false, message: 'Author not found' });
        }

        return res.status(200).json({ success: true, message: 'Author deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message, success: false });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const authorId = req.params.id;
        const { name, ctnBook, isNominated } = req.body;

        // Tìm tác giả theo ID
        const author = await Authors.findById(authorId);
        if (!author) {
            return res.status(404).json({ success: false, message: 'Author not found' });
        }

        // Cập nhật thông tin tác giả
        author.name = name !== undefined ? name : author.name; // Nếu không có tên mới, giữ nguyên
        author.ctnBook = ctnBook !== undefined ? ctnBook : author.ctnBook; // Cập nhật nếu có
        author.isNominated = isNominated !== undefined ? isNominated : author.isNominated; // Cập nhật nếu có

        // Lưu thay đổi
        await author.save();

        return res.status(200).json({ success: true, author });
    } catch (err) {
        console.error(`Error updating author: ${err.message}`);
        return res.status(500).json({ error: err.message, success: false });
    }
});


module.exports = router;
