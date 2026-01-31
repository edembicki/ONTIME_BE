import { db } from './database';

export function runMigrations() {
  /**
   * =====================================
   * GARANTE FOREIGN KEYS ATIVAS NO SQLITE
   * =====================================
   */
  db.exec('PRAGMA foreign_keys = ON;');

  /**
   * =========================
   * SHEETS (novo domínio)
   * =========================
   */
  db.exec(`
    CREATE TABLE IF NOT EXISTS sheets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  /**
   * =========================
   * TASKS
   * =========================
   */
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project TEXT,
      billable INTEGER,
      status TEXT,
      default_duration TEXT,
      user_id TEXT,     -- legado
      sheet_id TEXT,    -- novo domínio
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (sheet_id)
        REFERENCES sheets(id)
        ON DELETE CASCADE
    );
  `);

  /**
   * =========================
   * TIME ENTRIES
   * (recriação com FK correta)
   * =========================
   */
  db.exec(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS time_entries_new (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      sheet_id TEXT,
      user_id TEXT, -- legado
      date TEXT,
      start TEXT,
      end TEXT,
      hours REAL,
      notes TEXT,
      FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
      FOREIGN KEY (sheet_id)
        REFERENCES sheets(id)
        ON DELETE CASCADE
    );

    INSERT INTO time_entries_new (
      id,
      task_id,
      sheet_id,
      user_id,
      date,
      start,
      end,
      hours,
      notes
    )
    SELECT
      id,
      task_id,
      NULL,
      user_id,
      date,
      start,
      end,
      hours,
      notes
    FROM time_entries
    WHERE EXISTS (
      SELECT 1 FROM sqlite_master
      WHERE type = 'table'
        AND name = 'time_entries'
    );

    DROP TABLE IF EXISTS time_entries;
    ALTER TABLE time_entries_new RENAME TO time_entries;

    PRAGMA foreign_keys = ON;
  `);

  /**
   * =========================
   * REPORTS
   * =========================
   */
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      sheet_id TEXT,
      user_id TEXT, -- legado
      sender_email TEXT NOT NULL,
      destination_email TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      format TEXT NOT NULL,
      csv_base64 TEXT,
      pdf_base64 TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sheet_id)
        REFERENCES sheets(id)
        ON DELETE CASCADE
    );
  `);

  /**
   * =========================
   * USER SETTINGS (legado)
   * =========================
   */
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      sender_email TEXT
    );
  `);

  /**
   * =========================
   * BACKWARD COMPATIBILITY
   * =========================
   */
  ensureColumn('tasks', 'default_duration', 'TEXT');
  ensureColumn('tasks', 'user_id', 'TEXT');
  ensureColumn('tasks', 'sheet_id', 'TEXT');

  ensureColumn('time_entries', 'user_id', 'TEXT');
  ensureColumn('time_entries', 'sheet_id', 'TEXT');

  ensureColumn('reports', 'user_id', 'TEXT');
  ensureColumn('reports', 'sheet_id', 'TEXT');
  ensureColumn('reports', 'destination_email', 'TEXT');
  ensureColumn('reports', 'csv_base64', 'TEXT');
  ensureColumn('reports', 'pdf_base64', 'TEXT');
  ensureColumn('reports', 'sender_email', 'TEXT');
  ensureColumn('reports', 'period_start', 'TEXT');
  ensureColumn('reports', 'period_end', 'TEXT');
  ensureColumn('reports', 'format', 'TEXT');
  ensureColumn('reports', 'created_at', 'TEXT');

  ensureColumn('user_settings', 'sender_email', 'TEXT');
}

/**
 * =========================
 * HELPER
 * =========================
 */
function ensureColumn(
  table: string,
  column: string,
  type: string
) {
  const cols = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as any[];

  if (!cols.some((c) => c.name === column)) {
    db.exec(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`
    );
  }
}
