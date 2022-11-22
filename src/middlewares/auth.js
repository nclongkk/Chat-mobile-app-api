const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const User = require('../models/User');
const GroupMember = require('../models/GroupMember');
const customError = require('../utils/customError');

// Protect routes
exports.authenticate = (req, res, next) => {
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
    req.user = decoded;
    next();
  } catch (error) {
    return next(
      new customError('error.not_authorize', httpStatus.UNAUTHORIZED)
    );
  }
};
