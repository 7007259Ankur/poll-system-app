import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import PollModel from '../models/Poll';

// Types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  duration: number;
  remainingTime: number;
  status: 'active' | 'ended';
  votes: Record<string, string>; // Map studentName -> optionId
}

class PollService {
  private poll: Poll | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private io: Server | null = null;

  public init(io: Server) {
    this.io = io;
  }

  // 1. CREATE POLL + SAVE TO DB
  public async createPoll({ question, options, duration }: { question: string; options: { text: string }[]; duration: number }) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Create In-Memory Object
    this.poll = {
      id: uuidv4(),
      question,
      options: options.map((opt) => ({
        id: uuidv4(),
        text: opt.text,
        votes: 0,
      })),
      duration: Number(duration),
      remainingTime: Number(duration),
      status: 'active',
      votes: {},
    };

    // Save to MongoDB
    try {
      await PollModel.create({
        _id: this.poll.id,
        question: this.poll.question,
        options: this.poll.options,
        duration: this.poll.duration,
        status: 'active'
      });
      console.log("✅ Poll saved to DB:", this.poll.id);
    } catch (e) {
      console.error("❌ DB Create Error:", e);
    }

    // Start Timer
    this.timerInterval = setInterval(() => {
      if (this.poll && this.poll.remainingTime > 0) {
        this.poll.remainingTime--;
        this.io?.emit('poll_updated', this.getPublicPoll());
      } else {
        this.endPoll();
      }
    }, 1000);

    return this.getPublicPoll();
  }

  // 2. VOTE + UPDATE DB
  public vote(studentName: string, optionId: string) {
    if (!this.poll || this.poll.status !== 'active') return null;
    if (this.poll.votes[studentName]) return null;

    const option = this.poll.options.find((o) => o.id === optionId);
    if (option) {
      option.votes++;
      this.poll.votes[studentName] = optionId;

      // Update DB (Fire and forget)
      PollModel.findByIdAndUpdate(this.poll.id, { 
        options: this.poll.options 
      }).catch(err => console.error("Vote Save Error:", err));

      return this.getPublicPoll();
    }
    return null;
  }

  // 3. END POLL + UPDATE DB
  public async endPoll() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.poll) {
      this.poll.status = 'ended';
      this.poll.remainingTime = 0;
      this.io?.emit('poll_ended', this.getPublicPoll());

      // Update DB Status
      try {
        await PollModel.findByIdAndUpdate(this.poll.id, {
          status: 'ended',
          options: this.poll.options
        });
        console.log("✅ Poll ended in DB");
      } catch (e) {
        console.error("❌ DB End Error:", e);
      }
    }
  }

  public getPublicPoll() {
    if (!this.poll) return null;
    const totalVotes = Object.values(this.poll.votes).length;

    return {
      id: this.poll.id,
      question: this.poll.question,
      duration: this.poll.duration,
      remainingTime: this.poll.remainingTime,
      status: this.poll.status,
      options: this.poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        votes: o.votes,
        percentage: totalVotes === 0 ? 0 : (o.votes / totalVotes) * 100,
      })),
    };
  }

  public getPollForStudent(studentName: string) {
    const publicData = this.getPublicPoll();
    if (!publicData || !this.poll) return null;
    if (studentName && this.poll.votes[studentName]) {
      return { ...publicData, userVotedOptionId: this.poll.votes[studentName] };
    }
    return publicData;
  }
}

export default new PollService();