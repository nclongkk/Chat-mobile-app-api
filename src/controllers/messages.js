const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const Message = require('../models/Message');
const { response } = require('../utils/response');
const GroupMember = require('../models/GroupMember');
const customError = require('../utils/customError');

/**
 * @desc    create new messages
 * @route   GET /api/v1/groups/:groupId/messages
 */
exports.listMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    await checkGroupMember(userId, groupId);

    const { page, limit } = req.query;
    const startIndex = (page - 1) * limit;
    const [messages, totaMessages] = await Promise.all([
      Message.find({ group: groupId })
        .sort('-_id')
        .skip(startIndex)
        .limit(limit)
        .populate({
          path: 'sender',
          select: 'name avatar',
        })
        .lean(),
      Message.countDocuments({ group: { $eq: ObjectId(groupId) } }),
    ]);

    return response(
      { data: messages, total: totaMessages, currentPage: page },
      httpStatus.OK,
      res
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    update list recipient of messages in group
 * @route   PATCH /api/v1/groups/:groupId/messages
 */
exports.updateListRecipient = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    await Message.updateMany(
      {
        group: groupId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );
    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    update list recipients of messages in group
 * @route   PATCH /api/v1/groups/:groupId/messages/readers
 */
exports.readMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    await Message.updateMany(
      {
        group: groupId,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );
    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    create new messages
 * @route   POST /api/v1/groups/:groupId/messages
 */
exports.createMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;

    await checkGroupMember(userId, groupId);

    const message = await Message.create({
      content: req.body.content,
      sender: userId,
      group: groupId,
    });

    await emitMessageToClient(groupId, message, 'send');

    return response(message, httpStatus.CREATED, res);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    edit message
 * @route   PATCH /api/v1/groups/:groupId/messages/:messageId
 */
exports.editMessage = async (req, res, next) => {
  try {
    const { groupId, messageId } = req.params;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, sender: req.user.id },
      { content: req.body.content },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!message) {
      throw new customError('error.not_found', httpStatus.BAD_REQUEST);
    }
    await emitMessageToClient(groupId, message, 'update');

    return response(message, httpStatus.OK, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    delete message
 * @route   DELETE /api/v1/groups/:groupId/messages/:messageId
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { groupId, messageId } = req.params;
    const result = await Message.deleteOne({
      _id: messageId,
      sender: req.user.id,
    });

    if (!result.deletedCount) {
      throw new customError('error.not_found', httpStatus.BAD_REQUEST);
    }

    await emitMessageToClient(groupId, messageId, 'delete');

    return response({ success: true }, httpStatus.OK, res);
  } catch (error) {
    next(error);
  }
};

const checkGroupMember = async (userId, groupId) => {
  const member = await GroupMember.findOne({
    group: ObjectId(groupId),
    user: ObjectId(userId),
  });
  if (!member) {
    throw new customError('error.not_member_of_group', httpStatus.FORBIDDEN);
  }
};

const emitMessageToClient = async (groupId, message, action) => {
  const listMembers = await GroupMember.find({
    group: groupId,
  })
    .select('user')
    .lean();
  if (!listMembers.length) {
    throw new customError('error.group_not_found', httpStatus.NOT_FOUND);
  }

  listMembers.forEach((member) => {
    memberId = String(member.user);
    _emitter.sockets.in(memberId).emit('messages', {
      message,
      action,
    });
  });
};
