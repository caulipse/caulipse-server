import { Request, Response } from 'express';
import commentService from '../../../services/comment';
import { createStudyNoti, NotiTypeEnum } from '../../../services/notification';
import studyService from '../../../services/study';
import { temp_findUserProfileById } from '../../../services/user/profile';
import metooService from '../../../services/comment/metoo';
import Comment from '../../../entity/CommentEntity';

const getAllCommentWithLogIn = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const study = await studyService.findStudyById(studyid);
    const comments = await commentService.getAllByStudy(studyid);
    if (!study || !comments) throw new Error(NOT_FOUND);

    const userId = (req.user as { id: string }).id;
    const result: Array<Comment & { metoo: boolean }> = [];

    for (const comment of comments) {
      if (await metooService.checkMetoo(userId, comment.id)) {
        result.push({
          ...comment,
          metoo: true,
        });
      } else {
        result.push({
          ...comment,
          metoo: false,
        });
      }
    }

    return res.status(200).json(result);
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: (e as Error).message });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const getAllComment = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const study = await studyService.findStudyById(studyid);
    const comments = await commentService.getAllByStudy(studyid);

    if (!study || !comments) throw new Error(NOT_FOUND);

    const result: Array<Comment & { metoo: boolean }> = [];
    comments.forEach((comment) => {
      result.push({
        ...comment,
        metoo: false,
      });
    });

    return res.status(200).json(result);
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: (e as Error).message });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const createComment = async (req: Request, res: Response) => {
  const BAD_REQUEST = '요청값이 유효하지 않음';
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const { content, replyTo } = req.body;
    const userId = (req.user as { id: string }).id;

    if (!content) throw new Error(BAD_REQUEST);

    const study = await studyService.findStudyById(studyid);
    const user = await temp_findUserProfileById(userId);
    let reply = null;

    if (!study || !user) {
      throw new Error(NOT_FOUND);
    }
    if (replyTo) {
      reply = await commentService.findCommentById(replyTo);
      if (!reply) {
        throw new Error(NOT_FOUND);
      }
    }
    const id = await commentService.createComment(content, study, user, reply);

    if (process.env.NODE_ENV !== 'test') {
      if (reply && reply.USER_ID) {
        await createStudyNoti({
          id: studyid,
          userId: reply.USER_ID,
          title: '답글',
          about: '작성하신 문의글에 답글이 달렸어요.',
          type: NotiTypeEnum.NEW_REPLY,
        });
        await createStudyNoti({
          id: studyid,
          userId: study.HOST_ID,
          title: '답글',
          about: '작성하신 문의글에 답글이 달렸어요.',
          type: NotiTypeEnum.NEW_REPLY,
        });
      } else {
        await createStudyNoti({
          id: studyid,
          userId: study.HOST_ID,
          title: '새로운 문의글',
          about: '새 문의글이 달렸어요.',
          type: NotiTypeEnum.NEW_COMMENT,
        });
      }
    }

    return res.status(201).json({ id });
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({
        message: BAD_REQUEST,
      });
    } else if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({
        message: NOT_FOUND,
      });
    } else {
      return res.status(500).json({
        message: (e as Error).message,
      });
    }
  }
};

const updateComment = async (req: Request, res: Response) => {
  const BAD_REQUEST = '요청값이 유효하지 않음';
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { commentid } = req.params;
    const { content } = req.body;

    if (!content) throw new Error(BAD_REQUEST);

    const comment = await commentService.findCommentById(commentid);

    if (!comment) {
      throw new Error(NOT_FOUND);
    }
    await commentService.updateComment(content, comment);
    return res.status(200).json({ message: '문의글 수정 성공' });
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({
        message: BAD_REQUEST,
      });
    } else if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({
        message: NOT_FOUND,
      });
    } else {
      return res.status(500).json({
        message: (e as Error).message,
      });
    }
  }
};

const deleteComment = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { commentid } = req.params;

    const comment = await commentService.findCommentById(commentid);
    if (!comment) throw new Error(NOT_FOUND);

    const reply = await commentService.checkReply(comment.id);
    const result = await commentService.deleteComment(comment, reply);

    if (!comment.isNested) {
      if (reply == 0) {
        return res.status(200).json({
          ...result,
          updateRequired: false,
          message: '문의글 삭제 성공',
        });
      } else if (reply >= 1) {
        return res.status(200).json({
          ...result,
          updateRequired: true,
          message: '문의글 삭제 성공',
        });
      }
    } else {
      return res.status(200).json({
        ...result,
        updateRequired: false,
        message: '댓글 삭제 성공',
      });
    }
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: NOT_FOUND });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

