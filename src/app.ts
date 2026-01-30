import express from 'express';
import cors from 'cors';
import tasks from './routes/tasks.routes';
import entries from './routes/timeEntries.routes';
import { runMigrations } from './db/migrations';
import projectsRoutes from './routes/projects.routes';
import reportsRoutes from './routes/reports.routes';

runMigrations();

export const app = express();

/* 🔥 DESLIGA CACHE / ETAG (OBRIGATÓRIO) */
app.disable('etag');

app.use(cors());
app.use(express.json());

/* 🔥 GARANTE NO-CACHE EM TODAS AS RESPOSTAS */
app.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use('/tasks', tasks);
app.use('/time-entries', entries);
app.use('/projects', projectsRoutes);
app.use('/reports', reportsRoutes);
