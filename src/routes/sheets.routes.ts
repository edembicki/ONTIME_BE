// src/routes/sheets.routes.ts
import { Router } from 'express';
import { db } from '../db/database';
import crypto from 'crypto';

const router = Router();

/**
 * =========================
 * GARANTE COLUNA DESCRIPTION
 * =========================
 */
function ensureDescriptionColumn() {
  const cols = db
    .prepare(`PRAGMA table_info(sheets)`)
    .all() as { name: string }[];

  if (!cols.some(c => c.name === 'description')) {
    db.exec(`ALTER TABLE sheets ADD COLUMN description TEXT`);
  }
}

/**
 * =========================
 * LISTAR SHEETS
 * =========================
 */
router.get('/', (_req, res) => {
  ensureDescriptionColumn();

  const rows = db.prepare(`
    SELECT
      id,
      name,
      description,
      created_at
    FROM sheets
    ORDER BY created_at DESC
  `).all();

  res.json(rows);
});

/**
 * =========================
 * CRIAR SHEET
 * =========================
 */
router.post('/', (req, res) => {
  ensureDescriptionColumn();

  const id = crypto.randomUUID();
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  db.prepare(`
    INSERT INTO sheets (
      id,
      name,
      description,
      created_at
    ) VALUES (?, ?, ?, datetime('now'))
  `).run(
    id,
    name,
    description ?? null
  );

  res.status(201).json({ id });
});

/**
 * =========================
 * DELETE SHEET
 * =========================
 */
router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM sheets WHERE id = ?`).run(req.params.id);
  res.sendStatus(204);
});

export default router;
