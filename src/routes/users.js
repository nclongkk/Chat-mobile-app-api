const express = require('express');
const updateUserValidator = require('../validators/updateUser.validator');
const {
  getMe,
  updateDetails,
  updatePassword,
} = require('../controllers/users');

const router = express.Router();

router
  .route('/')
  .get(getMe)
  .put(updateUserValidator.validate(), updateDetails)
  .patch(updatePassword);

module.exports = router;
