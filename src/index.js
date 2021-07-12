const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const server = http.createServer(app);
const io = socketio(server);

const publicDirPath = path.join(__dirname,'../public');
app.use(express.static(publicDirPath));

//let count = 0;
io.on('connection', (socket) => {
    console.log('New websocket connection');

    
    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++;
    //     //socket.emit('countUpdated', count); // emits event to a specific connection
    //     io.emit('countUpdated', count); // emits event to all connections
    // });
    socket.on('join', (options, callback) => {
        const user = addUser({ id: socket.id, ...options });
        if (user.error) {
            return callback(user.error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin' ,'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined.`)); // emit to everyone in the room but this particular connection
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });
    // io.to.emit  socket.broadcast.to.emit -> for rooms
    
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();
        const user = getUser(socket.id);
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});


server.listen(port, ()=> {
    console.log(`Server is up on port ${port}`);
});