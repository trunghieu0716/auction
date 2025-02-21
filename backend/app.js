var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var mailer = require('express-mailer');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Static file settings
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection
const mysql = require('mysql2');
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.getConnection((err, conn) => {
    if (err) {
        console.error('❌ MySQL Connection Error:', err);
    } else {
        console.log('✅ Connected to MySQL on Railway!');
        conn.release();
    }
});

// Import routers
var AuthRouter = require('./router/auth.router');
var AdminRouter = require('./router/admin.router');
var product = require('./apiController/ProductController');
var user = require('./apiController/UserController');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// Set view engine
app.set('view engine', 'ejs');

// Mailer settings
mailer.extend(app, {
    from: process.env.EMAIL_FROM,
    host: process.env.MAIL_HOST,
    secureConnection: process.env.EMAIL_SECURE === 'true',
    port: process.env.EMAIL_PORT,
    transportMethod: process.env.EMAIL_TRANSPORT_METHOD,
    auth: {
        user: process.env.EMAIL_AUTH_USERNAME,
        pass: process.env.EMAIL_AUTH_PASSWORD
    }
});

// Routes
app.get('/', function (req, res) {
    console.log('GET / called');
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'index.html'), function (err) {
        if (err) {
            console.log('Error sending file:', err);
            res.status(err.status || 500).end();
        } else {
            console.log('Sent:', 'index.html');
        }
    });
});

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

app.get('/single', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'single.html'));
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'login.html'));
});

app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'register.html'));
});

app.get('/:page', function (req, res) {
    let page = req.params.page.includes('.html') ? req.params.page : `${req.params.page}.html`;
    let filePath = path.join(__dirname, 'views', 'frontend', 'layouts', page);
    
    res.sendFile(filePath, function (err) {
        if (err) {
            console.log('Error sending file:', err);
            res.status(404).send('Page not found');
        }
    });
});

// Load routes
app.use('/auth', AuthRouter);
app.use('/admin', AdminRouter);
app.use('/product', product);
app.use('/user', user);

// WebSocket connection
io.on('connection', function (socket) {
    console.log('A user connected');
});

// Start server
const PORT = process.env.APP_PORT || 8000;
http.listen(PORT, () => {
    console.log("Server running at port", PORT);
});
