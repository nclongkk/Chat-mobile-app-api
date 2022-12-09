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
    //Pagination, default page 1, limit 5
    const { page, limit } = req.query;
    const userId = req.user.id;
    const startIndex = (page - 1) * limit;
    const [groups, totalGroups] = await Promise.all([
      Group.find({
        members: { $elemMatch: { user: userId } },
      })
        .sort({ 'lastMessage.sentAt': -1 })
        .select('name image lastMessage')
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
      Group.countDocuments({
        members: { $elemMatch: { user: userId } },
      }),
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
    let { name, description } = req.body;
    const userId = req.user.id;
    await session.startTransaction();

    const messageId = new ObjectId();
    const newGroup = await Group.create(
      [
        {
          name,
          description,
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
    await Message.create(
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

    return response(newGroup, httpStatus.CREATED, res);
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
    const group = await Group.findById(groupId).select(
      'name description createdAt totalMembers'
    );
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
