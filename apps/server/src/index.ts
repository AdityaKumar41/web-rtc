import express from "express";
import { Server } from "socket.io";
import cors from "cors";

const io = new Server({
  cors: {
    origin: "*",
  },
});
const app = express();

app.use(cors());
app.use(express.json());

const SocketMapping = new Map();

// setup connection
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("joined-room", (room) => {
    const { roomCode, email } = room;
    console.log("joined room", roomCode, email);
    SocketMapping.set(email, socket.id);
    socket.join(room);
    socket.emit("join-room", { roomCode });
    socket.broadcast.to(roomCode).emit("user-joined", { email });
  });
});

app.listen(8000, () => {
  console.log("HTTP server started on port 8000");
});
io.listen(8001);
