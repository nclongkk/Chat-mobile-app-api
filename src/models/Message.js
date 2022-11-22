const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema(
  {
    content: String,
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
    },
    readBy: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', MessageSchema);
