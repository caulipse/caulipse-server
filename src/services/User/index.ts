import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import User, { UserRoleEnum } from '../../entity/UserEntity';
import { makeSignUpToken } from '../../utils/auth';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /user:
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
 *                example: "회원가입 성공"
 *        "400":
 *          description: "요청 body에 이메일 또는 비밀번호 값이 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "회원가입 실패: no email or password in request body"
 */
export const saveUser = async (req: Request, res: Response) => {
  try {
    const id = randomUUID();
    const { email, password } = req.body;
    if (!email || !password)
      throw new Error('no email or password in request body');
    await getRepository(User)
      .createQueryBuilder()
      .insert()
      .values({
        id,
        email,
        password: bcrypt.hashSync(password, 10),
        isLogout: false,
        role: UserRoleEnum.GUEST,
        token: makeSignUpToken(id),
      })
      .execute();
    // TODO: 이메일 전송 로직 추가
    res.status(201).json({ message: '회원가입 성공', id });
  } catch (e) {
    res.status(400).json({ message: '회원가입 실패: ' + (e as Error).message });
  }
};

/**
 * @swagger
 * /user/:userid/role:
 *  patch:
 *    tags:
 *    - user
 *    summary: 사용자 권한 수정(회원가입 절차 마무리)
 *    description: 회원가입을 요청한 사용자가 이메일에서 링크를 클릭해 학교메일을 인증할 시 사용될 api
 *    parameters:
 *    - in: path
 *      name: userid
 *      description: 회원가입하는 사용자의 id
 *      required: true
 *      example: 15f6d6ee-32e2-4036-b050-fa79e38dcd36
 *    - in: body
 *      name: body
 *      schema:
 *        type: object
 *        properties:
 *          token:
 *            type: string
 *            example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUxYjg0M2I5LWE5ZTEtNDk3Mi05NWNiLWVmYTcxYzY2ODI5NSIsImlhdCI6MTY0MDYzMDg2MiwiZXhwIjoxNjQwNzE3MjYyfQ.zLJtNN-VCuYlghtE2v0yDJbz7YuxedGHKLt6CW7tUnA
 *            description: 사용자를 인증할 jwt토큰, email의 링크에 쿼리스트링으로 보내줄 예정
 *      responses:
 *        "200":
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "사용자 권한 수정 성공"
 *        "400":
 *          description: "아래 두 에러가 아닌 다른 이유의 에러입니다. 코드 실행중 에러가 발생한 상황입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "회원가입 실패: request is not valid"
 *        "403":
 *          description: "전달한 토큰값에 저장된 사용자 id와 url 경로상의 id가 일치하지 않거나, 토큰이 만료된 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example:
 *                - "회원가입 실패: id 변조됨"
 *                - "회원가입 실패 :토큰 만료됨"
 *        "404":
 *          description: "전달된 userid값이 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "회원가입 실패: no user with given id found"
 */
export const changeUserRole = async (req: Request, res: Response) => {
  const BAD_REQUEST = 'request is not valid';
  const UNAUTHORIZED = 'id not valid';
  const NOT_FOUND = 'no user with given id found';
  const OK = '사용자 권한 수정 성공';

  try {
    if (!req.user || !(req.user as { id: string }).id)
      throw new Error(UNAUTHORIZED);

    const { id } = req.user as { id: string };
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.SIGNUP_TOKEN_SECRET!) as {
      id: string;
      exp: number;
    };
    if (decoded.id !== id) throw new Error(UNAUTHORIZED);

    const result = await getRepository(User)
      .createQueryBuilder()
      .update()
      .set({
        role: UserRoleEnum.USER,
      })
      .where('id = :id', { id })
      .andWhere(`role = 'GUEST'`)
      .execute();
    if (!result.affected) throw new Error(NOT_FOUND);
    res.json({
      message: OK,
      id,
    });
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      res
        .status(404)
        .json({ message: '회원가입 실패: ' + (e as Error).message });
    } else if ((e as Error).message === UNAUTHORIZED) {
      res.status(403).json({ message: '회원가입 실패: ' + 'id 변조됨' });
    } else if ((e as Error).message.includes('expire')) {
      res.status(403).json({ message: '회원가입 실패: ' + '토큰 만료됨' });
    } else {
      res.status(400).json({ message: '회원가입 실패: ' + BAD_REQUEST });
    }
  }
};

/**
 *  @swagger
 *  /user/login:
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
export const login = async (req: Request, res: Response) => {
  const BAD_REQUEST = '이메일/비밀번호 정보 없음';
  const UNAUTHORIZED = '비밀번호 불일치';
  const NOT_FOUND = '일치하는 이메일 없음';

  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error(BAD_REQUEST);

    const user = await getRepository(User)
      .createQueryBuilder()
      .select()
      .where('email = :email', { email })
      .getOne();
    if (!user) throw new Error(NOT_FOUND);

    const isUser = bcrypt.compareSync(password, user?.password);
    if (!isUser) throw new Error(UNAUTHORIZED);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SIGNUP_TOKEN_SECRET!,
      {
        algorithm: 'HS256',
        expiresIn: '3h',
      }
    );
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SIGNUP_TOKEN_SECRET!,
      {
        algorithm: 'HS256',
        expiresIn: '14d',
      }
    );

    const hour = 3600 * 1000;
    const day = 24 * hour;
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 3 * hour),
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      expires: new Date(Date.now() + 14 * day),
    });

    res.json({ message: '로그인 성공' });
  } catch (e) {
    const err = e as Error;
    if (err.message === UNAUTHORIZED) {
      res.status(403).json({ message: '로그인 싪패: ' + UNAUTHORIZED });
    } else if (err.message === NOT_FOUND) {
      res.status(404).json({ message: '로그인 싪패: ' + NOT_FOUND });
    }
    res.status(400).json({ message: err.message });
  }
};