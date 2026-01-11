import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app from "./app"; // Ensure app.ts exists and exports 'app'
import { pollSocket } from "./sockets/poll.socket";
import dotenv from "dotenv";
dotenv.config();


const PORT = process.env.PORT || 5000;

// Use your actual Mongo URI here
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/poll-app";

// 1. Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const server = http.createServer(app);

// 2. Setup Socket.io
// Inside src/server.ts
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      // Add "|| ''" to prevent undefined errors
      process.env.CLIENT_URL || "", 
      "https://fluffy-dieffenbachia-0ec496.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
});

// 3. Initialize Socket Logic
pollSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});