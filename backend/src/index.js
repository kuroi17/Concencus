import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { socketAuth } from "./middleware/socketAuth.js";
import { registerChatSocket } from "./socket/chatSocket.js";
import { registerProposalSocket } from "./socket/proposalSocket.js";

const port = Number(process.env.PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();
const httpServer = http.createServer(app);

console.log(`[backend] Allowed Frontend Origin: ${frontendOrigin}`);

app.use(
  cors({
    origin: [frontendOrigin, "https://concencus.onrender.com", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "chat-backend" });
});

const io = new Server(httpServer, {
  cors: {
    origin: [frontendOrigin, "https://concencus.onrender.com", "http://localhost:5173"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.use(socketAuth);

io.on("connection", (socket) => {
  registerChatSocket(io, socket);
  registerProposalSocket(io, socket);
});

httpServer.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});
