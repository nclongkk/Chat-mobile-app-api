const mongoose = require('mongoose');
const InvitationSchema = new mongoose.Schema(
  {
    receiver: String,
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Invitation', InvitationSchema);
