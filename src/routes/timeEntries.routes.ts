import { Router } from 'express';
import { db } from '../db/database';
import crypto from 'crypto';

const router = Router();

/**
 * =========================
 * CREATE TIME ENTRY
 * =========================
 */
router.post('/', (req, res) => {
  const id = crypto.randomUUID();

  const {
    taskId,
    userId,
    date,
    start,
    end,
    hours,
    notes,
  } = req.body;

  if (!userId) {
    return res
      .status(400)
      .json({ error: 'userId é obrigatório' });
  }

  if (!taskId) {
    return res
      .status(400)
      .json({ error: 'taskId é obrigatório' });
  }

  db.prepare(`
    INSERT INTO time_entries
      (id, task_id, user_id, date, start, end, hours, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    taskId,
    userId,
    date ?? null,
    start ?? null,
    end ?? null,
    hours ?? null,
    notes ?? null
  );

  res.status(201).json({ id });
});

/**
 * =========================
 * LIST TIME ENTRIES
 * =========================
 */
router.get('/', (req, res) => {
  const { userId } = req.query;

  const rows = userId
    ? db
        .prepare(
          `
        SELECT
          te.id,
          te.task_id,
          te.user_id,
          te.date,
          te.start,
          te.end,
          te.hours,
          te.notes,
          t.title AS task_title
        FROM time_entries te
        JOIN tasks t ON t.id = te.task_id
        WHERE te.user_id = ?
        ORDER BY te.start ASC
      `
        )
        .all(userId)
    : db
        .prepare(
          `
        SELECT
          te.id,
          te.task_id,
          te.user_id,
          te.date,
          te.start,
          te.end,
          te.hours,
          te.notes,
          t.title AS task_title
        FROM time_entries te
        JOIN tasks t ON t.id = te.task_id
        ORDER BY te.start ASC
      `
        )
        .all();

  res.json(rows);
});

/**
 * =========================
 * DELETE TIME ENTRY
 * =========================
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const result = db
    .prepare('DELETE FROM time_entries WHERE id = ?')
    .run(id);

  if (result.changes === 0) {
    return res
      .status(404)
      .json({ error: 'Time entry não encontrado' });
  }

  res.sendStatus(204);
});

export default router;
