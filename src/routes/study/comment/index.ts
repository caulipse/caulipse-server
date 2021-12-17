import { Router } from 'express';
import commentIdRouter from './id';

const router = Router();
router.use('/:id', commentIdRouter);

export default router;