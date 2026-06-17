const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const { joinRoom, leaveRoom, startGame, getPlayerView, rooms } = require('./ngMahjongLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Socket.io connection logic
io.on('connection', (socket) => {
  let currentRoom = null;
  let currentRole = null;
  let username = null;

  socket.on('join_room', ({ roomId, name }, callback) => {
    if (currentRoom) {
      leaveRoom(currentRoom, socket.id);
      socket.leave(currentRoom);
    }

    username = name || socket.id.substring(0, 4);
    const { room, role } = joinRoom(roomId, socket.id, username);
    
    currentRoom = roomId;
    currentRole = role;
    socket.join(roomId);

    // Notify room of change
    updateRoomState(roomId);
    
    callback({ success: true, role, room: getRoomInfo(room) });
  });

  socket.on('start_game', () => {
    if (currentRoom) {
      const room = startGame(currentRoom);
      if (room) {
        updateRoomState(currentRoom);
      }
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      leaveRoom(currentRoom, socket.id);
      updateRoomState(currentRoom);
    }
  });

  function updateRoomState(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    // We must send specific states to each client individually
    // because players see different things than spectators.
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    if (socketsInRoom) {
      for (const sId of socketsInRoom) {
        const isPlayer = room.players.find(p => p.id === sId);
        const role = isPlayer ? 'player' : 'spectator';
        const view = getPlayerView(room, sId, role);
        io.to(sId).emit('room_update', {
          room: getRoomInfo(room),
          view: view
        });
      }
    }
  }

  function getRoomInfo(room) {
    return {
      id: room.id,
      players: room.players,
      spectators: room.spectators,
      state: room.state
    };
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Tools server running on port ${PORT}`);
});
