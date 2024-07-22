const { Book } = require('../models/books.js');
const { Category } = require('../models/categories.js');
const { Authors } = require('../models/authors.js');

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: 'uploads/' }); // Temp folder to save file

//upload from csv file
router.post('/upload', upload.single('file'), async (req, res) => {
  const results = [];

  console.log('File uploaded:', req.file); // Check file uploaded

  fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', async (data) => {
          console.log('Parsed data:', data); // Check parsed data

          // Clean data
          const basePrice = parseFloat(data.basePrice);
          const discountPercent = data.discountPercent ? parseFloat(data.discountPercent) : 0; // Mặc định là 0
          const discountPrice = basePrice * (1 - discountPercent / 100); // Tính toán lại discountPrice

          const cleanedData = {
              title: data.title ? data.title.trim() : '',
              author: data.author ? data.author.trim() : '',
              rating: parseFloat(data.rating),
              description: data.description ? data.description.trim() : '',
              language: data.language ? data.language.trim() : '',
              genres: data.genres ? data.genres.trim() : '',
              pages: parseInt(data.pages),
              // basePrice: parseFloat(data.basePrice),
              // discountPercent: data.discountPercent ? parseFloat(data.discountPercent) : 0, // Default 0
              // discountPrice: parseFloat(data.discountPrice),
              basePrice: basePrice,
              discountPercent: discountPercent,
              discountPrice: discountPrice,
              publisher: data.publisher ? data.publisher.trim() : '',
              cover: data.cover ? data.cover.trim() : '',
              salesNum: data.salesNum ? parseInt(data.salesNum) : 0, // Default 0
              isFSale: data.isFSale !== undefined ? data.isFSale === 'true' : undefined // Kiểm tra isFSale, nếu không có thì để undefined để model dùng mặc định
          };

          console.log('Cleaned title:', cleanedData.title); // Check cleaned title
          if (cleanedData.title) {
              // Kiểm tra và cập nhật ctnBook
              let categoryDoc = await Category.findOne({ name: cleanedData.genres });
              if (!categoryDoc) {
                  console.log(`Category not found. Creating new category: ${cleanedData.genres}`);
                  categoryDoc = new Category({ name: cleanedData.genres, ctnBook: 0 });
                  await categoryDoc.save();
              } else {
                  console.log(`Category found: ${categoryDoc.name}`);
              }

              // Check and update ctnBook for author
              let authorDoc = await Authors.findOne({ name: cleanedData.author });
              if (!authorDoc) {
                  console.log(`Author not found. Creating new author: ${cleanedData.author}`);
                  authorDoc = new Authors({ name: cleanedData.author, ctnBook: 0 });
                  await authorDoc.save();
              } else {
                  console.log(`Author found: ${authorDoc.name}`);
              }


              // Add book
              const book = new Book(cleanedData);
              try {
                  await book.save();
                  console.log('Book added:', cleanedData.title);
                  // Increase ctnBook
                  if (categoryDoc) {
                      await Category.updateOne(
                          { _id: categoryDoc._id },
                          { $inc: { ctnBook: 1 } }
                      );
                      console.log(`Incremented ctnBook for category: ${categoryDoc.name}`);
                  }

                  // Increase ctnBook for author
                  if (authorDoc) {
                      await Authors.updateOne(
                          { _id: authorDoc._id },
                          { $inc: { ctnBook: 1 } }
                      );
                      console.log(`Incremented ctnBook for author: ${authorDoc.name}`);
                  }
              } catch (error) {
                  console.error('Error adding book:', error);
              }
          } else {
              console.error('Book title is missing. Skipping this entry.');
          }
      })
      .on('end', async () => {
          console.log('CSV processing completed.');
          fs.unlinkSync(req.file.path); // Xóa file tạm
          res.status(201).json({ message: 'Books added successfully!' });
      })
      .on('error', (error) => {
          console.error('Error processing CSV:', error);
          res.status(500).json({ message: 'Error processing CSV' });
      });
});

router.get(`/all`, async (req, res) => {

  try {

      const bookList = await Book.find(req.query);

      if (!bookList) {
          res.status(500).json({ success: false })
      }

      return res.status(200).json(bookList);

  } catch (error) {
      res.status(500).json({ success: false })
  }
});

