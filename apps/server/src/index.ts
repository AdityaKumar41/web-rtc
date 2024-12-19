import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

const SocketMapping = new Map();
const SocketToEmail = new Map();

// setup connection
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("joined-room", (room) => {
    const { roomCode, email } = room;
    console.log("joined room", roomCode, email);
    SocketMapping.set(email, socket.id);
    SocketToEmail.set(socket.id, email);
    socket.join(roomCode);
    socket.emit("join-room", { roomCode });
    socket.broadcast.to(roomCode).emit("user-joined", { email });
  });

  socket.on("call-user", ({ email, offer }) => {
    console.log("calling user", email, offer); // Added logging for debugging
    const socketId = SocketMapping.get(email);
    const fromEmail = SocketToEmail.get(socket.id);
    if (socketId) {
      console.log("calling user", fromEmail, socketId);
      socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    } else {
      socket.emit("call-failed", { message: "User not found" });
    }
  });

  socket.on("disconnect", () => {
    const email = SocketToEmail.get(socket.id);
    if (email) {
      SocketMapping.delete(email);
      SocketToEmail.delete(socket.id);
      console.log("user disconnected", email);
    }
  });
});

server.listen(8000, () => {
  console.log("HTTP server started on port 8000");
});
io.listen(8001);
