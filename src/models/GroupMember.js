const mongoose = require('mongoose');
const MemberSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true,
  },
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

module.exports = mongoose.model('GroupMember', MemberSchema);
