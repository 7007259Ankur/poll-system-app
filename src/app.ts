import express from "express";
import cors from "cors";
import pollRoutes from "./routes/poll.routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ FIX: Allow both Localhost AND Netlify
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5000",
      process.env.CLIENT_URL || "", 
      "https://fluffy-dieffenbachia-0ec496.netlify.app" // Your Netlify URL
    ],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/polls", pollRoutes); 

export default app;