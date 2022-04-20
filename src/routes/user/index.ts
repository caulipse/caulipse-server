import { Router } from 'express';
import profileRouter from './profile';
import loginRouter from './login';
import logoutRouter from './logout';
import roleRouter from './role';
import notificationRouter from './notification';
import bookmarkRouter from './bookmark';
import controller from './user.controller';
import { checkToken } from '../../middlewares/auth';

const router = Router();
router.use('/notification', checkToken, notificationRouter);
router.use('/profile', profileRouter);
router.use('/login', loginRouter);
router.use('/logout', checkToken, logoutRouter);
router.use('/bookmark', checkToken, bookmarkRouter);
router.use('/study/applied', checkToken, controller.getAppliedStudies);

router.post('/', controller.saveUser);
router.delete('/', checkToken, controller.deleteUser);
router.get('/', checkToken, controller.getUser);
router.patch('/password', controller.updatePassword);
router.get('/duplicate', controller.getEmailDuplicate);
router.use('/:id/role', roleRouter);
router.patch('/:id/password', controller.saveChangedPassword);
router.patch('/:id', controller.updateUserInfo);

export default router;
