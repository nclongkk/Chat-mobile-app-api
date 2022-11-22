const express = require('express');
const loginValidator = require('../validators/login.validator');
const registerValidator = require('../validators/register.validator');
const {
  register,
  login,
  logout,
  loginFacebook,
} = require('../controllers/auth');

const router = express.Router();

router.post('/register', registerValidator.validate(), register);
router.post('/login', loginValidator.validate(), login);
router.post('/facebook', loginFacebook);
router.get('/logout', logout);

module.exports = router;
