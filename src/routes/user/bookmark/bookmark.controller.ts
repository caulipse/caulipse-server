import { Request, Response } from 'express';
import bookmarkService from '../../../services/study/bookmark';

export const getBookmarksByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.user as { id: string };

    const bookmarks = await bookmarkService.getBookmarksByUser(id);

    res.status(200).json(bookmarks);
    return;
  } catch (e) {
    res.status(500).json({
      message: (e as Error).message,
    });
    return;
  }
};

/**
 * @swagger
 * paths:
 *  /api/user/bookmark:
 *    get:
 *      summary: "사용자의 북마크 목록 조회"
 *      description: "마이페이지에서 사용자가 등록해놓은 스터디 북마크의 목록을 조회하기 위한 엔드포인트입니다"
 *      tags:
 *      - bookmark
 *      responses:
 *        200:
 *          description: "올바른 요청. message와 함께 북마크한 스터디 목록을 반환합니다"
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
 */
