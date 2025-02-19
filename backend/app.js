var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var mailer = require('express-mailer');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

// setting for static files.
app.use(express.static(path.join(__dirname, 'public')));

require('dotenv').config();

var AuthRouter = require('./router/auth.router');
var AdminRouter = require('./router/admin.router');
var product = require('./apiController/ProductController');
var user = require('./apiController/UserController');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('dev'));

// add settings for app.
app.set('view engine', 'ejs');

// setting for mailer.
mailer.extend(app, {
    from: process.env.EMAIL_FROM,
    host: process.env.MAIL_HOST, // hostname
    secureConnection: process.env.EMAIL_SECURE, // use SSL
    port: process.env.EMAIL_PORT, // port for secure SMTP
    transportMethod: process.env.EMAIL_TRANSPORT_METHOD, // default is SMTP. Accepts anything that nodemailer accepts
    auth: {
        user: process.env.EMAIL_AUTH_USERNAME,
        pass: process.env.EMAIL_AUTH_PASSWORD
    }
});

app.get('/', function (req, res) {
    console.log('GET / called');
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'index.html'), function (err) {
        if (err) {
            console.log('Error sending file:', err);
            res.status(err.status).end();
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

// index page.
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'index.html'));
});

app.get('/index.html', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'frontend', 'layouts', 'index.html'));
});

// assces page
app.get('/:page', function (req, res) {
    let page = req.params.page;
    let filePath = path.join(__dirname, 'views', 'frontend', 'layouts', page);
    
    res.sendFile(filePath, function (err) {
        if (err) {
            console.log('Error sending file:', err);
            res.status(404).send('Page not found');
        }
    });
});



// load auth's router.
app.use('/auth', AuthRouter);

// admin routes.
app.use('/admin', AdminRouter);

// load product's router.
app.use('/product', product);
app.use('/user', user);

// server open
io.on('connection', function (socket) {
    console.log('a user connected');
});

const PORT = process.env.APP_PORT || 8000;
http.listen(PORT, () => {
    console.log("server running at port ", PORT);
});