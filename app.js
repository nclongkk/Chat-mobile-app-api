const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const ejs = require('ejs');
const socketio = require('socket.io');
const routes = require('./src/routes/index');
const connectDB = require('./src/config/db.config');
const i18nConfig = require('./src/config/i18n.config');
const socketHandler = require('./src/socketHandler');

//load env var
dotenv.config();

// Connect to database
connectDB();

// Setup i18n
i18nConfig();

const app = express();
// Enable CORS
app.use(cors());

//Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

app.use(i18n.init);

//ejs
app.set('view engine', 'ejs');
app.set('views', './src/views');
//public css, js
app.use(express.static('src/public'));

//Routes
app.use('/api/v1', routes);
app.get('/', (req, res) => res.render('dashboard'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, console.log(`Server running on port ${PORT}`));
const io = socketio(server);
global._emitter = io;
socketHandler(io);
