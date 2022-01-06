import { Router } from 'express';
import helloWorld from '../../hello-world';
import roleRouter from './role';
import notificationRouter from './notification';
import categoryRouter from './category';

const router = Router();
router.patch('/', helloWorld);
router.delete('/', helloWorld);
router.use('/role', roleRouter);
router.use('/notification', notificationRouter);
router.use('/category', categoryRouter);
router.use('/bookmark', categoryRouter);

export default router;