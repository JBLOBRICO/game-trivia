import { Router, Request, Response } from 'express';
import { getDatabase } from '../../db/database';
import { authMiddleware } from './auth';

const router = Router();

// GET /api/trivia?category=Science&difficulty=easy
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const { category, difficulty } = req.query;
  let query = 'SELECT * FROM questions WHERE 1=1';
  const params: any[] = [];
  if (category) {
    query += ' AND category = ?';
    params.push(String(category));
  }
  if (difficulty) {
    query += ' AND difficulty = ?';
    params.push(String(difficulty));
  }
  // Random order, limit 1
  query += ' ORDER BY RANDOM() LIMIT 1';
  
  try {
    const db = await getDatabase();
    const row = await db.get(query, ...params);
    if (!row) {
      return res.status(404).json({ error: 'No question found' });
    }
    // Return without exposing internal ID or answer key
    const { id, correct_answer, ...question } = row;
    res.json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
