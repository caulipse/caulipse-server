import { Request, Response } from 'express';
import studyService from '../../../../services/study';
import metooService from '../../../../services/comment/metoo';
import commentService from '../../../../services/comment';
import { temp_findUserProfileById } from '../../../../services/user/profile';

const registerMetoo = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid, commentid } = req.params;
    const userId = (req.user as { id: string }).id;
    const study = await studyService.findStudyById(studyid);
    const user = await temp_findUserProfileById(userId);

    if (!study || !user) {
      throw new Error(NOT_FOUND);
    }
    const metoo = await metooService.findMetooByCommentId(commentid);
    if (metoo.length === 0) {
      throw new Error(NOT_FOUND);
    }

    await metooService.registerMetoo(metoo, user);
    res.status(201).json({ message: '나도 궁금해요 생성 성공' });
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

const deleteMetoo = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid, commentid } = req.params;
    const userId = (req.user as { id: string }).id;
    const study = await studyService.findStudyById(studyid);
    const comment = await commentService.findCommentById(commentid);
    const user = await temp_findUserProfileById(userId);

    if (!study || !comment || !user) {
      throw new Error(NOT_FOUND);
    }
    await metooService.deleteMetoo(comment, user);

    res.status(200).json({ message: '나도 궁금해요 해제 성공' });
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

export default { registerMetoo, deleteMetoo };

/**
 * @swagger
 * paths:
 *  /api/study/{studyid}/comment/{commentid}/metoo:
 *    post:
 *      summary: "스터디 문의글에 나도 궁금해요 등록"
 *      description: "해당 문의글에 나도 궁금해요를 등록하기 위한 엔드포인트입니다"
 *      tags:
 *      - study/comment/metoo
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글이 등록되어 있는 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - name: "commentid"
 *        in: "path"
 *        description: "나도 궁금해요를 등록할 문의글의 id"
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
 *                example: "나도 궁금해요 생성 성공"
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *        404:
 *          description: "전달한 studyid 또는 commentid가 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "일치하는 studyid 또는 commentid가 없음"
 *
 *    delete:
 *      summary: "나도 궁금해요 해제"
 *      description: "스터디 문의글에 등록되어 있던 나도 궁금해요를 해제하기 위한 엔드포인트입니다"
 *      tags:
 *      - study/comment/metoo
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글이 등록되어 있는 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - name: "commentid"
 *        in: "path"
 *        description: "나도 궁금해요를 해제할 문의글의 id"
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
 *                example: "나도 궁금해요 해제 성공"
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *        404:
 *          description: "전달한 studyid 또는 commentid가 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "일치하는 studyid 또는 commentid가 없음"
 */
