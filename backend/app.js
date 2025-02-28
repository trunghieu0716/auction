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
var session = require('express-session');

// Load environment variables
dotenv.config();

// Static file settings
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MySQL Connection
const mysql = require('mysql2');
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.getConnection((err, conn) => {
    if (err) {
        console.error('❌ MySQL Connection Error:', err);
    } else {
        console.log('✅ Connected to MySQL on localhost!');
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
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

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

app.post('/login', function (req, res) {
    const { Email, PWD } = req.body;

    const sql = `SELECT * FROM user WHERE Email = ? AND PassWord = ?`;
    const values = [Email, PWD];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).send('Error logging in: ' + err.message);
        }
        if (results.length > 0) {
            console.log('User logged in:', results[0]);
            req.session.user = results[0];
            res.redirect('/index');
        } else {
            res.status(401).send('Invalid email or password');
        }
    });
});

app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'register.html'));
});

app.post('/register', function (req, res) {
    const { UID, ADDRESS, Email, PWD, ConfirmPWD } = req.body;

    if (PWD !== ConfirmPWD) {
        return res.status(400).send('Passwords do not match');
    }

    const sql = `INSERT INTO user (FullName, Address, Email, PassWord) VALUES (?, ?, ?, ?)`;
    const values = [UID, ADDRESS, Email, PWD];

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).send('Error inserting user: ' + err.message);
        }
        console.log('User added:', result);
        res.send('User registered successfully');
    });
});

app.get('/api/user', function (req, res) {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

app.get('/index', function (req, res) {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'index.html'));
    } else {
        res.redirect('/login');
    }
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