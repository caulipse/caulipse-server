import { Request, Response } from 'express';
import {
  deleteByStudyAndUserId,
  findAcceptedByStudyId,
  findNotAcceptedApplicantsByStudyId,
  saveStudyUserRecord,
  updateAcceptStatus,
  updateUserTempBio,
} from '../../../services/studyUser';
import studyService from '../../../services/study';
import { findUserProfileById } from '../../../services/user/profile';
import { createStudyNoti, NotiTypeEnum } from '../../../services/notification';

export default {
  /**
   * 신청이 수락된 인원 조회 (참가자 조회, 인증 로직 X)
   */
  async getStudyParticipants(req: Request, res: Response) {
    const NOT_FOUND = '일치하는 studyid 가 없음';

    try {
      const study = await studyService.findStudyById(req.params.studyid);
      if (!study) throw new Error(NOT_FOUND);

      const result = await findAcceptedByStudyId(req.params.studyid);
      res.json(
        result.map((record: Record<string, string | boolean>) => ({
          studyId: record.STUDY_ID,
          userId: record.USER_ID,
          tempBio: record.TEMP_BIO,
          username: record.USER_NAME,
          image: record.IMAGE,
        }))
      );
    } catch (e) {
      const err = e as Error;
      if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(500).json({ message: 'error' });
      }
    }
  },
  /**
   * 신청 수락대기중 인원 조회 (인증 로직 O)
   */
  async getStudyUserList(req: Request, res: Response) {
    const NOT_FOUND = '일치하는 studyid 가 없음';
    const FORBIDDEN = '사용자 권한 부족';

    try {
      const study = await studyService.findStudyById(req.params.studyid);
      if (!study) throw new Error(NOT_FOUND);

      const userId = (req.user as { id: string }).id;
      const hasAuthority = study?.HOST_ID === userId;

      if (!hasAuthority) throw new Error(FORBIDDEN);

      const result = await findNotAcceptedApplicantsByStudyId(
        req.params.studyid
      );
      res.json(
        result.map((record: Record<string, string | boolean>) => ({
          studyId: record.StudyUser_STUDY_ID,
          userId: record.StudyUser_USER_ID,
          isAccepted: record.StudyUser_IS_ACCEPTED,
          tempBio: record.StudyUser_TEMP_BIO,
        }))
      );
    } catch (e) {
      const err = e as Error;
      if (err.message === FORBIDDEN) {
        res.status(403).json({ message: FORBIDDEN });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(500).json({ message: 'error ' });
      }
    }
  },
  async joinStudy(req: Request, res: Response) {
    const OK = '참가신청 성공';
    const BAD_REQUEST = '잘못된 요창';
    const NOT_FOUND = '일치하는 study id 가 없음';

    try {
      const { tempBio } = req.body;
      const { studyid } = req.params;
      const userId = (req.user as { id: string }).id;
      if (!tempBio) throw new Error(BAD_REQUEST);

      try {
        await saveStudyUserRecord({
          userId,
          studyId: studyid,
          tempBio,
        });
      } catch (err) {
        res.status(404).json({ message: NOT_FOUND });
        return;
      }

      const study = await studyService.findStudyById(studyid);
      if (!study) {
        throw new Error(NOT_FOUND);
      }
      if (process.env.NODE_ENV !== 'test') {
        const profile = await findUserProfileById(userId);
        await createStudyNoti({
          id: studyid,
          userId: study.HOST_ID,
          title: '새로운 신청자',
          about: `[${profile?.userName}]님이 신청수락을 요청했어요.`,
          type: NotiTypeEnum.NEW_APPLY,
        });
      }

      res.status(201).json({ message: OK });
    } catch (e) {
      if ((e as Error).message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if ((e as Error).message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        console.log((e as Error).toString());
        res.status(500).json({ message: 'error' });
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
      if (!study) throw new Error(NOT_FOUND);

      const userId = (req.user as { id: string }).id;
      if (study.HOST_ID !== userId) throw new Error(FORBIDDEN);
      if (study.capacity === study.membersCount) throw new Error(BAD_REQUEST);

      const updateResult = await updateAcceptStatus(
        studyId,
        targetUserId,
        accept
      );
      if (updateResult.affected === 0) throw new Error(NOT_FOUND);
      await studyService.increaseMemberCount(studyId);

      if (process.env.NODE_ENV !== 'test') {
        await createStudyNoti({
          id: studyId,
          userId: targetUserId,
          title: '참가완료',
          about: '스터디의 참가신청이 수락되었어요:)',
          type: NotiTypeEnum.ACCEPT,
        });
      }

      res.json({ message: OK });
    } catch (e) {
      const err = e as Error;
      if (err.message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if (err.message === FORBIDDEN) {
        res.status(403).json({ message: FORBIDDEN });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(500).json({ message: 'error' });
      }
    }
  },
  async updateStudyJoin(req: Request, res: Response) {
    const BAD_REQUEST = 'request is not valid';
    const NOT_FOUND = '일치하는 studyid가 없음';

    try {
      const { tempBio } = req.body;
      const { studyid } = req.params;
      if (!studyid || !tempBio) throw new Error(BAD_REQUEST);

      const userId = (req.user as { id: string }).id;
      const result = await updateUserTempBio(studyid, userId, tempBio);
      if (result.affected === 0) throw new Error(NOT_FOUND);

      res.json({ message: '참가신청 현황 수정 성공 ' });
    } catch (e) {
      const err = e as Error;
      if (err.message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(500).json({ message: 'error' });
      }
    }
  },
  async deleteStudyJoin(req: Request, res: Response) {
    const OK = '참가신청 취소 성공';
    const BAD_REQUEST = '요청 url에 스터디id 와 대상 사용자id 가 없음';
    const FORBIDDEN = '삭제 권한 없음';
    const NOT_FOUND = '삭제 대상 참가신청이 존재하지 않음';

    try {
      const { studyid, userid: targetUserId } = req.params;
      if (!studyid || !targetUserId) throw new Error(BAD_REQUEST);
      const userId = (req.user as { id: string }).id;

      const study = await studyService.findStudyById(studyid);
      if (!study) throw new Error(NOT_FOUND);

      const isDeletedByHost = study.HOST_ID === userId;
      if (userId !== targetUserId && isDeletedByHost)
        throw new Error(FORBIDDEN);

      if (isDeletedByHost) {
        await updateAcceptStatus(studyid, targetUserId, false);
      } else {
        const result = await deleteByStudyAndUserId(studyid, targetUserId);
        if (result.affected === 0) throw new Error(NOT_FOUND);
      }

      await studyService.decreaseMemberCount(studyid);
      res.json({ message: OK });

      /* 호스트가 참가신청 취소해버린 경우 */
      if (process.env.NODE_ENV !== 'test') {
        await createStudyNoti({
          id: studyid,
          userId: userId,
          title: '참가 취소',
          about: '스터디의 참가신청이 취소되었어요:(',
          type: NotiTypeEnum.REJECT,
        });
      }
    } catch (e) {
      const err = e as Error;
      if (err.message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(500).json({ message: 'error' });
      }
    }
  },
};

/**
 * @swagger
 * /api/study/{studyid}/user:
 *     get:
 *       tags:
 *       - study/user
 *       summary: "현재 참가신청 수락대기중인 인원의 목록을 조회합니다"
 *       description: "해당 스터디에 참가신청이 수락대기 상태인 사용자 목록을 읽어오기 위한 엔드포인트입니다. 해당 스터디의 호스트만 조회할 수 있습니다."
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
 *                 example: "로그인이 필요한 서비스입니다"
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
 *                 example: "로그인이 필요한 서비스입니다"
 *         404:
 *           description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "일치하는 studyid가 없음"
 *     patch:
 *        tags:
 *        - study/user
 *        summary: "참가신청 현황 수정"
 *        description: "사용자가 해당 스터디에 대한 자신의 참가신청 현황을 수정하기 위한 엔드포인트입니다."
 *        parameters:
 *        - in: "path"
 *          name: "studyid"
 *          description: "참가신청 현황을 수정할 스터디 id"
 *          required: true
 *          type: string
 *          format: uuid
 *        - in: "body"
 *          name: "body"
 *          description: "참가신청을 보내는 유저의 정보를 포함한 객체"
 *          required: true
 *          schema:
 *            type: object
 *            properties:
 *              tempBio:
 *                type: string
 *                description: "스터디 호스트에게 보내지는 사용자의 인사말 / 소개글"
 *
 *        responses:
 *          200:
 *            description: "올바른 요청"
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "참가신청 현황 수정 성공"
 *          400:
 *            description: "요청 body에 필요 프로퍼티가 존재하지 않거나 study id가 유효하지 않은 경우입니다"
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "request is not valid"
 *          401:
 *            description: "로그인이 되어있지 않은 경우"
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "로그인이 필요한 서비스입니다"
 *          404:
 *            description: "userid와 studyid가 일치하는 레코드가 데이터베이스에 존재하지 않는 경우입니다"
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: "일치하는 studyid가 없음"
 *
 * /api/study/{studyid}/user/{userid}:
 *     delete:
 *       tags:
 *       - study/user
 *       summary: "참가신청 취소"
 *       description: "해당 사용자가 해당 스터디에 요청한 참가신청을 취소하기 위한 엔드포인트입니다."
 *       parameters:
 *       - in: "path"
 *         name: "studyid"
 *         description: "참가신청을 취소할 스터디의 id"
 *         required: true
 *         type: string
 *         format: uuid
 *       - in: "path"
 *         name: "userid"
 *         description: "참가신청을 취소할 사용자의 id"
 *         required: true
 *         type: string
 *         format: uuid
 *
 *       responses:
 *         200:
 *           description: "올바른 요청"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "참가신청 취소 성공"
 *         401:
 *           description: "로그인이 되어있지 않은 경우"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "로그인이 필요한 서비스입니다"
 *         403:
 *           description: "신청자 본인 또는 스터디 호스트가 아닌 사용자가 취소를 시도한경우"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "삭제 권한 없음"
 *         404:
 *           description: "삭제 대상 참가신청이 없는 경우입니다"
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "삭제 대상 참가신청이 없음"
 *
 * /api/study/{studyid}/user/participants:
 *   get:
 *     tags:
 *     - study/user
 *     summary: "해당 스터디에 참여중인 사용자 목록을 조회합니다"
 *     description: "해당 스터디에 참여중인(참가신청이 수락된) 사용자 목록을 조회하기 위한 엔드포인트입니다. 로그인하지 않아도 정상적인 데이터를 응답합니다"
 *     parameters:
 *     - in: "path"
 *       name: "studyid"
 *       description: "참여자 목록을 조회할 스터디 id"
 *       required: true
 *       type: string
 *       format: uuid
 *
 *     responses:
 *       200:
 *         description: "올바른 요청"
 *         schema:
 *           allOf:
 *           - type: array
 *             items:
 *               type: object
 *               properties:
 *                 studyId:
 *                   type: string
 *                   format: uuid
 *                   description: "대상 스터디 id"
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                   description: "스터디에 참가중인 사용자의 id"
 *                 tempBio:
 *                   type: string
 *                   description: "참가중인 사용자의 인사말"
 *                 username:
 *                   type: string
 *                   description: "참가중인 사용자가 서비스에서 사용중인 닉네임"
 *                 image:
 *                   type: string
 *                   description: "참가중인 사용자의 프로필 이미지 위치"
 *       404:
 *         description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "일치하는 studyid가 없음"
 *
 * /api/study/{studyid}/user/accept:
 *   patch:
 *     tags:
 *     - study/user
 *     summary: "참가신청 수락 / 거절"
 *     description: "해당 스터디의 참가신청을 보낸 사용자의 요청을 수락 또는 거절하기위한 엔드포인트입니다."
 *     parameters:
 *     - in: "path"
 *       name: "studyid"
 *       description: "참가신청 현황을 수정할 스터디 id"
 *       required: true
 *       type: string
 *       format: uuid
 *     - in: "body"
 *       name: "body"
 *       description: "참가신청을 보내는 유저의 정보를 포함한 객체"
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           accept:
 *             type: boolean
 *             description: "해당 유저를 수락할지 여부. true면 수락, false 라면 거절"
 *           userId:
 *             type: string
 *             description: "스터디 참가를 수락/거절할 사용자의 id"
 *
 *     responses:
 *       200:
 *         description: "올바른 요청"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "참가신청 현황 수정 성공"
 *       400:
 *         description: "요청값이 유효하지 않은 경우입니다. 요청 body 안에 userId 또는 accept 프로퍼티가 없거나 정원이 모두 찬 스터디의 참가신청을 수락한 경우가 해당합니다."
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "request is not valid"
 *       401:
 *         description: "로그인이 되어있지 않은 경우"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "로그인이 필요한 서비스입니다"
 *       404:
 *         description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "일치하는 studyid가 없음"
 */
