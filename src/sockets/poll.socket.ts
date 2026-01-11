import { Server, Socket } from "socket.io";
import PollService from "../services/poll.service"; // Import the singleton service

export const pollSocket = (io: Server) => {
  // 1. Initialize Service with IO (so it can emit timer updates automatically)
  PollService.init(io);

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    // ===========================================
    // 1. RESILIENCE: Handle Refresh/New Connection
    // ===========================================
    socket.on("get_current_state", (data) => {
      const { studentName } = data || {};
      
      // Get the correct state (Public vs Student-Specific)
      const pollState = studentName 
        ? PollService.getPollForStudent(studentName) 
        : PollService.getPublicPoll();
        
      // Send it back immediately
      socket.emit("sync_state", { poll: pollState });
    });

    // ===========================================
    // 2. TEACHER: Create Poll
    // ===========================================
    socket.on("create_poll", (data) => {
      // The Service handles the timer loop & ID generation
      const newPoll = PollService.createPoll(data);
      
      // Notify everyone that a poll started
      io.emit("poll_started", newPoll);
    });

    // ===========================================
    // 3. STUDENT: Submit Vote
    // ===========================================
    socket.on("submit_vote", (data) => {
      // Frontend sends: { pollId, optionId, studentName }
      const { studentName, optionId } = data;

      // The Service validates the vote (checks active status, double voting)
      const updatedPoll = PollService.vote(studentName, optionId);
      
      // If vote was valid, the service returns the new state. 
      // We don't need to manually calculate percentages here!
      if (updatedPoll) {
        io.emit("poll_updated", updatedPoll);
      }
    });
    
    // Optional: Handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
  });
};