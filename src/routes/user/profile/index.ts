import { Router } from 'express';
import controller from './profile.controller';
import { checkToken } from '../../../middlewares/auth';

const router = Router();

// 사용자 프로필 유저 네임 중복 확인
router.get('/duplicate', controller.getUserNameDuplicate);
// 프로필 설정 페이지
router.post('/:id', controller.createProfile);
// 사용자 프로필 정보 조회
router.get('/:id', checkToken, controller.getUserProfileById);
// 사용자 프로필 갱신
router.patch('/:id', checkToken, controller.updateUserProfileById);

export default router;
