import express from 'express';
import cors from 'cors';
import tasks from './routes/tasks.routes';
import entries from './routes/timeEntries.routes';
import { runMigrations } from './db/migrations';
import projectsRoutes from './routes/projects.routes';
import reportsRoutes from './routes/reports.routes';

runMigrations();

export const app = express();
app.use(cors());
app.use(express.json());

app.use('/tasks', tasks);
app.use('/time-entries', entries);
app.use('/projects', projectsRoutes);
app.use('/reports', reportsRoutes);