//get all books
router.get(`/`, async (req, res) => {
  try {
      const booksPerPage = req.query.booksPerPage ? parseInt(req.query.booksPerPage) : 20;
      const page = req.query.page ? parseInt(req.query.page) : 0; 
      
      const filters = {};
      if (req.query.title) {
          filters.title = req.query.title;
      }
      if (req.query.author) {
          const author = req.query.author;
          
      }
      if (req.query.language) {
          filters.language = req.query.language;
      }
      if (req.query.genres) {
          // Handle multiple genres, split by comma and trim spaces
          const genresArray = req.query.genres.split(',').map(genre => genre.trim());
          // Use $in operator to find books with any of the specified genres
          filters.genres = { $in: genresArray };
      }
      
      const totalBooks = await Book.countDocuments(filters);
      const bookList = await Book.find(filters)
          .limit(booksPerPage)
          .skip(booksPerPage * page);
      
      if (!bookList) {
          return res.status(500).json({ success: false });
      }

      return res.status(200).json({
          "books": bookList,
          "totalBooks": totalBooks,
          "page": page,
          "booksPerPage": booksPerPage
      });
  
  }catch(e) {
      console.log(`api, ${e}`);
      res.status(500).json({ error: e });
  }
});

//get count book
router.get('/get/count', async (req, res) => {
  try {
      const booksCount = await Book.countDocuments();

      res.status(200).json({
          success: true,
          booksCount: booksCount
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Error retrieving book count',
          error: error.message
      });
  }
});

// GET a single book by ID
router.get('/get-single-book/:id', async (req, res) => {
  try {
      const bookId = req.params.id;

      // Validate if the provided ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
          return res.status(400).json({ message: "Invalid book ID" });
      }

      // Find the book by ID in the database
      const book = await Book.findById(bookId);

      // If book is not found, return a 404 error
      if (!book) {
          return res.status(404).json({ message: "Book not found" });
      }

      // If book is found, return it as JSON
      res.status(200).json(book);

  } catch (e) {
      console.error(`Error fetching book: ${e}`);
      res.status(500).json({ error: "Internal server error" });
  }
});

// GET a single book by name
// router.get('/', async (req, res) => {
//   try {
//       const bookName = req.query.name;

//       // Validate if the provided name is present
//       if (!bookName) {
//           return res.status(400).json({ message: "Book name parameter is required" });
//       }

//       // Find the book by name in the database
//       const book = await Book.findOne({ title: bookName });

//       // If book is not found, return a 404 error
//       if (!book) {
//           return res.status(404).json({ message: "Book not found" });
//       }

//       // If book is found, return it as JSON
//       res.status(200).json(book);

//   } catch (e) {
//       console.error(`Error fetching book: ${e}`);
//       res.status(500).json({ error: "Internal server error" });
//   }
// });

// Get books on flash sale
router.get("/flash-sale-books", async (req, res) => {
    try {
      const flashSaleBooks = await Book.find({ isFSale: true });
  
      if (flashSaleBooks.length === 0) {
        return res.status(404).json({
          message: "No books found on flash sale.",
          status: false,
        });
      }
  
      res.status(200).json({
        message: "Sach dang flah sale la:",
        status: true,
        books: flashSaleBooks,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Internal server error while retrieving books on flash sale.",
        status: false,
        error: err.message,
      });
    }
  });

