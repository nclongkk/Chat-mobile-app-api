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
  requestToJoin,
  updateStatusJoinRequest,
  approveJoinRequest,
  deleteJoinRequest,
  leaveGroup,
  inviteMember,
  acceptInvitation,
} = require('../controllers/groups');
const { authenticate } = require('../middlewares/auth');

const messageRouter = require('./messages');

const router = express.Router();
router.get('/:groupId/invite', acceptInvitation);

router.use(authenticate);
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
router
  .route('/:groupId/join-requests')
  .post(requestToJoin)
  .patch(updateStatusJoinRequest);
router
  .route('/:groupId/join-requests/:requesterId')
  .post(approveJoinRequest)
  .delete(deleteJoinRequest);
router.post('/:groupId/leave-group', leaveGroup);
router.post('/:groupId/invite', inviteMember);

module.exports = router;
