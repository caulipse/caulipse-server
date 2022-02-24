import { getRepository } from 'typeorm';
import UserProfile from '../../../entity/UserProfileEntity';
import { Request, Response } from 'express';
import {
  findUserProfileById,
  postUserProfile,
  updateUserProfile,
} from '../../../services/user/profile';
import { findUserById } from '../../../services/user';

/**
 * @swagger
 *  /api/user/profile/{userid}:
 *    post:
 *      summary: "유저 프로필 생성"
 *      tags:
 *      - "user/profile"
 *      description: "유저 프로필 생성을 위한 엔드포인트"
 *      parameters:
 *      - in: "path"
 *        name: "studyid"
 *        description: "사용자 프로필을 생성할 사용자 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - in: "body"
 *        description: "유저 프로필 객체"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            userId:
 *              type: string
 *              example: "sampleId"
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
 *              example: "남"
 *    get:
 *      tags:
 *      - "user/profile"
 *      summary: "유저 프로필 조회"
 *      paramters:
 *      - in: "path"
 *        name: "studyid"
 *        description: "사용자 프로필을 생성할 사용자 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      description: "유저 프로필 조회를 위한 엔드포인트입니다."
 *    patch:
 *      summary: "유저 프로필 업데이트"
 *      tags:
 *      - "user/profile"
 *      description: "유저 프로필 업데이트를 위한 엔드포인트"
 *      parameters:
 *      - in: "path"
 *        name: "studyid"
 *        description: "사용자 프로필을 생성할 사용자 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - in: "body"
 *        description: "유저 프로필 객체"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            userId:
 *              type: string
 *              example: "sampleId"
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
 *              example: "남"
 */
export const createProfile = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user) {
      throw new Error(NOT_FOUND);
    }

    await postUserProfile({ userId: id, ...req.body });

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

    return res.status(200).json({
      message: '해당 아이디의 유저 프로필 조회 성공',
      userProfile: {
        userId: userProfile[0].userProfile_USER_ID,
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
        ],
      },
    });
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
      ],
    } = req.body;

    const result = await updateUserProfile({
      userId: id,
      userName,
      dept,
      grade,
      bio,
      showDept,
      showGrade,
      onBreak,
      link1: links?.[0],
      link2: links?.[1],
    });

    if (result.affected === 0) throw new Error('유저 프로필 업데이트 실패');
    else return res.json({ message: '회원 프로필 수정 성공' });
  } catch (err) {
    console.error(err);
    res.json({ error: (err as Error).message || (err as Error).toString() });
  }
};

export default {
  createProfile,
  getUserProfileById,
  updateUserProfileById,
};
