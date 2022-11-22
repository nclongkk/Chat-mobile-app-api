const httpStatus = require('http-status');
const mongoose = require('mongoose');
const User = require('../models/User');
const customError = require('../utils/customError');
const { encrypt, isMatch } = require('../utils/passwordHandle');
const { sendTokenResponse, response } = require('../utils/response');
/**
 * @desc Get user
 * @route GET /api/v1/users
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email avatar phone')
      .lean();
    return response(user, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Modify user detail
 * @route   PUT  /api/v1/users
 */
exports.updateDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, avatar, phone } = req.body;

    let updateQuery;
    if (avatar) {
      updateQuery = { $set: { name, email, avatar, phone } };
    } else {
      updateQuery = {
        $set: { name, email, phone },
        $unset: { avatar },
      };
    }
    const user = await User.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      runValidators: true,
    });

    return response(user, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Modify user detail
 * @route   PATCH  /api/v1/users
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('password');

    const matchPassword = await isMatch(
      req.body.currentPassword,
      user.password
    );
    if (!matchPassword)
      return next(
        new customError('error.password_does_not_match', httpStatus.BAD_REQUEST)
      );

    const newPassword = await encrypt(req.body.newPassword);
    user.password = newPassword;
    await user.save();

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    return next(error);
  }
};
