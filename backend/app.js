var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var mailer = require('express-mailer');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
require('dotenv').config();

// Cấu hình MySQL từ Railway
const mysql = require('mysql2/promise'); // Dùng `promise` để hỗ trợ async/await
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL chưa được thiết lập. Hãy kiểm tra biến môi trường.");
    process.exit(1);
}

const pool = mysql.createPool(process.env.DATABASE_URL);

// Kiểm tra kết nối đến MySQL
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Connected to MySQL on Railway!");
        connection.release(); // Giải phóng kết nối
    } catch (error) {
        console.error("❌ MySQL Connection Error:", error);
        process.exit(1); // Dừng chương trình nếu không thể kết nối
    }
})();

// Cấu hình Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// Cấu hình Mailer
mailer.extend(app, {
    from: process.env.EMAIL_FROM,
    host: process.env.MAIL_HOST,
    secureConnection: process.env.EMAIL_SECURE === "true", // Chuyển sang Boolean
    port: parseInt(process.env.EMAIL_PORT, 10) || 587, // Đảm bảo port là số
    transportMethod: process.env.EMAIL_TRANSPORT_METHOD || "SMTP",
    auth: {
        user: process.env.EMAIL_AUTH_USERNAME,
        pass: process.env.EMAIL_AUTH_PASSWORD
    }
});

// Import Routes
var AuthRouter = require('./router/auth.router');
var AdminRouter = require('./router/admin.router');
var product = require('./apiController/ProductController');
var user = require('./apiController/UserController');

app.use('/auth', AuthRouter);
app.use('/admin', AdminRouter);
app.use('/product', product);
app.use('/user', user);

// Routes
app.get('/', (req, res) => {
    console.log('GET / called');
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'index.html'), (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).end();
        }
    });
});

app.get('/:page', (req, res) => {
    let page = req.params.page;
    let filePath = path.join(__dirname, 'views', 'frontend', 'layouts', page);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).send('Page not found');
        }
    });
});

// Socket.io event
io.on('connection', (socket) => {
    console.log('A user connected');
});

// Khởi động server
const PORT = process.env.APP_PORT || 8000;
http.listen(PORT, () => {
    console.log(`🚀 Server running at port ${PORT}`);
});
