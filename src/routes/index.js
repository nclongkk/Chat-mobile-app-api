const express = require('express');
const errorHandler = require('../middlewares/errorHandler');
const { authenticate } = require('../middlewares/auth');

const app = express();

app.use('/auth', require('./auth'));
app.use('/users', require('./users'));
app.use('/groups', require('./groups'));
app.use(authenticate);
app.use('/messages', require('./messages'));
// Handle error
app.use(errorHandler);

module.exports = app;
