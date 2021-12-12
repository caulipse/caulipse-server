import { Router } from 'express';
import helloWorld from '../../../hello-world';

const router = Router();
// 사용자의 알림 확인 상태 갱신
router.patch('/:notiId', helloWorld);
// 사용자의 알림 항목을 삭제
router.delete('/:notiId', helloWorld);

export default router;
