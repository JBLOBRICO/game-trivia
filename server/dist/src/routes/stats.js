"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
exports.updatePlayerMatchStats = updatePlayerMatchStats;
const express_1 = require("express");
const database_1 = require("../db/database");
exports.statsRouter = (0, express_1.Router)();
// Get Leaderboard (top 15 players by XP)
exports.statsRouter.get('/leaderboard', async (req, res) => {
    try {
        const db = await (0, database_1.getDatabase)();
        const list = await db.all(`
      SELECT u.id, u.username, u.avatar, u.xp, s.games_played, s.games_won, s.correct_answers
      FROM users u
      LEFT JOIN player_stats s ON u.id = s.user_id
      ORDER BY u.xp DESC
      LIMIT 15
    `);
        res.json(list);
    }
    catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get User Specific Profile Details
exports.statsRouter.get('/profile/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const db = await (0, database_1.getDatabase)();
        // Get user
        const user = await db.get('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get stats
        const stats = await db.get('SELECT * FROM player_stats WHERE user_id = ?', [user.id]);
        // Get achievements
        const achievements = await db.all('SELECT type, unlocked_at FROM achievements WHERE user_id = ?', [user.id]);
        res.json({
            user,
            stats: stats || { games_played: 0, games_won: 0, correct_answers: 0, wrong_answers: 0, coins_earned: 0 },
            achievements
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get Recent Match History (last 10 games)
exports.statsRouter.get('/matches', async (req, res) => {
    try {
        const db = await (0, database_1.getDatabase)();
        const matches = await db.all('SELECT * FROM match_history ORDER BY played_at DESC LIMIT 10');
        // Parse matches
        const parsedMatches = matches.map(m => ({
            ...m,
            players: JSON.parse(m.players)
        }));
        res.json(parsedMatches);
    }
    catch (error) {
        console.error('Matches fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Post-match stats update endpoint (Internal / authenticated)
// Usually called from the Socket server when a match completes
async function updatePlayerMatchStats(userId, isWinner, correctAnswers, wrongAnswers, coinsEarned, xpEarned) {
    const db = await (0, database_1.getDatabase)();
    // Update user XP & coins
    await db.run('UPDATE users SET xp = xp + ?, coins = coins + ? WHERE id = ?', [xpEarned, coinsEarned, userId]);
    // Update player stats
    const wonIncrement = isWinner ? 1 : 0;
    await db.run(`
    UPDATE player_stats 
    SET games_played = games_played + 1,
        games_won = games_won + ?,
        correct_answers = correct_answers + ?,
        wrong_answers = wrong_answers + ?,
        coins_earned = coins_earned + ?
    WHERE user_id = ?
  `, [wonIncrement, correctAnswers, wrongAnswers, coinsEarned, userId]);
    // Check and award achievements
    await checkAndAwardAchievements(userId, db);
}
// Check and Award Achievements
async function checkAndAwardAchievements(userId, db) {
    const stats = await db.get('SELECT * FROM player_stats WHERE user_id = ?', [userId]);
    if (!stats)
        return;
    const currentAchievements = await db.all('SELECT type FROM achievements WHERE user_id = ?', [userId]);
    const ownedTypes = new Set(currentAchievements.map((a) => a.type));
    const checkInsert = async (type) => {
        if (!ownedTypes.has(type)) {
            await db.run('INSERT OR IGNORE INTO achievements (user_id, type) VALUES (?, ?)', [userId, type]);
        }
    };
    // 1. First Win
    if (stats.games_won >= 1) {
        await checkInsert('FIRST_WIN');
    }
    // 2. Trivia Veteran (10 games played)
    if (stats.games_played >= 10) {
        await checkInsert('TRIVIA_VETERAN');
    }
    // 3. Trivia Master (50 correct answers)
    if (stats.correct_answers >= 50) {
        await checkInsert('TRIVIA_MASTER');
    }
    // 4. Coin Hoarder (1000 coins earned total)
    if (stats.coins_earned >= 1000) {
        await checkInsert('COIN_HOARDER');
    }
    // 5. Brainiac (10 games won)
    if (stats.games_won >= 10) {
        await checkInsert('BRAINIAC');
    }
}
