const express = require('express');
const paginate = require('../validators/paginate.validator');
const validateMsgContent = require('../validators/validateMsgContent.validator');
const {
  listMessages,
  createMessage,
  readMessages,
  editMessage,
  deleteMessage,
  updateListRecipient,
} = require('../controllers/messages');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(paginate.validate(), listMessages)
  .post(validateMsgContent.validate(), createMessage)
  .patch(updateListRecipient);
router.patch('/readers', readMessages);
router
  .route('/:messageId')
  .patch(validateMsgContent.validate(), editMessage)
  .delete(deleteMessage);

module.exports = router;
