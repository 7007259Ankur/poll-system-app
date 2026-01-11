import express from 'express';
import Poll from '../models/Poll';

const router = express.Router();

// GET /api/polls/history
router.get('/history', async (req, res) => {
  try {
    // Fetch only 'ended' polls, sorted by newest first
    const history = await Poll.find({ status: 'ended' })
      .sort({ createdAt: -1 })
      .limit(20); 
      
    res.json(history);
  } catch (err) {
    console.error("History Fetch Error:", err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;