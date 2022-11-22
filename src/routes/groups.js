const express = require('express');
const validateGroupInfo = require('../validators/validateGroupInfo.validator');
const paginate = require('../validators/paginate.validator');
const validateMemberInfo = require('../validators/validateMemberInfor.validator');
const {
  listGroups,
  createGroup,
  groupInformation,
  updateInformation,
  deleteGroup,
  listMember,
  addMember,
  deleteMember,
  editMemberInfor,
} = require('../controllers/groups');

const messageRouter = require('./messages');

const router = express.Router();

router
  .route('/')
  .get(paginate.validate(), listGroups)
  .post(validateGroupInfo.validate(), createGroup);
router
  .route('/:groupId')
  .get(groupInformation)
  .put(validateGroupInfo.validate(), updateInformation)
  .delete(deleteGroup);
router
  .route('/:groupId/members')
  .get(paginate.validate(), listMember)
  .post(addMember)
  .put(validateMemberInfo.validate(), editMemberInfor);
router.route('/:groupId/members/:memberId').delete(deleteMember);
router.use('/:groupId/messages', messageRouter);

module.exports = router;
