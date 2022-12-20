const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const customError = require('./utils/customError');
const User = require('./models/User');

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new customError('Unauthorization', httpStatus.FORBIDDEN));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: payload.id,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  }).on('connection', (socket) => {
    emitUserStatus(io, socket, 'online');
    socket.join(socket.user.id);
    socket.on('disconnect', () => emitUserStatus(io, socket, 'offline'));
  });
};

const emitUserStatus = (io, socket, action) => {
  console.log('emitUserStatus', action);
  const userId = socket.user.id;
  console.log(io.sockets.adapter.rooms);
  if (io.sockets.adapter.rooms.get(userId)) {
    return;
  }
  console.log('isOnline');
  const isOnline = action === 'online';
  User.updateOne({ _id: userId }, { $set: { isOnline } }).catch((error) => {
    console.log(error);
  });
  return io.emit('userStatus', { userId, action });
};

module.exports = socketHandler;
