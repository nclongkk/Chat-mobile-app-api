const httpStatus = require('http-status');
const axios = require('axios').default;
const User = require('../models/User');
const { encrypt, isMatch } = require('../utils/passwordHandle');
const customError = require('../utils/customError');
const { sendTokenResponse, response } = require('../utils/response');

/**
 * @desc     Register user
 * @route    POST /api/v1/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;
    // encrypt password
    password = await encrypt(password);
    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
    });
    return sendTokenResponse(newUser, httpStatus.CREATED, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc     Login user
 * @route    POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('password');
    if (!user)
      return next(
        new customError('error.not_registered', httpStatus.UNAUTHORIZED)
      );

    const checkPassword = await isMatch(password, user.password);
    if (!checkPassword)
      return next(
        new customError(
          'error.password_does_not_match',
          httpStatus.UNAUTHORIZED
        )
      );

    return sendTokenResponse(user, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc     Login/register via facebook
 * @route    POST /api/v1/auth/facebook
 */
exports.loginFacebook = async (req, res, next) => {
  try {
    const { userId, accessToken } = req.body;
    const url = `${process.env.API_FACEBOOK_URL}/${userId}?fields=id,name,email&access_token=${accessToken}`;
    let { data } = await axios({
      url,
      method: 'get',
    });

    const user = await User.findOne({ facebookId: data.id });
    if (user) {
      return sendTokenResponse(user, httpStatus.OK, res);
    }

    //create new user
    const newUser = await User.create({
      name: data.name,
      email: data.email,
      facebookId: data.id,
    });
    return sendTokenResponse(newUser, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc     Log out clear cookie
 * @route    GET /api/v1/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      httpOnly: true,
    });
    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};
