// @ts-ignore
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../users.db');
let db: Database;

export const initializeDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        wallet_secret TEXT,
        wallet_address TEXT,
        shielded_address TEXT,
        viewing_key TEXT,
        seed_phrase TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        role TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
      )
    `);
    
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database', err);
    throw err;
  }
};

export interface User {
  id: number;
  username: string;
  wallet_address: string;
  wallet_secret: string;
  shielded_address: string;
  viewing_key?: string;
  seed_phrase?: string;
}

export const createUser = async (username: string, walletAddress: string, walletSecret: string, shieldedAddress: string): Promise<User> => {
  await db.run(
    'INSERT INTO users (username, wallet_address, wallet_secret, shielded_address) VALUES (?, ?, ?, ?)',
    [username, walletAddress, walletSecret, shieldedAddress]
  );
  
  const user = await getUser(username);
  if (!user) throw new Error("Failed to create user");
  return user;
};

export const getUser = async (username: string): Promise<User | undefined> => {
  return await db.get('SELECT * FROM users WHERE username = ?', [username]);
};

export const createConversation = async (userId: number, title: string) => {
  const result = await db.run(
    'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
    [userId, title]
  );
  return { id: result.lastID };
};

export const getConversations = async (userId: number) => {
  return await db.all('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC', [userId]);
};

export const addMessage = async (conversationId: number, role: string, content: string) => {
  return await db.run(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
    [conversationId, role, content]
  );
};

export const getMessages = async (conversationId: number) => {
  return await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [conversationId]);
};

