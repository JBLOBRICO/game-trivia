"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.authenticateToken = authenticateToken;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../db/database");
exports.authRouter = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'trivia-board-secret-key-12345';
// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Access token missing' });
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}
// Register
exports.authRouter.post('/register', async (req, res) => {
    const { username, password, avatar } = req.body;
    if (!username || !password || !avatar) {
        return res.status(400).json({ error: 'Username, password, and avatar are required' });
    }
    try {
        const db = await (0, database_1.getDatabase)();
        // Check if user exists
        const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Username is already taken' });
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hash = await bcryptjs_1.default.hash(password, salt);
        // Insert user
        const result = await db.run('INSERT INTO users (username, password_hash, avatar, xp, coins) VALUES (?, ?, ?, ?, ?)', [username, hash, avatar, 0, 100] // Start with 100 coins
        );
        const userId = result.lastID;
        // Create default player stats
        await db.run('INSERT INTO player_stats (user_id, games_played, games_won, correct_answers, wrong_answers, coins_earned) VALUES (?, 0, 0, 0, 0, 0)', [userId]);
        // Create token
        const token = jsonwebtoken_1.default.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: userId,
                username,
                avatar,
                xp: 0,
                coins: 100
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login
exports.authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const db = await (0, database_1.getDatabase)();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                xp: user.xp,
                coins: user.coins
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get profile details
exports.authRouter.get('/me', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const db = await (0, database_1.getDatabase)();
        const user = await db.get('SELECT id, username, avatar, xp, coins FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
