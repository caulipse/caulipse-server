import { Request, Response } from 'express';
import bookmarkService from '../../../services/study/bookmark';
import studyService from '../../../services/study';
import { temp_findUserProfileById } from '../../../services/user/profile';

const registerBookmark = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const userId = (req.user as { id: string }).id;
    const user = await temp_findUserProfileById(userId);
    if (!user) {
      throw new Error(NOT_FOUND);
    }
    const bookmarks = await bookmarkService.findBookmarksByStudyId(studyid);
    if (bookmarks?.length === 0) {
      throw new Error(NOT_FOUND);
    }

    await bookmarkService.registerBookmark(bookmarks, user);
    res.status(201).json({ message: '북마크 생성 성공' });
    return;
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      res.status(404).json({
        message: NOT_FOUND,
      });
      return;
    } else {
      res.status(500).json({
        message: (e as Error).message,
      });
      return;
    }
  }
};

const deleteBookmark = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const userId = (req.user as { id: string }).id;
    const study = await studyService.findStudyById(studyid);
    const user = await temp_findUserProfileById(userId);

    if (!study || !user) {
      throw new Error(NOT_FOUND);
    }
    await bookmarkService.deleteBookmark(study, user);
    res.status(200).json({ message: '북마크 취소 성공' });
    return;
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      res.status(404).json({
        message: NOT_FOUND,
      });
      return;
    } else {
      res.status(500).json({
        message: (e as Error).message,
      });
      return;
    }
  }
};

export default { registerBookmark, deleteBookmark };

/**
 * @swagger
 * paths:
 *  /api/study/{studyid}/bookmark:
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
 *
 *    delete:
 *      summary: "스터디 북마크 취소"
 *      description: "사용자가 동록해 놓은 스터디 북마크를 취소하기 위한 엔드포인트입니다"
 *      tags:
 *      - bookmark
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "북마크를 취소할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      responses:
 *        200:
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "스터디 북마크 취소 성공"
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
