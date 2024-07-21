const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const port = process.env.PORT;
const conn = process.env.CONNECTION_STRING;

// Sử dụng CORS middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));     // Sử dụng express.json() để phân tích cú pháp JSON
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.options('*', cors()); // Cấu hình một route đặc biệt để xử lý các yêu cầu HTTP OPTIONS cho tất cả các route ('*')


// Middleware để phân tích cú pháp JSON từ request body
app.use(bodyParser.json());
// app.use(express.json()); // Sử dụng express.json() để phân tích cú pháp JSON


//Routes
const categoryRoutes = require('./routes/categories.js');
const userRoutes = require('./routes/user.js');
const staffRoutes = require('./routes/staff.js');
const imageUploadRoutes = require('./routes/imageUpload.js');
const bookRoutes = require('./routes/books');
const cartSchema = require('./routes/cart.js');
const myListSchema = require('./routes/myList.js');
const ordersSchema = require('./routes/orders.js');
const homeBannerSchema = require('./routes/homeBanner.js');
const mailRoutes = require('./routes/mailBox');
const newsRoutes = require('./routes/news');
const reviewRoutes = require('./routes/bookReviews');
const authorRoutes = require('./routes/authors.js'); 
const searchRoutes = require('./routes/search.js');


app.use("/api", imageUploadRoutes);
app.use("/api/user", userRoutes);
app.use("/api/staff", staffRoutes);

app.use(`/api/categories`, categoryRoutes);
app.use('/api/books', bookRoutes);
app.use(`/api/cart`, cartSchema);
app.use(`/api/my-list`, myListSchema);
app.use(`/api/orders`, ordersSchema);
app.use(`/api/homeBanner`, homeBannerSchema);
app.use('/api/mailBox', mailRoutes);
app.use(`/api/news`, newsRoutes);
app.use(`/api/reviews`, reviewRoutes);
app.use(`/api/authors`, authorRoutes);
app.use(`/api/search`, searchRoutes);

// Kết nối tới MongoDB
mongoose.connect(conn)
        .then(() => {
            console.log('Database Connection is ready...');
            // Khởi động server sau khi kết nối thành công tới MongoDB
            app.listen(port, () => {
                console.log(`server is running http://localhost:${port}`);
            });
        })
        .catch((err) => {
            console.error('Database connection error:', err);
        });
