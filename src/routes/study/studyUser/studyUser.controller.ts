import { Request, Response } from 'express';
import {
  findAllByStudyId,
  saveStudyUserRecord,
  updateAcceptStatus,
} from '../../../services/studyUser';
import studyService from '../../../services/study';

export default {
  async getStudyUserList(req: Request, res: Response) {
    const NOT_FOUND = '일치하는 studyid 가 없음';
    const FORBIDDEN = '사용자 권한 부족';

    let study;
    try {
      study = await studyService.findStudyById(req.params.studyid);
    } catch (e) {
      res.status(404).json({ message: NOT_FOUND });
      return;
    }

    try {
      const userId = (req.user as { id: string }).id;
      const hasAuthority = study?.HOST_ID === userId;
      if (!hasAuthority) throw new Error(FORBIDDEN);
    } catch (e) {
      res.status(403).json({ message: FORBIDDEN });
      return;
    }

    try {
      const result = await findAllByStudyId(req.params.studyid);
      res.json(
        result.map((record: Record<string, string | boolean>) => ({
          studyId: record.StudyUser_STUDY_ID,
          userId: record.StudyUser_USER_ID,
          isAccepted: record.StudyUser_IS_ACCEPTED,
          tempBio: record.StudyUser_TEMP_BIO,
        }))
      );
    } catch (e) {
      res.status(400).json({ message: '올바르지 않은 요청' });
    }
  },
  async joinStudy(req: Request, res: Response) {
    const OK = '참가신청 성공';
    const BAD_REQUEST = '잘못된 요창';
    const NOT_FOUND = '일치하는 study id 가 없음';

    try {
      const { tempBio } = req.body;
      if (!tempBio) throw new Error(BAD_REQUEST);

      await saveStudyUserRecord({
        userId: (req.user as { id: string }).id,
        studyId: req.params.studyid,
        tempBio,
      });
      res.status(201).json({ message: OK });
    } catch (e) {
      if ((e as Error).message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else {
        res.status(404).json({ message: NOT_FOUND });
      }
    }
  },
  async acceptUser(req: Request, res: Response) {
    const OK = '참가신청 현황 수정 성공';
    const BAD_REQUEST = 'request is not valid';
    const FORBIDDEN = '수락/거절 권한 없음';
    const NOT_FOUND = '일치하는 studyid 가 없음';

    try {
      const accept = req.body.accept;
      const targetUserId = req.body.userId;
      if (!targetUserId || accept === undefined || accept === null)
        throw new Error(BAD_REQUEST);

      const studyId = req.params.studyid;
      const study = await studyService.findStudyById(studyId);
      const userId = (req.user as { id: string }).id;
      if (study.HOST_ID !== userId) throw new Error(FORBIDDEN);

      const updateResult = await updateAcceptStatus(
        studyId,
        targetUserId,
        accept
      );
      if (updateResult.affected === 0) throw new Error(NOT_FOUND);

      res.json({ message: OK });
    } catch (e) {
      const err = e as Error;
      if (err.message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if (err.message === FORBIDDEN) {
        res.status(403).json({ message: FORBIDDEN });
      } else if (
        err.message === NOT_FOUND ||
        err.message === '데이터베이스에 일치하는 요청값이 없습니다' // FIXME
      ) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(400).json({ message: BAD_REQUEST });
      }
    }
  },
};

/**
 * @swagger
 * /study/user/{studyid}:
 *     get:
 *       tags:
 *       - study/user
 *       summary: "현재 참가 신청중인 사용자 목록을 읽어옵니다."
 *       description: "해당 스터디에 참가 신청중인 사용자 목록을 읽어오기 위한 엔드포인트입니다."
 *       produces:
 *       - "application/json"
 *       parameters:
 *       - in: "path"
 *         name: "studyid"
 *         description: "사용자 목록을 조회할 스터디 id"
 *         required: true
 *         type: string
 *         format: uuid
 *
 *       responses:
 *         200:
 *           description: "올바른 요청"
 *           schema:
 *             allOf:
 *             - type: array
 *               items:
 *                 type: object
 *                 $ref: "#/definitions/StudyUser"
 *         401:
 *           description: "로그인이 되어있지 않은 경우"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "로그인 필요"
 *         403:
 *           description: "자신이 개설한 스터디가 아닌 경우"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "사용자 권한 부족"
 *         404:
 *           description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "일치하는 studyid가 없음"
 *     post:
 *       tags:
 *       - study/user
 *       summary: "스터디 참가신청"
 *       description: "사용자가 해당 스터디에 참가신청 요청을 보내기 위한 엔드포인트입니다"
 *       parameters:
 *       - in: "path"
 *         name: "studyid"
 *         description: "참가신청 요청을 보낼 스터디의 id"
 *         required: true
 *         type: string
 *         format: uuid
 *       - in: "body"
 *         name: "body"
 *         description: "참가신청을 보내는 유저의 정보를 포함한 객체"
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             # 유저정보는 쿠키에 저장되어 있음(?)
 *             # userId:
 *             #   type: string
 *             #   format: uuid
 *             #   description: "참가신청을 보내는 유저의 id"
 *             tempBio:
 *               type: string
 *               description: "스터디 호스트에게 보내지는 사용자의 인사말 / 소개글"
 *
 *       responses:
 *         201:
 *           description: "올바른 요청"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "참가신청 성공"
 *         400:
 *           description: "신청 시 한마디를 의미하는 tempBio 프로퍼티가 body에 없는 경우입니다"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "잘못된 요청"
 *         401:
 *           description: "로그인이 되어있지 않은 경우"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "로그인 필요"
 *         404:
 *           description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "일치하는 studyid가 없음"
 */