let socket;
let listMessages = [];

$(document).ready(function () {
  $('#btnSendMsg').click(() => {
    const data = {
      action: 'send',
      groupId: $('#groupId').val(),
      content: $('#txtMsg').val(),
    };
    socket.emit('messages', data, console.log);
    $('#txtMsg').val('');
  });

  $('#btnLogin').click(() => {
    const token = $('#jwt').val();
    if (!socket) {
      socket = io.connect('http://localhost:3000', {
        transports: ['websocket'],
        auth: { token },
      });
      console.log(socket);
      socketHandler(socket);
    }
  });

  $('#listMessages').on('click', '.delete', (event) => {
    const messageId = event.currentTarget.id;
    const message = listMessages.find(
      (msg) => msg._id === event.currentTarget.id
    );
    const data = {
      action: 'delete',
      messageId,
      groupId: message.group,
    };
    socket.emit('messages', data, console.log);
  });

  $('#listMessages').on('click', '.update', (event) => {
    const messageId = event.currentTarget.id;
    const message = listMessages.find(
      (msg) => msg._id === event.currentTarget.id
    );
    console.log(message);
    const data = {
      action: 'update',
      messageId,
      content: $('#updateMsg').val(),
      groupId: message.group,
    };
    socket.emit('messages', data, console.log);
  });
});

const socketHandler = (socket) => {
  socket.on('messages', (data) => {
    console.log(data);
    // data = JSON.parse(data);
    listMessages.push(data.message);
    switch (data.action) {
      case 'send': {
        $('#listMessages').append(
          '<li> userId:' +
            data.message.sender +
            ',  groupId:' +
            data.message.group +
            ',  message:' +
            data.message.content +
            '</li>'
        );
        let del = $(
          `<input type="button" value="delete" class="delete" id="${data.message._id}"/>`
        );
        $('#listMessages').append(del);

        let update = $(
          `<input type="button" value="update" class="update" id="${data.message._id}"/>`
        );
        $('#listMessages').append(update);
        break;
      }
      case 'delete': {
        console.log('deleted successfully');
        break;
      }
      case 'update': {
        console.log('updated successfully');
        break;
      }
    }
  });

  socket.on('userStatus', (data) => {
    switch (data.action) {
      case 'online': {
        console.log(`user ${data.userId} online`);
        break;
      }
      case 'offline': {
        console.log(`user ${data.userId} offline`);
        break;
      }
    }
  });
};
