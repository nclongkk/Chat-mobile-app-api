const mongoose = require('mongoose');

const LastMessageSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const MemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  notify: {
    type: Boolean,
    default: true,
  },
  nickName: String,
});

const JoinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add name of group'],
    },
    image: {
      type: String,
    },
    description: String,
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    totalMembers: { type: Number, default: 1 },
    lastMessage: LastMessageSchema,
    members: [MemberSchema],
    joinRequests: [JoinRequestSchema],
  },
  {
    timestamps: true,
  }
);

GroupSchema.index({ 'lastMessage.sentAt': -1 });
GroupSchema.index({ name: 'text' });
module.exports = mongoose.model('Group', GroupSchema);
