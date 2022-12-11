const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const GroupMember = require('../models/GroupMember');
const customError = require('../utils/customError');
const { response } = require('../utils/response');
/**
 * @desc    get list group which user joined
 * @route   GET /api/v1/groups
 */
exports.listGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;
    //Pagination, default page 1, limit 5
    const { page, limit, keyword } = req.query;
    let where = {};
    if (keyword) {
      where = {
        $or: [{ name: { $regex: keyword, $options: 'i' } }],
      };
    } else {
      where = { members: { $elemMatch: { user: userId } } };
    }

    const startIndex = (page - 1) * limit;
    const [groups, totalGroups] = await Promise.all([
      Group.find(where)
        .sort({ 'lastMessage.sentAt': -1 })
        .select('name image joinRequests members lastMessage')
        .skip(startIndex)
        .limit(limit)
        .populate({
          path: 'lastMessage.sender',
          select: 'name avatar',
        })
        .populate({
          path: 'lastMessage.message',
          select: 'content readBy',
        }),
      Group.countDocuments(where),
    ]);
    return response(
      { data: groups, total: totalGroups, currentPage: page },
      httpStatus.OK,
      res
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc create new group
 * @route POST /api/v1/groups
 */
exports.createGroup = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const defaultImage =
      'https://static.vecteezy.com/system/resources/previews/000/581/748/non_2x/people-icon-vector-illustration.jpg';
    let { name, description } = req.body;
    const userId = req.user.id;
    await session.startTransaction();

    const messageId = new ObjectId();
    const newGroup = await Group.create(
      [
        {
          name,
          description,
          image: defaultImage,
          creator: userId,
          members: [
            {
              user: userId,
              nickName: req.user.name,
            },
          ],
          lastMessage: {
            message: messageId,
            sender: userId,
          },
        },
      ],
      { session }
    );
    const message = await Message.create(
      [
        {
          _id: messageId,
          content: 'Create group',
          sender: userId,
          group: newGroup[0]._id,
          readBy: [userId],
        },
      ],
      {
        session,
      }
    );

    await session.commitTransaction();
    await session.endSession();
    const createdGroup = await Group.findOne({ _id: newGroup[0]._id })
      .select('name image joinRequests members lastMessage')
      .populate({
        path: 'lastMessage.sender',
        select: 'name avatar',
      })
      .populate({
        path: 'lastMessage.message',
        select: 'content readBy',
      });

    await emitMessageToClient(
      groupId,
      { message, group: createdGroup },
      'send'
    );

    return response(createdGroup, httpStatus.CREATED, res);
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }
};

/**
 * @desc get information of group
 * @route GET /api/v1/groups/:groupId
 */
exports.groupInformation = async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId)
      .select(
        'name description createdAt totalMembers members image joinRequests creator'
      )
      .populate({
        path: 'members.user',
        select: 'name avatar isOnline',
      })
      .populate({
        path: 'joinRequests.user',
        select: 'name avatar',
      });
    return response(group, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc update information of group
 * @route PUT /api/v1/groups/:groupId
 * @access creator
 */
exports.updateInformation = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    let updateQuery;
    if (description) {
      updateQuery = { $set: { name, description } };
    } else {
      updateQuery = {
        $set: { name },
        $unset: { description: 1 },
      };
    }
    const group = await Group.findOneAndUpdate(
      { _id: req.params.groupId, creator: req.user.id },
      updateQuery,
      {
        new: true,
        runValidators: true,
      }
    );
    return response(group, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc delete specific group
 * @route DELETE /api/v1/groups/:groupId
 * @access creator
 */
exports.deleteGroup = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    //Just creator can delete group
    const result = await Group.deleteOne(
      {
        creator: req.user.id,
        _id: req.params.groupId,
      },
      { session }
    );
    if (result.deletedCount === 1) {
      await Message.deleteMany({ group: req.params.groupId });
    }
    await session.commitTransaction();
    await session.endSession();
    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
  }
};

/**
 * @desc get list member of group
 * @route GET /api/v1/groups/:groupId/member
 */
