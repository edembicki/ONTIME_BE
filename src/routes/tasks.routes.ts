import { Router } from 'express';
import { db } from '../db/database';
import crypto from 'crypto';

const router = Router();

router.get('/', (req, res) => {
  const userId = (req.query.userId as string) || null;

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
          user_id,
          created_at,
          updated_at
        FROM tasks
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(userId)
    );
  }

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
        user_id,
        created_at,
        updated_at
      FROM tasks
      ORDER BY created_at DESC
    `).all()
  );
});

router.post('/', (req, res) => {
  const id = crypto.randomUUID();

  const {
    title,
    description,
    project,
    status,
    billable,
    defaultDuration,
    userId,
  } = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  db.prepare(`
    INSERT INTO tasks (
      id,
      title,
      description,
      project,
      billable,
      status,
      default_duration,
      user_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    id,
    title,
    description ?? null,
    project ?? null,
    billable ? 1 : 0,
    status ?? 'backlog',
    defaultDuration ?? '8h',
    userId
  );

  res.status(201).json({ id });
});

router.put('/:id', (req, res) => {
  const {
    title,
    description,
    project,
    billable,
    status,
    defaultDuration,
    userId,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const result = db.prepare(`
    UPDATE tasks
       SET
         title            = COALESCE(?, title),
         description      = COALESCE(?, description),
         project          = COALESCE(?, project),
         billable         = COALESCE(?, billable),
         status           = COALESCE(?, status),
         default_duration = COALESCE(?, default_duration),
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
    userId ?? null,
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.sendStatus(204);
});


router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.sendStatus(204);
});

export default router;
