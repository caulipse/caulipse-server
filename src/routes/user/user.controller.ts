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
  findUserByToken,
  updateTokenById,
} from '../../services/user';
import { sendMail } from '../../services/mail';
import { makeSignUpToken } from '../../utils/auth';
import { validateCAU } from '../../utils/mail';
import { findAllIfParticipatedByUserId } from '../../services/studyUser';
import { signupMailContent } from '../../utils/mail/html';

export default {
  async saveUser(req: Request, res: Response) {
    try {
      const id = randomUUID();
      const { email, password } = req.body;
      if (!email || !password)
        throw new Error('no email or password in request body');
      const isValidEmail = validateCAU(email);
      if (!isValidEmail)
        throw new Error('중앙대 이메일로만 가입할 수 있습니다');

      const token = makeSignUpToken(id);
      // TODO: await의 나열보다 Promise.all 의 사용이 성능적인 이점이 있을까?
      await saveUser({ id, email, password, token });
      const message = await sendMail(email, signupMailContent(id, token));

      res.status(201).json({ message, id });
    } catch (e) {
      res
        .status(400)
        .json({ message: '회원가입 실패: ' + (e as Error).message });
    }
  },
  async updatePassword(req: Request, res: Response) {
    const OK = '비밀번호 재설정 요청 성공';
    const BAD_REQUEST = '요청 body에 portalId가 포함되지 않음';
    const NOT_FOUND = '가입되지 않은 사용자';

    try {
      const { portalId } = req.body;
      if (!portalId) throw new Error(BAD_REQUEST);

      const email = `${portalId}@cau.ac.kr`;
      const user = await findUserByEmail(email);
      if (!user) throw new Error(NOT_FOUND);

      if (process.env.NODE_ENV !== 'test') {
        sendMail(`${portalId}@cau.ac.kr`, user.id, user.token);
      }

      const newToken = makeSignUpToken(user.id);
      await updateTokenById(user.id, newToken);
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
    const FORBIDDEN = '토큰 검증 실패';
    const NOT_FOUND = '해당 토큰을 가진 사용자가 존재하지 않음';

    try {
      const { email, password: newPassword } = req.body;
      if (!email || !newPassword) throw new Error(BAD_REQUEST);

      const { token } = req.params;
      const user = await findUserByToken(token);
      if (!user) throw new Error(NOT_FOUND);

      const decoded = jwt.verify(
        token,
        process.env.SIGNUP_TOKEN_SECRET as string
      ) as { id: string };
      if (user.id !== decoded.id) throw new Error(FORBIDDEN);

      await updatePasswordById(user.id, newPassword);
      res.json({ message: OK });
    } catch (e) {
      const err = e as Error;
      if (err.message === BAD_REQUEST) {
        res.status(400).json({ message: BAD_REQUEST });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: NOT_FOUND });
      } else {
        res.status(403).json({ message: FORBIDDEN });
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
      const result = await deleteUserById(id);
      if (result.affected === 0) throw new Error(NOT_FOUND);
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
      }));
      res.json(response);
    } catch (e) {
      res.status(500).json({ message: '내가 신청한 스터디 목록 조회 실패' });
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
 *           portalId:
 *             type: string
 *             example: "testadmin1"
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
 *         description: "요청 body에 portalId가 포함되지 않음"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "요청 body에 portalId가 포함되지 않음"
 *       404:
 *         description: "사용자의 portalId에 연결된 중앙대이메일이 데이터베이스에 존재하지 않은 경우"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "가입되지 않은 사용자"
 *
 * /api/user/{token}/password:
 *   patch:
 *     tags:
 *     - user
 *     summary: "비밀번호 수정 요청"
 *     description: "비밀번호를 수정하기 위한 메일 인증을 요청하기 위한 엔드포인트입니다"
 *     parameters:
 *     - in: "path"
 *       name: "token"
 *       type: string
 *       description: "회원정보를 수정할 사용자에게 발급된 토큰"
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
 *       403:
 *         description: "토큰 관련 에러 발생"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "토큰 검증 실패"
 *       404:
 *         description: "해당 토큰을 가진 사용자가 존재하지 않음"
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "해당 토큰을 가진 사용자가 존재하지 않음"
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
