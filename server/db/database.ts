import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const dbPath = path.join(__dirname, 'game.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign key support
  await db.run('PRAGMA foreign_keys = ON');

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question_text TEXT NOT NULL,
      choices TEXT NOT NULL, -- JSON stringified array of 4 choices
      correct_answer TEXT NOT NULL,
      explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      user_id INTEGER PRIMARY KEY,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      wrong_answers INTEGER DEFAULT 0,
      coins_earned INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_mode TEXT NOT NULL,
      winner_username TEXT NOT NULL,
      players TEXT NOT NULL, -- JSON stringified details of players
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, type)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      mode TEXT NOT NULL,
      host_user_id INTEGER,
      status TEXT DEFAULT 'lobby',
      board_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
  `);

  return db;
}