export default {
  getAllCommentWithLogIn,
  getAllComment,
  createComment,
  updateComment,
  deleteComment,
};

/**
 * @swagger
 * paths:
 *  /api/study/{studyid}/comment:
 *    get:
 *      summary: "스터디 문의글 목록 조회"
 *      description: "해당 스터디의 문의글 목록을 조회하기 위한 엔드포인트입니다"
 *      tags:
 *      - study/comment
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글 목록을 조회할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      responses:
 *        200:
 *          description: "문의글 목록 조회 성공. message와 함께 문의글 목록({문의글, 스터디, 유저})을 반환함"
 *          schema:
 *            type: array
 *            items:
 *              allOf:
 *                - $ref: "#/definitions/Comment"
 *                - type: object
 *                  properties:
 *                    metoo:
 *                      type: boolean
 *                      description: "유저가 각 문의글에 대하여 나도 궁금해요를 등록한 상태인지 아닌지에 대한 여부 (로그인 상태가 아니므로 전부 false를 반환함)"
 *        404:
 *          description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "일치하는 studyid가 없음"
 *
 *  /api/study/{studyid}/comment/login:
 *    get:
 *      summary: "로그인 상태에서의 문의글 목록 조회"
 *      description: "로그인 상태일 때, 문의글 목록과 함께 나도 궁금해요 등록 여부를 함께 응답하는 엔드포인트입니다."
 *      tags:
 *      - study/comment
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글 목록을 조회할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      responses:
 *        200:
 *          description: "문의글 목록 조회 성공"
 *          schema:
 *            type: array
 *            items:
 *              allOf:
 *                - $ref: "#/definitions/Comment"
 *                - type: object
 *                  properties:
 *                    metoo:
 *                      type: boolean
 *                      description: "유저가 각 문의글에 대하여 나도 궁금해요를 등록한 상태인지 아닌지에 대한 여부"
 *        403:
 *          description: "접근 권한이 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "접근 권한이 없습니다"
 *        404:
 *          description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "일치하는 studyid가 없음"
 *
 *    post:
 *      summary: "스터디 문의글 등록"
 *      description: "해당 스터디에 새로운 문의글을 등록하기 위한 엔드포인트입니다"
 *      tags:
 *      - study/comment
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글을 등록할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - name: "comment_body"
 *        in: "body"
 *        description: "새롭게 등록할 문의글 정보를 포함한 객체"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            content:
 *              type: string
 *              description: "문의글의 내용"
 *            replyTo:
 *              type: string
 *              format: uuid
 *              description: "대댓글인 경우 해당 대댓글을 단 문의글(댓글, 첫번째 depth)의 id"
 *      responses:
 *        201:
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                format: uuid
 *                description: "생성된 문의글의 id"
 *        400:
 *          description: "요청값이 유효하지 않은 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "request is not valid"
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
 *  /api/study/{studyid}/comment/{commentid}:
 *    patch:
 *      summary: "스터디 문의글 수정"
 *      description: "해당 스터디의 해당 문의글을 수정하기 위한 엔드포인트입니다"
 *      tags:
 *      - study/comment
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글을 수정할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - name: "commentid"
 *        in: "path"
 *        description: "수정할 문의글 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - name: "comment_body"
 *        in: "body"
 *        description: "수정할 문의글 정보를 포함한 객체"
 *        required: true
 *        schema:
 *          type: object
 *          properties:
 *            content:
 *              type: string
 *              description: "수정할 문의글의 내용"
 *      responses:
 *        200:
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "문의글 수정 성공"
 *        400:
 *          description: "요청값이 유효하지 않은 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "request is not valid"
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
 *      summary: "스터디 문의글 삭제"
 *      description: "해당 스터디의 해당 문의글을 삭제하기 위한 엔드포인트입니다"
 *      tags:
 *      - study/comment
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "문의글을 삭제할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - name: "commentid"
 *        in: "path"
 *        description: "삭제할 문의글 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      responses:
 *        200:
 *          description: "올바른 요청 (대댓글이 남아있는 댓글을 제외한 나머지는 바로 삭제 처리)"
 *          schema:
 *            allOf:
 *            - $ref: "#/definitions/Comment"
 *            - type: object
 *              properties:
 *                updateRequired:
 *                  type: boolean
 *                  description: 대댓글이 남아있는 댓글의 경우(true) content 수정 및 사용자 수정(null)에 따른 변경 필요
 *                message:
 *                  type: string
 *                  example: "문의글 삭제 성공"
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
