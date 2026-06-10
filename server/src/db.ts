import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

let dbInstance: Database | null = null;

export async function initDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(__dirname, '../../tasks.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create tasks table if it doesn't exist
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      dueDate TEXT,
      status TEXT CHECK(status IN ('Active', 'Completed')) NOT NULL DEFAULT 'Active',
      creationDate TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    )
  `);

  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbInstance;
}
