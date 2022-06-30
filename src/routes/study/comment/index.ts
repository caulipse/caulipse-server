import { Router } from 'express';
import metooRouter from './metoo';
import controller from './comment.controller';
import { checkToken } from '../../../middlewares/auth';

const router = Router({ mergeParams: true });

router.get('/login', checkToken, controller.getAllCommentWithLogIn);
router.get('/', controller.getAllComment);
router.post('/', checkToken, controller.createComment);

router.patch('/:commentid', checkToken, controller.updateComment);
router.delete('/:commentid', checkToken, controller.deleteComment);

router.use('/:commentid/metoo', metooRouter);

export default router;
