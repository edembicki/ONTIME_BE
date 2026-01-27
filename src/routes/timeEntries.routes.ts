import { Router } from 'express';
import { db } from '../db/database';
import crypto from 'crypto';

const router = Router();

router.post('/', (req, res) => {
  const id = crypto.randomUUID();
  const { taskId, userId, date, start, end, hours, notes } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: 'userId é obrigatório para time_entry',
    });
  }

  db.prepare(`
    INSERT INTO time_entries
      (id, task_id, user_id, date, start, end, hours, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    taskId,
    userId,
    date,
    start,
    end,
    hours,
    notes ?? null
  );

  res.status(201).json({ id });
});

router.get('/', (req, res) => {
  const { userId } = req.query;

  const rows = userId
    ? db.prepare(`
        SELECT te.*, t.title AS task_title
          FROM time_entries te
          JOIN tasks t ON t.id = te.task_id
         WHERE te.user_id = ?
         ORDER BY te.date DESC
      `).all(userId)
    : db.prepare(`
        SELECT te.*, t.title AS task_title
          FROM time_entries te
          JOIN tasks t ON t.id = te.task_id
         ORDER BY te.date DESC
      `).all();

  res.json(rows);
});

export default router;
