import { Router } from 'express';
import helloWorld from '../../../hello-world';

const router = Router();
// 사용자의 관심 카테고리 목록 읽어오기
router.get('/', helloWorld);
// 사용자의 관심 카테고리 추가
router.post('/', helloWorld);
// 사용자의 관심 카테고리 해제
router.delete('/:categoryCode', helloWorld);

export default router;