//post new book
router.post('/', async (req, res) => {
  try {
      //Check existingBook
      console.log("Request body:", req.body);
      const existingBook = await Book.findById(req.body._id);
      if (existingBook) {
          console.log("Book already exists:", existingBook);
          return res.status(400).json({ success: false, message: 'Book already exists!'});
      }

      //Check genres - categories
      console.log("Genres:", req.body.genres); 
      let categoryDoc = await Category.findOne({ name: req.body.genres });
      if (!categoryDoc) {
          console.log(`Category not found. Creating new category: ${req.body.genres}`);
          categoryDoc = new Category({ name: req.body.genres, ctnBook: 0 });
          await categoryDoc.save();
          console.log("New category created:", categoryDoc);
      } else {
          console.log("Category found:", categoryDoc);
      }

      // Check authors
      console.log("Author:", req.body.author);
      let authorDoc = await Authors.findOne({ name: req.body.author });
      if (!authorDoc) {
          console.log(`Author not found. Creating new author: ${req.body.author}`);
          authorDoc = new Authors({ name: req.body.author, ctnBook: 0 });
          await authorDoc.save();
          console.log("New author created:", authorDoc);
      } else {
          console.log("Author found:", authorDoc);
      }

      //Create newBook
      const basePrice = parseFloat(req.body.basePrice);
      const discountPercent = req.body.discountPercent ? parseFloat(req.body.discountPercent) : 0; // Mặc định là 0
      const discountPrice = basePrice * (1 - discountPercent / 100); // Tính discountPrice

      const newBookData = {
          title: req.body.title,
          author: req.body.author,
          description: req.body.description,
          language: req.body.language,
          genres: req.body.genres,
          // pages: req.body.pages ? parseInt(req.body.pages) : null,
          pages: req.body.pages ? parseInt(req.body.pages) : undefined,
          basePrice: basePrice,
          discountPercent: discountPercent,
          discountPrice: discountPrice,
          publisher: req.body.publisher,
          cover: req.body.cover,
          isFSale: req.body.isFSale !== undefined ? req.body.isFSale : undefined // Mặc định sẽ được set trong model
      };
      
      let book = new Book(newBookData);

      // let book = new Book({
      //     title: req.body.title,
      //     author: req.body.author,
      //     brand: req.body.brand,
      //     rating: req.body.rating,
      //     description: req.body.description,
      //     language: req.body.language,
      //     genres: req.body.genres,
      //     pages: req.body.pages,
      //     basePrice: req.body.basePrice,
      //     discountPercent: req.body.discountPercent,
      //     discountPrice: req.body.discountPrice,
      //     publisher: req.body.publisher,
      //     cover: req.body.cover
      // });

      // Save book and check success
      book = await book.save();
      if (!book) {
          console.log("Failed to create book.");
          return res.status(500).json({ success: false, message: 'The book cannot be created!' });
      }
      console.log("Book created successfully:", book);

      //Increase ctnBook in Categories
      await Category.updateOne(
          { _id: categoryDoc._id },
          { $inc: { ctnBook: 1 } }
      );
      console.log(`Increased ctnBook for category: ${categoryDoc.name}`);

      // Increase ctnBook in Authors
      await Authors.updateOne(
      { _id: authorDoc._id },
      { $inc: { ctnBook: 1 } }
      );
      console.log(`Increased ctnBook for author: ${authorDoc.name}`);

      res.status(201).json(book);
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});

// GET top 5 books by rating
router.get('/top-rated', async (req, res) => {
  try {
      // Query the database to find top-rated books
      const topBooks = await Book.find()
          .sort({ rating: -1 }) // Sort by rating descending (-1)
          .limit(5); // Limit to 5 books
      
      // If no books are found, return a 404 error
      if (!topBooks || topBooks.length === 0) {
          return res.status(404).json({ message: "Top rated books not found" });
      }

      // Return the top rated books as JSON
      res.status(200).json(topBooks);

  } catch (e) {
      console.error(`Error fetching top rated books: ${e}`);
      res.status(500).json({ error: "Internal server error" });
  }
});

//delete book by id
router.delete("/:book_id", async (req, res) => {
const bookId = req.params.book_id;

try {
  console.log(`Attempting to delete book with ID: ${bookId}`);
  const deletedBook = await Book.findByIdAndDelete(bookId);

  if (!deletedBook) {
    console.log(`Book with ID: ${bookId} not found`);
    return res.status(404).json({ message: "Book not found" });
  }

  //Update ctnBook in Categories
  await Category.updateOne(
      { name: deletedBook.genres },
      { $inc: { ctnBook: -1 } }
  );
  console.log(`Updated category ${deletedBook.genres}: ctnBook decremented`);

  // Update ctnBook in Authors
  await Authors.updateOne(
      { name: deletedBook.author },
      { $inc: { ctnBook: -1 } }
    );
  console.log(`Updated author ${deletedBook.author}: ctnBook decremented`);

  //Delete book
  // await Book.findByIdAndDelete(bookId);
  console.log(`Book with ID: ${bookId} deleted successfully`);

  res.json({ status: true });
} catch (e) {
  console.error(`Error deleting book: ${e}`);
  res.status(500).json({ error: "Internal server error" });
}
});

//update book by id
router.put("/update/:book_id", async (req, res) => {
const bookId = req.params.book_id;

try {
  console.log(`Attempting to update book with ID: ${bookId}`);

  //Get current book
  const currentBook = await Book.findById(bookId);
  if (!currentBook) {
      console.log(`Book with ID: ${bookId} not found`);
      return res.status(404).json({ message: "Book not found" });
  }

  //Save old and new genre
  const oldGenres = currentBook.genres;
  const newGenres = req.body.genres || oldGenres;
  const oldAuthor = currentBook.author;
  const newAuthor = req.body.author || oldAuthor; // Use old author if new author is not provided

  console.log(`Old genres: ${oldGenres}, New genres: ${newGenres}`);
  console.log(`Old author: ${oldAuthor}, New author: ${newAuthor}`);

  // Update book
  const updatedBook = await Book.findByIdAndUpdate(bookId, req.body, {
    new: true,
  });

  if (!updatedBook) {
    console.log(`Failed to update book with ID: ${bookId}`);
    return res.status(404).json({ message: "Book not found" });
  }

  //Update ctnBook if genre changed
  if (oldGenres !== newGenres) {
      //Decrease ctnBook of old genre
      await Category.updateOne(
          { name: oldGenres },
          { $inc: { ctnBook: -1 } }
      );
      console.log(`Decremented ctnBook for old genre: ${oldGenres}`);

      //Find or create new genre
      let categoryDoc = await Category.findOne({ name: newGenres });
      if (!categoryDoc) {
          console.log(`Category not found. Creating new category: ${newGenres}`);
          categoryDoc = new Category({ name: newGenres, ctnBook: 0 });
          await categoryDoc.save();
          console.log("New category created:", categoryDoc);
      } else {
          console.log(`Category found: ${categoryDoc.name}`);
      }

      //Increase ctnBook of new genre
      await Category.updateOne(
          { _id: categoryDoc._id },
          { $inc: { ctnBook: 1 } }
      );
      console.log(`Incremented ctnBook for new genre: ${newGenres}`);
  }

  // Update ctnBook if author changed
  if (oldAuthor !== newAuthor) {
      // Decrease ctnBook of old author
      await Authors.updateOne(
        { name: oldAuthor },
        { $inc: { ctnBook: -1 } }
      );
      console.log(`Decremented ctnBook for old author: ${oldAuthor}`);

      // Find or create new author
      let authorDoc = await Authors.findOne({ name: newAuthor });
      if (!authorDoc) {
        console.log(`Author not found. Creating new author: ${newAuthor}`);
        authorDoc = new Authors({ name: newAuthor, ctnBook: 1 });
        await authorDoc.save();
        console.log("New author created:", authorDoc);
      } else {
        console.log(`Author found: ${authorDoc.name}`);
        // Increase ctnBook of new author
        await Authors.updateOne(
          { _id: authorDoc._id },
          { $inc: { ctnBook: 1 } }
        );
        console.log(`Incremented ctnBook for new author: ${newAuthor}`);
      }
  }

  console.log("Book updated successfully:", updatedBook);

  res.json(updatedBook);
} catch (e) {
  console.error(`Error updating book: ${e}`);
  res.status(500).json({ error: "Internal server error" });
}
});

// Recalculate ctnBook for each category
router.post('/recalculate-ctnBook-cat', async (req, res) => {
  try {
      console.log("Starting recalculation of ctnBook for each category");

      // Lấy tất cả các sách và nhóm chúng theo category
      const books = await Book.find();
      const categoryCounts = {};

      books.forEach(book => {
          const genre = book.genres;
          if (categoryCounts[genre]) {
              categoryCounts[genre]++;
          } else {
              categoryCounts[genre] = 1;
          }
      });

      console.log("Category counts calculated:", categoryCounts);

      // Cập nhật ctnBook cho mỗi category trong cơ sở dữ liệu
      for (const [genre, count] of Object.entries(categoryCounts)) {
          await Category.findOneAndUpdate(
              { name: genre },
              { ctnBook: count },
              { upsert: true } // Nếu không tìm thấy category thì sẽ tạo mới
          );
          console.log(`Updated ctnBook for category ${genre} to ${count}`);
      }

      // Xóa các category không có sách nào
      const categories = await Category.find();
      for (const category of categories) {
          if (!categoryCounts[category.name]) {
              category.ctnBook = 0;
              await category.save();
              console.log(`Set ctnBook for category ${category.name} to 0`);
          }
      }

      res.status(200).json({ message: "ctnBook recalculated for each category" });
  } catch (error) {
      console.error("Error recalculating ctnBook for each category:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

// Recalculate ctnBook for each author
router.post('/recalculate-ctnBook-authors', async (req, res) => {
  try {
      console.log("Starting recalculation of ctnBook for each author");

      // Lấy tất cả các sách và nhóm chúng theo author
      const books = await Book.find();
      const authorCounts = {};

      books.forEach(book => {
          const author = book.author;
          if (authorCounts[author]) {
              authorCounts[author]++;
          } else {
              authorCounts[author] = 1;
          }
      });

      console.log("Author counts calculated:", authorCounts);

      // Cập nhật ctnBook cho mỗi author trong cơ sở dữ liệu
      for (const [author, count] of Object.entries(authorCounts)) {
          await Authors.findOneAndUpdate(
              { name: author },
              { ctnBook: count },
              { upsert: true } // Nếu không tìm thấy author thì sẽ tạo mới
          );
          console.log(`Updated ctnBook for author ${author} to ${count}`);
      }

      // Xóa các author không có sách nào
      const authors = await Authors.find();
      for (const author of authors) {
          if (!authorCounts[author.name]) {
              author.ctnBook = 0;
              await author.save();
              console.log(`Set ctnBook for author ${author.name} to 0`);
          }
      }

      res.status(200).json({ message: "ctnBook recalculated for each author" });
  } catch (error) {
      console.error("Error recalculating ctnBook for each author:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

// GET top Num book with highest rating ok
router.get("/top-rating/:top_num", async (req, res) => {
    try {
      const top_num = parseInt(req.params.top_num);
  
      const topBooks = await Book.find({}).limit(top_num).sort({ rating: -1 });
  
      res.status(200).json(topBooks);
    } catch (e) {
      console.error(`Error fetching top books by rating: ${e}`);
      res.status(500).json({ error: "Internal server error" });
    }
});
  
// Get top books by sales number
// http://localhost:4000/api/books/top/5
router.get("/top-sales/:top_num", async (req, res) => {
    try {
      const top_num = parseInt(req.params.top_num);
  
      const topBooks = await Book.find({}).limit(top_num).sort({ salesNum: -1 });
  
      res.status(200).json(topBooks);
    } catch (e) {
      console.error(`Error fetching top books by sales number: ${e}`);
      res.status(500).json({ error: "Internal server error" });
    }
});
  
// GET top 5 books by rating from a specific author || test http://localhost:4000/api/books/top-rating?authors=Vincent%20Bugliosi,Ken%20Hurwitz
router.get("/top-rating", async (req, res) => {
    try {
      const authors = req.query.authors;
  
      if (!authors) {
        return res.status(400).json({ message: "Authors parameter is required" });
      }
  
      // Tach chuoi tac gia de xu ly truong hop co nhieu tac gia
      const authorList = authors.split(",");
  
      const topBooks = await Book.find({ author: { $in: authorList } })
        .sort({ rating: -1 }) // Sort by rating descending (-1)
        .limit(5); // Limit to 5 books
  
      if (!topBooks || topBooks.length === 0) {
        return res
          .status(404)
          .json({
            message: `Top rated books by the specified authors not found`,
          });
      }
  
      // Return the top rated books by the authors as JSON
      res.status(200).json(topBooks);
    } catch (e) {
      res.status(500).json({ success: false, message: error.message });
    }
});
  
//Get top rating book by genres
router.get("/top-rating-genres", async (req, res) => {
    try {
      let genres = req.query.genres;
  
      if (!genres) {
        return res.status(400).json({ message: "genres parameter is required" });
      }
  
      // Split genres by comma, trim spaces, and create an array
      const genresArray = genres.split(",").map(genre => genre.trim());
  
      const topBooks = await Book.find({ genres: { $in: genresArray } })
        .sort({ rating: -1 }) // Sort by rating descending (-1)
        .limit(5); // Limit to 5 books
  
      if (!topBooks || topBooks.length === 0) {
        return res.status(404).json({
          message: `Top rated books by the specified genres not found`,
        });
      }
  
      // Return the top rated books by the genres as JSON
      res.status(200).json(topBooks);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
//Get top 7 authors that have the most books
router.get('/top-authors', async (req, res) => {
    try {
        const topAuthors = await Book.aggregate([
            // Group by author and count the number of books per author
            { 
                $group: { 
                    _id: "$author", 
                    bookCount: { $sum: 1 } 
                } 
            },
            // Sort by bookCount in descending order
            { 
                $sort: { bookCount: -1 } 
            },
            // Limit to the top 7 results
            { 
                $limit: 7 
            }
        ]);
  
        // If no authors are found, return a 404 error
        if (topAuthors.length === 0) {
            return res.status(404).json({ message: "No authors found" });
        }
  
        // Return the top 7 authors with the most books as JSON
        res.status(200).json(topAuthors);
  
    } catch (e) {
        console.error(`Error fetching top authors: ${e}`);
        res.status(500).json({ error: "Internal server error" });
    }
  });
  
//Get all Genres
router.get('/genres', async (req, res) => {
    try {
        const genresWithCount = await Book.aggregate([
            { 
                $group: {
                    _id: "$genres",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    genre: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);
  
        // If no genres are found, return a 404 error
        if (genresWithCount.length === 0) {
            return res.status(404).json({ message: "No genres found" });
        }
  
        // Return the genres with count as JSON
        res.status(200).json(genresWithCount);
  
    } catch (e) {
        console.error(`Error fetching genres with count: ${e}`);
        res.status(500).json({ error: "Internal server error" });
    }
  });

// Update flash sale and update discountPercent
router.put("/set-flash-sale/:id", async (req, res) => {
    const { discountPercent } = req.body;
  
    try {
      const book = await Book.findById(req.params.id);
  
      if (!book) {
        return res.status(404).json({
          message: "The book cannot be found.",
          status: false,
        });
      }
  
      const discountPrice = book.basePrice * (1 - discountPercent / 100);
  
      book.discountPercent = discountPercent;
      book.discountPrice = discountPrice;
      book.isFSale = true;
  
      await book.save();
  
      res.status(200).json({
        message: "The book is now on flash sale!",
        status: true,
        book,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Internal server error while updating the flash sale.",
        status: false,
      });
    }
});

// Remove a book from flash sale
router.put("/remove-flash-sale/:id", async (req, res) => {
    try {
      const bookId = req.params.id;
  
      // Find the book by ID
      const book = await Book.findById(bookId);
  
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
  
      if (!book.isFSale) {
        return res
          .status(400)
          .json({ message: "Book is not currently in flash sale" });
      }
  
      //Update book to remove from flash sale
      book.isFSale = false;
      book.discountPercent = 0;
      book.discountPrice = 0;
  
      //Saved to database
      const updatedBook = await book.save();
      
      //Return the updated book
      res.status(200).json({
        message: "Book removed from flash sale successfully!",
        book: updatedBook,
      });
    } catch (e) {
      console.error(`Error updating book: ${e}`);
      res.status(500).json({ error: "Internal server error" });
    }
});
  
//get 5 random books (or N book: edit the size number)
//Test: send put request: http://localhost:4000/api/books/flash-sale/
//body: { "discountPercent": 50 }
router.get("/random-books", async (req, res) => {
    try {
      const randomBooks = await Book.aggregate([{ $sample: { size: 5 } }]);
  
      res.status(200).json({
        message: "Random books retrieved successfully!",
        status: true,
        books: randomBooks,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Internal server error while retrieving random books.",
        status: false,
        error: err.message,
      });
    }
});

module.exports = router;