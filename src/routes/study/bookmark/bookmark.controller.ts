import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import bookmarkService from '../../../services/study/bookmark';

const registerBookmark = async (req: Request, res: Response) => {
  try {
    const { studyid } = req.params;
    const { id } = req.user as { id: string };

    await bookmarkService.createBookmark(studyid, id);

    return res.status(201).json({
      message: '북마크 생성 성공',
    });
  } catch (e) {
    return res.status(404).json({
      message: (e as Error).message,
    });
  }
};

export default { registerBookmark };

/**
 * @swagger
 * paths:
 *  /study/:studyid/bookmark:
 *    post:
 *      summary: "스터디 북마크 등록"
 *      description: "사용자가 스터디에 북마크를 등록하기 위한 엔드포인트입니다"
 *      tags:
 *      - bookmark
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "북마크를 등록할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      responses:
 *        201:
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "스터디 북마크 생성 성공"
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *        404:
 *          description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "일치하는 studyid가 없음"
 */
