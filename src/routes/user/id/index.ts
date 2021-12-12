import { Router } from 'express';
import notificationRouter from './notification';
import categoryRouter from './category';

const router = Router();
router.use('/notification', notificationRouter);
router.use('/category', categoryRouter);

export default router;
