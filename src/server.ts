import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors"; // ✅ Import cors
import app from "./app"; 
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

// ✅ 2. Define Allowed Origins (Centralized List)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.CLIENT_URL || "", 
  "https://fluffy-dieffenbachia-0ec496.netlify.app" // Your Netlify URL
];

// ✅ 3. Apply CORS to Express (Fixes the "History" fetch error)
// Note: This attempts to apply it here, but checking app.ts is recommended (see below)
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ 4. Setup Socket.io with the same origins
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// 5. Initialize Socket Logic
pollSocket(io);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});