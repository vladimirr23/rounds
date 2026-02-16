import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'monitoring.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    initializeDatabase();
  }
});

function initializeDatabase(): void {
  // Create apps table
  db.run(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appId TEXT UNIQUE NOT NULL,
      appName TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create screenshots table
  db.run(`
    CREATE TABLE IF NOT EXISTS screenshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appId INTEGER NOT NULL,
      imageFilename TEXT NOT NULL,
      status TEXT DEFAULT 'captured',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appId) REFERENCES apps(id) ON DELETE CASCADE
    )
  `);

}

export default db;
