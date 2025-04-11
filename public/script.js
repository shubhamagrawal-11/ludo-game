const socket = io();
const canvas = document.getElementById("ludoBoard");
const ctx = canvas.getContext("2d");

let roomId = null;
let myId = null;
let players = []; // Store player data with positions

document.getElementById("homeScreen").style.display = "block";
document.getElementById("gameScreen").style.display = "none";

const playerColors = ["red", "green", "yellow", "blue"];
const startingPositions = [
  { x: 50, y: 50 },  // Red home
  { x: 350, y: 50 }, // Green home
  { x: 350, y: 350 }, // Yellow home
  { x: 50, y: 350 }  // Blue home
];

function drawBoard() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, 120, 120);
  ctx.fillStyle = "green";
  ctx.fillRect(280, 0, 120, 120);
  ctx.fillStyle = "yellow";
  ctx.fillRect(280, 280, 120, 120);
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 280, 120, 120);
  ctx.fillStyle = "#ddd";
  ctx.beginPath();
  ctx.moveTo(200, 120);
  ctx.lineTo(280, 200);
  ctx.lineTo(200, 280);
  ctx.lineTo(120, 200);
  ctx.closePath();
  ctx.fill();
  // Redraw pieces after board
  players.forEach((player, index) => {
    drawPiece(player.position.x, player.position.y, player.color);
  });
}

function drawPiece(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function createRoom() {
  const playerName = document.getElementById("playerName").value || "Player 1";
  socket.emit("createRoom");
}

function joinRoom() {
  const roomCode = document.getElementById("roomCode").value.trim();
  const playerName = document.getElementById("playerName").value || "Guest";
  if (roomCode) {
    socket.emit("joinRoom", { roomId: roomCode, playerName });
  } else {
    document.getElementById("errorMsg").textContent = "Please enter a room code";
  }
}

function rollDice() {
  const result = Math.floor(Math.random() * 6) + 1;
  socket.emit("rollDice", { roomId, result });
}

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

socket.on("updatePlayers", (serverPlayers) => {
  const playersDiv = document.getElementById("players");
  players = serverPlayers.map((p, index) => ({
    id: p.id,
    name: p.name,
    color: playerColors[index % 4],
    position: startingPositions[index % 4]
  }));
  playersDiv.innerHTML = "<h3>Players:</h3>" + players.map((p) => `<p>${p.name} (${p.color})</p>`).join("");
  drawBoard();
});

socket.on("gameState", ({ turn }) => {
  document.getElementById("turnInfo").textContent = `Turn: Player ${turn === myId ? "You" : "Other"}`;
  document.getElementById("rollDiceBtn").style.display = turn === myId ? "block" : "none";
});

socket.on("diceResult", ({ playerId, result }) => {
  document.getElementById("diceResult").textContent = result;
  const player = players.find((p) => p.id === playerId);
  if (player) {
    player.position.x += result * 10; // Simple movement (update as needed)
    drawBoard();
  }
});