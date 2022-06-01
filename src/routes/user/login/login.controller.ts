import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRoleEnum } from '../../../entity/UserEntity';
import { findUserByEmail, loginUserById } from '../../../services/user';

export default {
  async login(req: Request, res: Response) {
    const BAD_REQUEST = '이메일/비밀번호 정보 없음';
    const UNAUTHORIZED = '비밀번호 불일치';
    const NOT_FOUND = '일치하는 이메일 없음';

    try {
      const { email, password } = req.body;
      if (!email || !password) throw new Error(BAD_REQUEST);

      const user = await findUserByEmail(email);
      if (!user) throw new Error(NOT_FOUND);

      const isGuest = user.role === UserRoleEnum.GUEST;
      const isUser = bcrypt.compareSync(password, user?.password);
      if (isGuest || !isUser) throw new Error(UNAUTHORIZED);
      await loginUserById(user.id);

      const accessToken = jwt.sign(
        { id: user.id },
        process.env.SIGNUP_TOKEN_SECRET as string,
        {
          algorithm: 'HS256',
          expiresIn: '3h',
        }
      );
      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.SIGNUP_TOKEN_SECRET as string,
        {
          algorithm: 'HS256',
          expiresIn: '14d',
        }
      );

      const HOUR = 3600 * 1000;
      const DAY = 24 * HOUR;
      res.cookie('accessToken', accessToken, {
        expires: new Date(Date.now() + 3 * HOUR),
        domain: 'cau.rudy3091.com',
        sameSite: 'none',
        secure: true,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        expires: new Date(Date.now() + 14 * DAY),
        domain: 'cau.rudy3091.com',
        sameSite: 'none',
        secure: true,
      });

      res.json({ message: '로그인 성공', userId: user.id });
    } catch (e) {
      const err = e as Error;
      if (err.message === UNAUTHORIZED) {
        res.status(403).json({ message: '로그인 싪패: ' + UNAUTHORIZED });
      } else if (err.message === NOT_FOUND) {
        res.status(404).json({ message: '로그인 싪패: ' + NOT_FOUND });
      } else {
        res.status(500).json({ message: 'error ' });
      }
    }
  },
};

/**
 *  @swagger
 *  /api/user/login:
 *    post:
 *      tags:
 *      - user
 *      summary: "로그인"
 *      description: "로그인하기 위한 엔드포인트입니다. 로그인 성공시 사용자의 쿠키에 액세스토큰, 리프레시 토큰을 발급합니다"
 *      parameters:
 *      - in: "body"
 *        name: "body"
 *        description: "사용자 로그인 정보"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            email:
 *              type: string
 *              example: "test@example.com"
 *            password:
 *              type: string
 *              example: "examplepassword"
 *      responses:
 *        "200":
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 성공"
 *        "403":
 *          description: "전달한 비밀번호와 데이터베이스에 저장된 비밀번호가 일치하지 않습니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 실패: 비밀번호 불일치"
 *        "404":
 *          description: "전달한 이메일이 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 실패: 일치하는 이메일 없음"
 */
