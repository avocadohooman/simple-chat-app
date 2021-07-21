const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const cors = require('cors');
// for cross communication between client <> server
app.use(cors());
const origin = (process.env.NODE_ENV === 'production') ? 'https://pacific-woodland-70842.herokuapp.com/' : 'http://localhost:3000';
corsOptions={
    cors: true,
    origins:[origin],
}
const io = socketio(server, corsOptions);
const router = require('./controllers/router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./services/userService');


//protecting from DOS Attack 
app.use(express.json({limit: '10kb'}));


// when client is in production, activate this line
if (process.env.NODE_ENV === 'production') {
    console.log('using build');
    app.use(express.static('./build'));
}


const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    
    socket.on('join', ({name, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room: ${user.room}` });
        socket.broadcast.to(user.room).emit('message',{ user: 'admin', text: `${user.name} has joined` });
        
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left`});
            console.log(`${user.name} has left`);
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

