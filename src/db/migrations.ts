import { db } from './database';

export function runMigrations() {
  db.exec(`
    /* =========================
       TASKS
    ========================= */
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project TEXT,
      billable INTEGER,
      status TEXT,
      default_duration TEXT,
      user_id TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    /* =========================
       TIME ENTRIES (CALENDÁRIO)
    ========================= */
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      user_id TEXT,
      date TEXT,
      start TEXT,
      end TEXT,
      hours REAL,
      notes TEXT,
      FOREIGN KEY(task_id) REFERENCES tasks(id)
    );

    /* =========================
       REPORTS (SEVENSYS)
    ========================= */
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      destination_email TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      format TEXT NOT NULL,        -- csv | pdf | pdf+csv
      csv_base64 TEXT,
      pdf_base64 TEXT,
      created_at TEXT NOT NULL
    );

    /* =========================
       USER SETTINGS
    ========================= */
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      sender_email TEXT
    );
  `);

  /* =========================
     BACKWARD COMPATIBILITY
  ========================= */
  ensureColumn('tasks', 'default_duration', 'TEXT');
  ensureColumn('tasks', 'user_id', 'TEXT');

  ensureColumn('time_entries', 'user_id', 'TEXT');

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

/* =========================
   HELPER
========================= */
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