exports.listMember = async (req, res, next) => {
  try {
    //Pagination, default page 1, limit 10
    throw new customError('Not implemented', httpStatus.NOT_IMPLEMENTED);
    const { page, limit } = req.query;
    const startIndex = (page - 1) * limit;
    const [members, totalMembers] = await Promise.all([
      GroupMember.find({
        group: req.params.groupId,
      })
        .populate({
          path: 'user',
          select: 'name avatar isOnline',
        })
        .select('user nickName')
        .skip(startIndex)
        .limit(limit)
        .lean(),
      GroupMember.countDocuments({ group: req.params.groupId }),
    ]);
    return response(
      { data: members, total: totalMembers, currentPage: page },
      httpStatus.OK,
      res
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc add member to group
 * @route POST /api/v1/groups/:groupId/members
 * @access creator
 */
exports.addMember = async (req, res, next) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      throw new customError('User not found', httpStatus.NOT_FOUND);
    }

    await Group.updateOne(
      {
        _id: req.params.groupId,
        creator: req.user.id,
        'members.user': { $ne: user._id },
      },
      {
        $inc: { totalMembers: 1 },
        $push: {
          members: {
            user: user._id,
          },
        },
      }
    );

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc edit information of member in group
 * @route PUT /api/v1/groups/:groupId/members
 */
exports.editMemberInfor = async (req, res, next) => {
  try {
    const { notify, nickName } = req.body;

    let updateQuery;
    if (nickName) {
      updateQuery = {
        $set: { 'members.$.notify': notify, 'members.$.nickName': nickName },
      };
    } else {
      updateQuery = {
        $set: { 'members.$.nickName': notify },
        $unset: { 'members.$.nickName': nickName },
      };
    }

    await Group.updateOne(
      {
        _id: req.params.groupId,
        creator: req.user.id,
        'members.user': req.body.memberId,
      },
      updateQuery
    );

    return response(member, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc delete member of group
 * @route DELETE /api/v1/groups/:groupId/member/:memberId
 * @access creator
 */
exports.deleteMember = async (req, res, next) => {
  try {
    await Group.updateOne(
      {
        _id: req.params.groupId,
        creator: req.user.id,
        totalMembers: { $gt: 0 },
      },
      {
        $inc: { totalMembers: -1 },
        $pull: { members: { user: req.params.memberId } },
      }
    );

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc request to join group
 * @route POST /api/v1/groups/:groupId/join-requests
 */
exports.requestToJoin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;

    const group = await Group.findOneAndUpdate(
      {
        _id: groupId,
        'members.user': { $ne: userId },
        'joinRequests.user': { $ne: userId },
      },
      {
        $addToSet: { joinRequests: { user: userId } },
      },
      {
        new: true,
        select: 'name',
      }
    );
    if (!group) {
      throw new customError('error.group_not_found', httpStatus.NOT_FOUND);
    }

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc  update list requests that creator read
 * @route PATCH /api/v1/groups/:groupId/join-requests
 * @access  creator
 */
exports.updateStatusJoinRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    Group.updateOne(
      {
        _id: groupId,
        creator: userId,
      },
      { $set: { 'joinRequests.$[].isRead': true } }
    ).catch((error) => console.log(error));
    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc  approve join request
 * @route POST /api/v1/groups/:groupId/join-requests/:requesterId
 * @access  creator
 */
exports.approveJoinRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId, requesterId } = req.params;

    const group = await Group.findOneAndUpdate(
      {
        _id: groupId,
        creator: userId,
        'joinRequests.user': requesterId,
      },
      {
        $pull: { joinRequests: { user: requesterId } },
        $inc: { totalMembers: 1 },
        $addToSet: { members: { user: requesterId } },
      },
      { new: true, select: 'name' }
    );
    if (!group) {
      throw new customError(
        'error.not_found_any_request',
        httpStatus.NOT_FOUND
      );
    }

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc  cancel join request
 * @route DELETE /api/v1/groups/:groupId/join-requests/:requesterId
 * @access  creator or requester
 */
exports.deleteJoinRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId, requesterId } = req.params;
    let filterQuery;
    if (userId === requesterId) {
      filterQuery = { _id: groupId, 'joinRequests.user': userId };
    } else {
      filterQuery = {
        _id: groupId,
        creator: userId,
        'joinRequests.user': requesterId,
      };
    }
    await Group.updateOne(filterQuery, {
      $pull: { joinRequests: { user: requesterId } },
    });

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc  leave group
 * @route POST /api/v1/groups/:groupId/leave-group
 * @access  every member except creator
 */
exports.leaveGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    await Group.updateOne(
      {
        _id: groupId,
        creator: { $ne: userId },
        totalMembers: { $gt: 0 },
      },
      { $inc: { totalMembers: -1 }, $pull: { members: { user: userId } } }
    );

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    return next(error);
  }
};

const emitMessageToClient = async (groupId, message, action) => {
  const group = await Group.findOne({
    _id: groupId,
  })
    .select('members.user')
    .lean();
  const listMemberIds = group.members.map((member) => member.user.toString());
  if (!listMemberIds.length) {
    throw new customError('error.group_not_found', httpStatus.NOT_FOUND);
  }

  listMemberIds.forEach((memberId) => {
    _emitter.sockets.in(memberId).emit('messages', {
      message,
      action,
    });
  });
};
