import { Request, Response } from 'express';
import {
  findUserProfileById,
  findUserProfileByUserName,
  postUserProfile,
  updateUserProfile,
} from '../../../services/user/profile';
import { findUserById } from '../../../services/user';

/**
 * @swagger
 *  /api/user/profile/{userId}:
 *    post:
 *      tags:
 *      - "user/profile"
 *      summary: "유저 프로필 생성"
 *      description: "유저 프로필 생성을 위한 엔드포인트"
 *      parameters:
 *      - in: "path"
 *        name: "userId"
 *        description: "사용자 프로필을 생성할 사용자 id"
 *        required: true
 *        type: string
 *        format: uuid
 *        example: "05293d46-3a40-4942-acb3-22fa055065bc"
 *      - in: "body"
 *        name: "body"
 *        description: "유저 프로필 객체"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            userName:
 *              type: string
 *              example: "홍길동"
 *            dept:
 *              type: string
 *              example: "경영학과"
 *            grade:
 *              type: number
 *              example: 3
 *            bio:
 *              type: string
 *              example: "짧은 소개글입니다"
 *            userAbout:
 *              type: string
 *              example: "긴 소개글입니다"
 *            showGrade:
 *              type: boolean
 *              example: true
 *            showDept:
 *              type: boolean
 *              example: true
 *            onBreak:
 *              type: boolean
 *              example: true
 *            categories:
 *              type: array
 *              items:
 *                type: string
 *              example: ["101", "102"]
 *            link1:
 *              type: string
 *              example: "www.naver.com"
 *            link2:
 *              type: string
 *              example: "www.daum.net"
 *            link3:
 *              type: string
 *              example: "www.google.com"
 *            image:
 *              type: string
 *              example: "alien.png"
 *      responses:
 *        201:
 *          description: "유저 프로필 생성 성공"
 *          schema:
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *    get:
 *      tags:
 *      - "user/profile"
 *      summary: "유저 프로필 조회"
 *      parameters:
 *      - in: "path"
 *        name: "userId"
 *        description: "사용자 프로필을 조회할 사용자 id"
 *        required: true
 *        type: string
 *        format: uuid
 *        example: "05293d46-3a40-4942-acb3-22fa055065bc"
 *      description: "유저 프로필 조회를 위한 엔드포인트입니다."
 *      responses:
 *        200:
 *          description: "유저 프로필 생성 성공"
 *          schema:
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *    patch:
 *      summary: "유저 프로필 업데이트"
 *      tags:
 *      - "user/profile"
 *      description: "유저 프로필 업데이트를 위한 엔드포인트"
 *      parameters:
 *      - in: "path"
 *        name: "userId"
 *        description: "사용자 프로필을 업데이트할 사용자 id"
 *        required: true
 *        type: string
 *        format: uuid
 *        example: "05293d46-3a40-4942-acb3-22fa055065bc"
 *      - in: "body"
 *        name: "body"
 *        description: "유저 프로필 객체"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            userName:
 *              type: string
 *              example: "홍길동"
 *            dept:
 *              type: string
 *              example: "경영학과"
 *            grade:
 *              type: number
 *              example: 3
 *            bio:
 *              type: string
 *              example: "짧은 소개글입니다"
 *            userAbout:
 *              type: string
 *              example: "긴 소개글입니다"
 *            showGrade:
 *              type: boolean
 *              example: true
 *            showDept:
 *              type: boolean
 *              example: true
 *            onBreak:
 *              type: boolean
 *              example: true
 *            categories:
 *              type: array
 *              items:
 *                type: string
 *              example: ["101", "102"]
 *            link1:
 *              type: string
 *              example: "www.naver.com"
 *            link2:
 *              type: string
 *              example: "www.daum.net"
 *            link3:
 *              type: string
 *              example: "www.google.com"
 *            image:
 *              type: string
 *              example: "alien.png"
 *      responses:
 *        201:
 *          description: "유저 프로필 생성 성공"
 *          schema:
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 * /api/user/profile/duplicate:
 *  get:
 *    tags:
 *    - user/profile
 *    summary: "닉네임 중복 검사"
 *    description: "닉네임 중복 검사를 합니다."
 *    parameters:
 *    - name: "username"
 *      in: "query"
 *      description: "유저 닉네임"
 *      required: true
 *      type: string
 *      example: "user1"
 *    responses:
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
export const createProfile = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user) {
      throw new Error(NOT_FOUND);
    }

    await postUserProfile({
      userId: id,
      email: user.email,
      ...req.body,
    });

    res.status(201).json({ message: 'Created. 유저가 생성되었습니다.' });
  } catch (err) {
    console.error(err);
    res.json({ error: (err as Error).message || (err as Error).toString() });
  }
};

export const getUserProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userProfile = await findUserProfileById(id);

    res.status(200).json({
      message: '해당 아이디의 유저 프로필 조회 성공',
      userProfile: {
        userId: userProfile[0].userProfile_USER_ID,
        email: userProfile[0].userProfile_EMAIL,
        userName: userProfile[0].userProfile_USER_NAME,
        dept: userProfile[0].userProfile_DEPT,
        grade: userProfile[0].userProfile_GRADE,
        bio: userProfile[0].userProfile_BIO,
        showDept: Boolean(userProfile[0].userProfile_SHOW_DEPT),
        showGrade: Boolean(userProfile[0].userProfile_SHOW_GRADE),
        onBreak: Boolean(userProfile[0].userProfile_ON_BREAK),
        links: [
          userProfile[0].userProfile_LINK1,
          userProfile[0].userProfile_LINK2,
          userProfile[0].userProfile_LINK3,
        ],
        categories:
          userProfile[0].userProfile_USER_INTEREST_CATEGORY.split(','),
        userAbout: userProfile[0].userProfile_USER_ABOUT,
        image: userProfile[0].userProfile_IMAGE,
      },
    });
    return;
  } catch (err) {
    console.error(err);
    res.json({ error: (err as Error).message || (err as Error).toString() });
  }
};

export const updateUserProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userProfile = await findUserProfileById(id);

    const {
      userName = userProfile[0].userProfile_USER_NAME,
      dept = userProfile[0].userProfile_DEPT,
      grade = userProfile[0].userProfile_GRADE,
      bio = userProfile[0].userProfile_BIO,
      showDept = Boolean(userProfile[0].userProfile_SHOW_DEPT),
      showGrade = Boolean(userProfile[0].userProfile_SHOW_GRADE),
      onBreak = Boolean(userProfile[0].userProfile_ON_BREAK),
      links = [
        userProfile[0].userProfile_LINK1,
        userProfile[0].userProfile_LINK2,
        userProfile[0].userProfile_LINK3,
      ],
      categories = userProfile[0].userProfile_USER_INTEREST_CATEGORY,
      userAbout = userProfile[0].userProfile_USER_ABOUT,
      image = userProfile[0].userProfile_IMAGE,
    } = req.body;

    const result = await updateUserProfile({
      userId: id,
      email: userProfile[0].userProfile_EMAIL,
      userName,
      dept,
      grade,
      bio,
      showDept,
      showGrade,
      onBreak,
      link1: links?.[0],
      link2: links?.[1],
      link3: links?.[2],
      categories,
      userAbout,
      image,
    });

    if (result.affected === 0) throw new Error('유저 프로필 업데이트 실패');
    else res.status(201).json({ message: '회원 프로필 수정 성공' });
    return;
  } catch (err) {
    console.error(err);
    res.json({ error: (err as Error).message || (err as Error).toString() });
  }
};

const getUserNameDuplicate = async (req: Request, res: Response) => {
  try {
    const username = req.query.username as string;
    const result = await findUserProfileByUserName(username);
    if (result?.length) {
      res
        .status(200)
        .json({ message: '이미 존재하는 닉네임입니다.', data: false });
      return;
    } else {
      res
        .status(200)
        .json({ message: '사용 가능한 닉네임입니다.', data: true });
      return;
    }
  } catch (err) {
    console.error(err);
    res.json({ error: (err as Error).message || (err as Error).toString() });
  }
};

export default {
  createProfile,
  getUserProfileById,
  updateUserProfileById,
  getUserNameDuplicate,
};
