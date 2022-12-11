const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const Message = require('../models/Message');
const { response } = require('../utils/response');
const Group = require('../models/Group');
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
  const session = await mongoose.startSession();
  try {
    const userId = req.user.id;
    const groupId = req.params.groupId;

    await checkGroupMember(userId, groupId);

    //create transaction
    session.startTransaction();
    const [message] = await Message.create(
      [
        {
          content: req.body.content,
          sender: userId,
          group: groupId,
          readBy: [userId],
        },
      ],
      {
        session,
      }
    );
    const group = await Group.findOneAndUpdate(
      { _id: groupId },
      {
        $set: {
          lastMessage: {
            message: message._id,
            sender: userId,
          },
        },
      },
      {
        session,
        new: true,
      }
    )
      .populate({
        path: 'lastMessage.sender',
        select: 'name avatar',
      })
      .populate({
        path: 'lastMessage.message',
        select: 'content readBy',
      });

    await session.commitTransaction();
    session.endSession();
    await emitMessageToClient(groupId, { message, group }, 'send');

    return response(message, httpStatus.CREATED, res);
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
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
  const member = await Group.findOne(
    {
      _id: groupId,
      'members.user': userId,
    },
    {
      _id: 1,
    }
  );
  if (!member) {
    throw new customError('error.not_member_of_group', httpStatus.FORBIDDEN);
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
