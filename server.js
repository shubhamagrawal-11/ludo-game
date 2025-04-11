const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Store game rooms (in-memory for simplicity)
const rooms = {};

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new game room
  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substr(2, 6); // Random 6-char code
    rooms[roomId] = { players: [{ id: socket.id, name: `Player 1` }], turn: 0 };
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updatePlayers", rooms[roomId].players);
  });

  // Join an existing room
  socket.on("joinRoom", ({ roomId, playerName }) => {
    if (rooms[roomId] && rooms[roomId].players.length < 4) {
      socket.join(roomId);
      rooms[roomId].players.push({ id: socket.id, name: playerName || `Player ${rooms[roomId].players.length + 1}` });
      socket.emit("joinedRoom", roomId);
      io.to(roomId).emit("updatePlayers", rooms[roomId].players);
      io.to(roomId).emit("gameState", { turn: rooms[roomId].players[rooms[roomId].turn].id });
    } else {
      socket.emit("error", "Room full or does not exist");
    }
  });

  // Handle dice roll
  socket.on("rollDice", ({ roomId, result }) => {
    if (rooms[roomId] && rooms[roomId].players[rooms[roomId].turn].id === socket.id) {
      io.to(roomId).emit("diceResult", { playerId: socket.id, result });
      rooms[roomId].turn = (rooms[roomId].turn + 1) % rooms[roomId].players.length;
      io.to(roomId).emit("gameState", { turn: rooms[roomId].players[rooms[roomId].turn].id });
    }
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.to(roomId).emit("updatePlayers", room.players);
        if (room.players.length === 0) {
          delete rooms[roomId];
        }
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));