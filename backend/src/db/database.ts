// @ts-ignore
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../user_wallets.db');

let db: sqlite3.Database;

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Could not connect to database', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
}

function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        wallet_address TEXT NOT NULL,
        wallet_secret TEXT,
        shielded_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    db.run(sql, (err: Error | null) => {
      if (err) {
        console.error('Could not create tables', err);
        reject(err);
      } else {
        // Initialize chat tables after users table
        const sqlConversations = `
          CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
          )
        `;
        const sqlMessages = `
          CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(conversation_id) REFERENCES conversations(id)
          )
        `;
        
        db.serialize(() => {
          db.run(sqlConversations, (err: Error | null) => {
             if (err) console.error("Error creating conversations table", err);
          });
          db.run(sqlMessages, (err: Error | null) => {
             if (err) reject(err);
             else {
               console.log('Tables created or already exist');
               resolve();
             }
          });
        });
      }
    });
  });
}

export interface User {
  id: number;
  username: string;
  wallet_address: string;
  wallet_secret: string;
  shielded_address: string;
}

export function getUser(username: string): Promise<User | undefined> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], (err: Error | null, row: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as User);
      }
    });
  });
}

export function createUser(username: string, walletAddress: string, walletSecret: string, shieldedAddress: string): Promise<User> {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO users (username, wallet_address, wallet_secret, shielded_address) VALUES (?, ?, ?, ?)`;
    db.run(sql, [username, walletAddress, walletSecret, shieldedAddress], function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else {
        getUser(username).then((user) => {
            if (user) resolve(user);
            else reject(new Error("Failed to retrieve created user"));
        }).catch(reject);
      }
    });
  });
}

// --- Chat History Support ---

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function createChatTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    const sqlConversations = `
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `;
    const sqlMessages = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
      )
    `;
    
    db.serialize(() => {
      db.run(sqlConversations, (err: Error | null) => {
        if (err) {
          console.error("Error creating conversations table", err);
          reject(err);
          return;
        }
      });
      db.run(sqlMessages, (err: Error | null) => {
        if (err) {
          console.error("Error creating messages table", err);
          reject(err);
        } else {
          console.log("Chat tables created or already exist");
          resolve();
        }
      });
    });
  });
}

// Update createTables to call createChatTables
const originalCreateTables = createTables;
// We'll just append the call in the main flow or modify createTables directly. 
// Since I'm replacing the file content, I'll just modify the original createTables function above if I could, 
// but here I am appending. Let's make sure initializeDatabase calls both.

export function createConversation(userId: number, title: string): Promise<Conversation> {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO conversations (user_id, title) VALUES (?, ?)`;
    db.run(sql, [userId, title], function(this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else {
        resolve({
          id: this.lastID,
          user_id: userId,
          title,
          created_at: new Date().toISOString() // Approx
        });
      }
    });
  });
}

export function getConversations(userId: number): Promise<Conversation[]> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC`;
    db.all(sql, [userId], (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows as Conversation[]);
    });
  });
}

export function addMessage(conversationId: number, role: 'user' | 'assistant', content: string): Promise<Message> {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)`;
    db.run(sql, [conversationId, role, content], function(this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else {
        resolve({
          id: this.lastID,
          conversation_id: conversationId,
          role,
          content,
          created_at: new Date().toISOString()
        });
      }
    });
  });
}

export function getMessages(conversationId: number): Promise<Message[]> {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`;
    db.all(sql, [conversationId], (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows as Message[]);
    });
  });
}
