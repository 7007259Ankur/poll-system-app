import express from "express";
import cors from "cors";
import pollRoutes from "./routes/poll.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Routes
// Note: In your frontend PollHistory.tsx, you are fetching "/api/polls/history"
// So this should probably be "/api/polls" to match.
app.use("/api/polls", pollRoutes); 

export default app;