const express = require('express');
const updateUserValidator = require('../validators/updateUser.validator');
const {
  getMe,
  updateDetails,
  updatePassword,
  getUserInfo,
} = require('../controllers/users');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.route('/email').get(getUserInfo);
router.use(authenticate);
router
  .route('/')
  .get(getMe)
  .put(updateUserValidator.validate(), updateDetails)
  .patch(updatePassword);

module.exports = router;
