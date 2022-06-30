import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import {
  deleteUserById,
  saveUser,
  updateUserById,
  findUserById,
  findUserByEmail,
  updatePasswordById,
  updateTokenById,
} from '../../services/user';
import { sendMail } from '../../services/mail';
import { makeSignUpToken } from '../../utils/auth';
import { validateCAU } from '../../utils/mail';
import {
  findAllIfParticipatedByUserId,
  findAllStudyUserByStudyId,
} from '../../services/studyUser';
import { passwordResetContent, signupMailContent } from '../../utils/mail/html';
import studyService from '../../services/study';
import { deleteUserProfileByUserId } from '../../services/user/profile';
import { createStudyNoti, NotiTypeEnum } from '../../services/notification';

export default {
  async saveUser(req: Request, res: Response) {
    try {
      const id = randomUUID();
      const { email, password } = req.body;
      if (!email || !password)
        throw new Error('no email or password in request body');

      const user = await findUserByEmail(email);
      if (user) throw new Error('이미 가입된 유저입니다');

      const isValidEmail = validateCAU(email);
      if (!isValidEmail)
        throw new Error('중앙대 이메일로만 가입할 수 있습니다');

      const token = makeSignUpToken(id);
      // TODO: await의 나열보다 Promise.all 의 사용이 성능적인 이점이 있을까?
      await saveUser({ id, email, password, token });
      const message = await sendMail(
        email,
        '회원가입을 완료해주세요',
        signupMailContent(id, token)
      );

      res.status(201).json({ message, id });
    } catch (e) {
      res
        .status(400)
        .json({ message: '회원가입 실패: ' + (e as Error).message });
    }
  },
  async updatePassword(req: Request, res: Response) {
    const OK = '비밀번호 재설정 요청 성공';
    const BAD_REQUEST = '요청 body에 email이 포함되지 않음';
    const NOT_FOUND = '가입되지 않은 사용자';

    try {
      const { email } = req.body;
      if (!email) throw new Error(BAD_REQUEST);

      const user = await findUserByEmail(email);
      if (!user) throw new Error(NOT_FOUND);

      const newToken = makeSignUpToken(user.id);
      await updateTokenById(user.id, newToken);
      if (process.env.NODE_ENV !== 'test') {
        await sendMail(
          email,
          '비밀번호 재설정을 완료해주세요',
          passwordResetContent(email, user.id)
        );
      }

      res.json({ message: OK });
    } catch (e) {
      const err = e as Error;
      if (err.message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      }
    }
  },
  async saveChangedPassword(req: Request, res: Response) {
    const OK = '비밀번호 재설정 성공';
    const BAD_REQUEST = '요청 body에 email 또는 password가 포함되지 않음';
    const NOT_FOUND = '해당 id를 가진 사용자가 존재하지 않음';

    try {
      const { email, password: newPassword } = req.body;
      if (!email || !newPassword) throw new Error(BAD_REQUEST);

      const { id } = req.params;
      const user = await findUserById(id);
      if (!user) throw new Error(NOT_FOUND);

      await updatePasswordById(user.id, newPassword);
      res.json({ message: OK });
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
  async updateUserInfo(req: Request, res: Response) {
    const NOT_FOUND = 'id 에 해당하는 사용자 없음';

    try {
      const result = await updateUserById(req.params.id, req.body);
      if (result.affected === 0) throw new Error(NOT_FOUND);
      else return res.json({ message: '회원정보 수정 성공' });
    } catch (e) {
      if ((e as Error).message === NOT_FOUND) {
        res.status(404).json({ message: '일치하는 id값 없음' });
      } else {
        res.status(400).json({ message: 'request is not valid' });
      }
    }
  },
  async deleteUser(req: Request, res: Response) {
    const NOT_FOUND = 'id와 일치하는 사용자 없음';

    try {
      const { id } = req.user as { id: string };

      if (process.env.NODE_ENV !== 'test') {
        const studies = await studyService.getMyStudy(id);
        if (studies.length !== 0) {
          for (const study of studies) {
            const users = await findAllStudyUserByStudyId(study.id);
            if (users.length !== 0) {
              for (const user of users) {
                await createStudyNoti({
                  id: study.id,
                  userId: user.USER_ID,
                  title: '모집 취소',
                  about: '스터디가 삭제되었어요:(',
                  type: NotiTypeEnum.DELETED,
                });
              }
            }
          }
        }
      }

      const profileDeleteResult = await deleteUserProfileByUserId(id);
      const userDeleteResult = await deleteUserById(id);
      if (profileDeleteResult.affected === 0 || userDeleteResult.affected === 0)
        throw new Error(NOT_FOUND);

      res.cookie('accessToken', '', {
        maxAge: 0,
        domain: 'caustudy.com',
        sameSite: 'none',
        secure: true,
      });
      res.cookie('refreshToken', '', {
        maxAge: 0,
        domain: 'caustudy.com',
        sameSite: 'none',
        secure: true,
      });
      res.json({ message: '회원 탈퇴 성공' });
    } catch (e) {
      if ((e as Error).message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(400).json({ message: '회원 탈퇴 실패' });
      }
    }
  },
  async getUser(req: Request, res: Response) {
    const NOT_FOUND = 'id 에 해당하는 사용자 없음';
    const IS_LOGOUT = '로그아웃 혹은 인증되지 않은 상태';

    try {
      const { id } = req.user as { id: string };

      const result = await findUserById(id);
      if (!result) throw new Error(NOT_FOUND);
      else if (result.isLogout) throw new Error(IS_LOGOUT);
      else
        return res.status(200).json({
          message: '회원정보 조회 성공',
          data: {
            id: result.id,
            email: result.email,
            role: result.role,
          },
        });
    } catch (e) {
      if ((e as Error).message === IS_LOGOUT) {
        res.status(401).json({ message: IS_LOGOUT });
      } else if ((e as Error).message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(500).json({ message: '회원 탈퇴 실패' });
      }
    }
  },
  async getAppliedStudies(req: Request, res: Response) {
    try {
      const userId = (req.user as { id: string }).id;
      const result = await findAllIfParticipatedByUserId(userId);
      const response = result.map((item: Record<string, string | number>) => ({
        id: item.ID,
        title: item.TITLE,
        createdAt: item.CREATED_AT,
        views: item.VIEWS,
        bookmarkCount: item.BOOKMARK_COUNT,
        isAccepted: !!item.IS_ACCEPTED,
        membersCount: item.MEMBERS_COUNT,
        capacity: item.CAPACITY,
        isOpen: item.IS_OPEN,
        dueDate: item.DUE_DATE,
      }));
      res.json(response);
    } catch (e) {
      res.status(500).json({ message: '내가 신청한 스터디 목록 조회 실패' });
    }
  },
  async getEmailDuplicate(req: Request, res: Response) {
    const BAD_REQUEST = '요청값이 유효하지 않음';

    try {
      const email = req.query.email as string;

      if (!email) throw new Error(BAD_REQUEST);

      const result = await findUserByEmail(email);
      if (result) {
        return res
          .status(200)
          .json({ message: '이미 존재하는 이메일입니다.', data: false });
      } else {
        return res
          .status(200)
          .json({ message: '사용 가능한 이메일입니다.', data: true });
      }
    } catch (err) {
      if ((err as Error).message === BAD_REQUEST) {
        return res.status(400).json({ message: BAD_REQUEST });
      } else {
        res.json({
          error: (err as Error).message || (err as Error).toString(),
        });
      }
    }
  },
  async getMyStudy(req: Request, res: Response) {
    try {
      const userId = (req.user as { id: string }).id;

      const studies = await studyService.getMyStudy(userId);
      return res.status(200).json(studies);
    } catch (e) {
      return res.status(500).json({ message: (e as Error).message });
    }
  },
};

/**
 * @swagger
 * /api/user:
 *  post:
 *    tags:
 *    - user
 *    summary: 회원가입
 *    description: 사용자가 최초에 회원가입을 요청할 시 사용되는 엔드포인트
 *    parameters:
 *    - in: body
 *      name: body
 *      description: 회원가입하는 사용자의 정보
 *      required: true
 *      schema:
 *        type: object
 *        properties:
 *          email:
 *            type: string
 *            example: example@gmail.com
 *            description: 사용자가 사용할 이메일
 *          password:
 *            type: string
 *            example: abcd1212
 *            description: 사용자가 사용할 비밀번호(프론트단에선 암호화할 필요x)
 *      responses:
 *        "201":
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "메일을 전송했습니다. 메일함을 확인해주세요"
 *        "400":
 *          description: "요청 body에 이메일 또는 비밀번호 값이 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "회원가입 실패: no email or password in request body"
 *
 *  delete:
 *    tags:
 *    - user
 *    summary: "회원 탈퇴"
 *    description: "회원 탈퇴를 위한 엔드포인트입니다."
 *
 *    responses:
 *      200:
 *        description: "올바른 요청"
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "회원탈퇴 성공"
 *      401:
 *        description: "로그인이 되어있지 않은 경우"
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "로그인 필요"
 *      404:
 *        description: "전달된 userid값이 데이터베이스에 없는 경우입니다"
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "일치하는 userid값이 없음"
 *
 *  /api/user/study:
 *    get:
 *      summary: "모집 스터디 목록 조회"
 *      tags:
 *      - "user"
 *      - "study"
 *      description: "사용자가 모집한 스터디의 목록을 조회하는 엔드포인트입니다."
 *      responses:
 *        200:
 *          description: "올바른 요청."
 *          schema:
 *            allOf:
 *            - type: array
 *              items:
 *                $ref: "#/definitions/Study"
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *
 * /api/user/study/applied:
 *  get:
 *    tags:
 *    - user
 *    summary: "내가 신청한 스터디 목록 조회"
 *    description: "본인이 참가신청을 보낸 스터디 목록의 제목, 생성일자, 조회수, 북마크수를 배열의 형태로 조회합니다"
 *
 *    responses:
 *      200:
 *        description: "올바른 요청"
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *                example: 'test study title'
 *              createdAt:
 *                type: date-time
 *                example: '2022-03-21T16:17:13.090Z'
 *              views:
 *                type: number
 *                example: 0
 *              bookmarkCount:
 *                type: number
 *                example: 0
 *              isOpen:
 *                type: string
 *              dueDate:
 *                type: date-time
 *      401:
 *        description: "로그인이 되어있지 않은 경우"
 *        schema:
 *          type: object
 *          properties:
 *            message:
 *              type: string
 *              example: "로그인 필요"
 *
 */

/**
 * @swagger
 * /api/user/password:
 *   patch:
 *     tags:
 *     - user
 *     summary: "비밀번호 수정 요청"
 *     description: "비밀번호를 수정하기 위한 메일 인증을 요청하기 위한 엔드포인트입니다"
 *     parameters:
 *     - in: "body"
 *       name: "body"
 *       description: "사용자의 이메일 인증을 위한 중앙대 포탈"
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           email:
 *             type: string
 *             example: "testadmin1@cau.ac.kr"
 *
 *     responses:
 *       200:
 *         description: "올바른 요청"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "비밀번호 재설정 요청 성공"
 *       400:
 *         description: "요청 body에 email이 포함되지 않음"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "요청 body에 email이 포함되지 않음"
 *       404:
 *         description: "사용자의 portalId에 연결된 중앙대이메일이 데이터베이스에 존재하지 않은 경우"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "가입되지 않은 사용자"
 *
 * /api/user/{id}/password:
 *   patch:
 *     tags:
 *     - user
 *     summary: "비밀번호 수정 요청"
 *     description: "비밀번호를 수정하기 위한 메일 인증을 요청하기 위한 엔드포인트입니다"
 *     parameters:
 *     - in: "path"
 *       name: "id"
 *       type: string
 *       description: "회원정보를 수정할 사용자의 id값"
 *       required: true
 *     - in: "body"
 *       name: "body"
 *       description: "변경할 사용자의 정보"
 *       required: true
 *       schema:
 *         type: object
 *         properties:
 *           email:
 *             type: string
 *             example: "testadmin1@cau.ac.kr"
 *           password:
 *             type: string
 *             example: "changedpassword1234"
 *
 *     responses:
 *       200:
 *         description: "올바른 요청"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "비밀번호 재설정 성공"
 *       400:
 *         description: "요청 body에 email 또는 password가 포함되지 않음"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "요청 body에 email 또는 password가 포함되지 않음"
 *       404:
 *         description: "해당 id를 가진 사용자가 존재하지 않음"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "해당 id를 가진 사용자가 존재하지 않음"
 */

/**
 * @swagger
 * /api/user/{userid}:
 *   get:
 *     tags:
 *     - user
 *     summary: "회원정보 조회"
 *     description: "회원 정보를 조회하는 api입니다."
 *     parameters:
 *     - in: "path"
 *       name: "userid"
 *       type: string
 *       format: uuid
 *       description: "회원정보를 수정할 사용자의 id"
 *       required: true
 *     responses:
 *       200:
 *         description: "올바른 요청"
 *       404:
 *         description: "요청값을 찾을 수 없는 경우"
 *       500:
 *         description: "사바 에러"
 */

/**
 * @swagger
 * /api/user/duplicate:
 *   get:
 *     tags:
 *     - user
 *     summary: "이메일 중복 검사"
 *     description: "이메일 중복 검사를 합니다."
 *     parameters:
 *     - in: "query"
 *       name: "email"
 *       type: string
 *       description: "이메일 중복 검사를 할 유저의 email"
 *       required: true
 *     responses:
 *        200:
 *          description: "닉네임 중복 검사 성공 / data로 true 혹은 false 반환"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "이미 존재하는 닉네임입니다."
 *              data:
 *                type: boolean
 *                example: false
 *        500:
 *          description: "서버 오류"
 */
