const httpStatus = require('http-status');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'error.not_found';
    error.statusCode = httpStatus.NOT_FOUND;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = 'error.duplicate_field_value_entered';
    error.statusCode = httpStatus.BAD_REQUEST;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map((val) => val.message);
    error.statusCode = httpStatus.BAD_REQUEST;
  }

  const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const messageCode = error.message || 'error.server_error';
  return res.status(statusCode).json({
    error: { code: messageCode, message: res.t(messageCode) },
  });
};

module.exports = errorHandler;
