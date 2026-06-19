import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

sqlite3.verbose();
const dbPath = path.resolve(__dirname, '../../data/game.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath);

export function initDB() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 20,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, err => { if (err) console.error(err); });

  // Rooms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      mode TEXT NOT NULL,
      host_user_id INTEGER,
      status TEXT DEFAULT 'lobby',
      board_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, err => { if (err) console.error(err); });

  // Room participants
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_players (
      room_id INTEGER,
      user_id INTEGER,
      avatar TEXT,
      character TEXT,
      position INTEGER DEFAULT 0,
      shield INTEGER DEFAULT 0,
      double_move INTEGER DEFAULT 0,
      trap_protect INTEGER DEFAULT 0,
      ready INTEGER DEFAULT 0,
      PRIMARY KEY (room_id, user_id)
    );
  `, err => { if (err) console.error(err); });

  // Trivia questions
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      difficulty TEXT,
      question TEXT,
      choice_a TEXT,
      choice_b TEXT,
      choice_c TEXT,
      choice_d TEXT,
      correct_choice TEXT,
      explanation TEXT
    );
  `, err => { if (err) console.error(err); });

  // Matches/history
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT,
      mode TEXT,
      winner_username TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      match_json TEXT
    );
  `, err => { if (err) console.error(err); });

  // Achievements
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, err => { if (err) console.error(err); });
}
