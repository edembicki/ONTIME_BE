import { Router } from 'express';
import { db } from '../db/database';
import crypto from 'crypto';

const router = Router();

/**
 * =========================
 * LIST TASKS
 * =========================
 * Prioridade:
 * 1) sheetId
 * 2) userId (legado)
 */
router.get('/', (req, res) => {
  const sheetId = (req.query.sheetId as string) || null;
  const userId = (req.query.userId as string) || null;

  if (sheetId) {
    return res.json(
      db.prepare(`
        SELECT
          id,
          title,
          description,
          project,
          billable,
          status,
          default_duration,
          sheet_id,
          user_id,
          created_at,
          updated_at
        FROM tasks
        WHERE sheet_id = ?
        ORDER BY created_at DESC
      `).all(sheetId)
    );
  }

  if (userId) {
    return res.json(
      db.prepare(`
        SELECT
          id,
          title,
          description,
          project,
          billable,
          status,
          default_duration,
          sheet_id,
          user_id,
          created_at,
          updated_at
        FROM tasks
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(userId)
    );
  }

  // fallback (admin / debug)
  return res.json(
    db.prepare(`
      SELECT
        id,
        title,
        description,
        project,
        billable,
        status,
        default_duration,
        sheet_id,
        user_id,
        created_at,
        updated_at
      FROM tasks
      ORDER BY created_at DESC
    `).all()
  );
});

/**
 * =========================
 * CREATE TASK
 * =========================
 */
router.post('/', (req, res) => {
  const id = crypto.randomUUID();

  const {
    title,
    description,
    project,
    status,
    billable,
    defaultDuration,
    sheetId,
    userId, // legado
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  if (!sheetId && !userId) {
    return res
      .status(400)
      .json({ error: 'sheetId or userId is required' });
  }

  db.prepare(`
    INSERT INTO tasks (
      id,
      title,
      description,
      project,
      billable,
      status,
      default_duration,
      sheet_id,
      user_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id,
    title,
    description ?? null,
    project ?? null,
    billable ? 1 : 0,
    status ?? 'backlog',
    defaultDuration ?? '8h',
    sheetId ?? null,
    userId ?? null
  );

  res.status(201).json({ id });
});

/**
 * =========================
 * UPDATE TASK
 * =========================
 * Nunca sobrescreve title com NULL
 */
router.put('/:id', (req, res) => {
  const {
    title,
    description,
    project,
    billable,
    status,
    defaultDuration,
    sheetId,
    userId, // legado
  } = req.body;

  const result = db.prepare(`
    UPDATE tasks
       SET
         title            = COALESCE(?, title),
         description      = COALESCE(?, description),
         project          = COALESCE(?, project),
         billable         = COALESCE(?, billable),
         status           = COALESCE(?, status),
         default_duration = COALESCE(?, default_duration),
         sheet_id         = COALESCE(?, sheet_id),
         user_id          = COALESCE(?, user_id),
         updated_at       = datetime('now')
     WHERE id = ?
  `).run(
    title ?? null,
    description ?? null,
    project ?? null,
    billable !== undefined ? (billable ? 1 : 0) : null,
    status ?? null,
    defaultDuration ?? null,
    sheetId ?? null,
    userId ?? null,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.sendStatus(204);
});

/**
 * =========================
 * DELETE TASK
 * =========================
 * Time entries são removidos via CASCADE
 */
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.sendStatus(204);
});

export default router;
