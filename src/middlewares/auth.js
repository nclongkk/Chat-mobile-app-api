const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const User = require('../models/User');
const customError = require('../utils/customError');

// Protect routes
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      const parserTokens = req.headers.authorization.split('Bearer ');
      token = parserTokens[1];
    }
    // Make sure token exists
    if (!token) {
      return next(
        new customError('error.not_authorize', httpStatus.UNAUTHORIZED)
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;
    const user = await User.findById(id);
    req.user = user;
    next();
  } catch (error) {
    return next(
      new customError('error.not_authorize', httpStatus.UNAUTHORIZED)
    );
  }
};
