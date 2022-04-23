import { Router } from 'express';
import studyUserRouter from './studyUser';
import bookmarkRouter from './bookmark';
import commentRouter from './comment';
import { checkToken } from '../../middlewares/auth';
import controller from './study.controller';

const router = Router({ mergeParams: true });

router.get('/', controller.getAllStudy);
router.post('/', checkToken, controller.createStudy);
router.get('/:studyid', controller.getStudybyId);
router.patch('/:studyid', checkToken, controller.updateStudy);
router.delete('/:studyid', checkToken, controller.deleteStudy);

router.get('/search', controller.searchStudy);
// 모집 스터디 조회
router.get('/my-study', checkToken, controller.getMyStudy);
// 조기 마감
router.patch('/:studyid/close', checkToken, controller.closeStudy);

// 스터디 참가 신청 라우터
router.use('/user/:studyid', studyUserRouter);
// 스터디 북마크 라우터
router.use('/:studyid/bookmark', checkToken, bookmarkRouter);
// 스터디 문의글 라우터
router.use('/:studyid/comment', commentRouter);

export default router;
