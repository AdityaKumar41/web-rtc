import express from "express";
import { Server } from "socket.io";
import cors from "cors";

const io = new Server();
const app = express();

app.use(cors());
app.use(express.json());

// setup connection
io.on("connection", (socket) => {});

app.listen(8000, () => {
  console.log("HTTP server started on port 8000");
});
io.listen(8001);
