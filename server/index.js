const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const cors = require('cors');
corsOptions={
    cors: true,
    origins:["http://localhost:3000"],
}
const io = socketio(server, corsOptions);
const router = require('./controllers/router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./services/userService');

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    
    socket.on('join', ({name, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });
        if (error) {
            return callback(error);
        }
        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room: ${user.room}` });
        socket.broadcast.to(user.room).emit('message',{ user: 'admin', text: `${user.name} has joined` });
        socket.join(user.room);
        
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        callback();
    });

    socket.on('disconnect', () => {
        console.log('User has left');
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

