import Database from 'better-sqlite3';
import path from 'path';

export const db = new Database(
  path.resolve(process.cwd(), 'zedor.db')
);

db.pragma('journal_mode = WAL');
