import { Router } from 'express';
import { db } from '../models/db.js';
import { authMiddleware } from './auth.js';
const router = Router();
// GET /api/trivia?category=Science&difficulty=easy
router.get('/', authMiddleware, (req, res) => {
    const { category, difficulty } = req.query;
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];
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
    const stmt = db.prepare(query);
    const row = stmt.get(...params);
    if (!row) {
        return res.status(404).json({ error: 'No question found' });
    }
    // Return without exposing internal ID or answer key
    const { id, correct_choice, ...question } = row;
    res.json({ question });
});
export default router;
