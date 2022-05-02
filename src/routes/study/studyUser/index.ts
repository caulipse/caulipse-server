import { Router } from 'express';
import { checkToken } from '../../../middlewares/auth';
import controller from './studyUser.controller';

const router = Router({ mergeParams: true });

router.get('/', checkToken, controller.getStudyUserList);
router.post('/', checkToken, controller.joinStudy);
router.patch('/', checkToken, controller.updateStudyJoin);

router.get('/participants', controller.getStudyParticipants);
router.patch('/accept', checkToken, controller.acceptUser);

router.delete('/:userid', checkToken, controller.deleteStudyJoin);

export default router;
