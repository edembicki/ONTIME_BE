import { Router } from 'express';
import { PROJECTS } from '../constants/projects';

const router = Router();

router.get('/', (_, res) => {
  res.json(PROJECTS);
});

export default router;
