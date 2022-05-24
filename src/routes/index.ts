import { Request, Response, Router } from 'express';
import userRouter from './user';
import studyRouter from './study';
import noticeRouter from './notice';
import path from 'path';

const router = Router();
router.use('/api/user', userRouter);
router.use('/api/study', studyRouter);
router.use('/api/notice', noticeRouter);

const page = path.resolve(__dirname, '../../build/index.html');
router.get('*', (req: Request, res: Response) => {
  res.sendFile(page);
});

export default router;
