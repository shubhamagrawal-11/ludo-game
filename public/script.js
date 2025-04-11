const socket = io();
const canvas = document.getElementById("ludoBoard");
const ctx = canvas.getContext("2d");

let roomId = null;
let myId = null;

// Show home screen initially
document.getElementById("homeScreen").style.display = "block";
document.getElementById("gameScreen").style.display = "none";

// Draw a simple Ludo board
function drawBoard() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 400, 400);

  // Draw colored home squares
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 120, 120);
  ctx.fillStyle = "green";
  ctx.fillRect(280, 0, 120, 120);
  ctx.fillStyle = "yellow";
  ctx.fillRect(280, 280, 120, 120);
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 280, 120, 120);

  // Draw center triangle
  ctx.fillStyle = "#ddd";
  ctx.beginPath();
  ctx.moveTo(200, 120);
  ctx.lineTo(280, 200);
  ctx.lineTo(200, 280);
  ctx.lineTo(120, 200);
  ctx.closePath();
  ctx.fill();
}

// Create a new room
function createRoom() {
  const playerName = document.getElementById("playerName").value || "Player 1";
  socket.emit("createRoom");
}

// Join an existing room
function joinRoom() {
  const roomCode = document.getElementById("roomCode").value.trim();
  const playerName = document.getElementById("playerName").value || "Guest";
  if (roomCode) {
    socket.emit("joinRoom", { roomId: roomCode, playerName });
  } else {
    document.getElementById("errorMsg").textContent = "Please enter a room code";
  }
}

// Roll the dice
function rollDice() {
  const result = Math.floor(Math.random() * 6) + 1;
  socket.emit("rollDice", { roomId, result });
}

// Socket.IO event listeners
socket.on("connect", () => {
  myId = socket.id;
});

socket.on("roomCreated", (id) => {
  roomId = id;
  document.getElementById("roomId").textContent = id;
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  drawBoard();
});

socket.on("joinedRoom", (id) => {
  roomId = id;
  document.getElementById("roomId").textContent = id;
  document.getElementById("homeScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  drawBoard();
});

socket.on("error", (msg) => {
  document.getElementById("errorMsg").textContent = msg;
});

socket.on("updatePlayers", (players) => {
  const playersDiv = document.getElementById("players");
  playersDiv.innerHTML = "<h3>Players:</h3>" + players.map((p) => `<p>${p.name}</p>`).join("");
});

socket.on("gameState", ({ turn }) => {
  document.getElementById("turnInfo").textContent = `Turn: Player ${turn === myId ? "You" : "Other"}`;
  document.getElementById("rollDiceBtn").style.display = turn === myId ? "block" : "none";
});

socket.on("diceResult", ({ playerId, result }) => {
  document.getElementById("diceResult").textContent = result;
});