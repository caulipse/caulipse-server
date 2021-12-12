import { Router } from 'express';
import idRouter from './id';
import profileRouter from './profile';

const router = Router();
router.use('/profile', profileRouter);
router.use('/:id', idRouter);

export default router;
