require("dotenv").config();

const express = require('express'); // Framework web cho Node.js, giúp dựng các ứng dụng web và API
const app = express();  // Tạo một đối tượng ứng dụng Express, lưu trong biến app. Sử dụng để thiết lập các route và middleware cho ứng dụng
const bodyParser = require('body-parser'); // Body-parser là một middleware để phân tích cú pháp body của các request HTTP, thường được sử dụng để xử lý dữ liệu dạng JSON, text, hoặc URL-encoded từ các form gửi lên server.
const cors = require('cors'); // CORS (Cross-Origin Resource Sharing) là một cơ chế cho phép các tài nguyên bị giới hạn trên một trang web có thể được yêu cầu từ một trang web khác nằm trên domain khác
const mongoose = require('mongoose'); // Mongoose là một thư viện để kết nối và làm việc với MongoDB

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
