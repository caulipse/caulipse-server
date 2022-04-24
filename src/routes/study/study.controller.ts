import { Request, Response } from 'express';
import {
  FrequencyEnum,
  LocationEnum,
  WeekDayEnum,
} from '../../entity/StudyEntity';
import { createStudyNoti } from '../../services/notification';
import studyService from '../../services/study';
import { findAllByStudyId } from '../../services/studyUser';
import { findUserById } from '../../services/user';
import { orderByEnum } from '../../types/study.dto';

const getAllStudy = async (req: Request, res: Response) => {
  const BAD_REQUEST = '요청값이 유효하지 않음';

  const categoryCode = parseInt(req.query.categoryCode as string);
  const weekdayFilter = req.query.weekday
    ? (req.query.weekday as string).split(',')
    : null;
  const frequencyFilter = req.query.frequency as string;
  const locationFilter = req.query.location
    ? (req.query.location as string).split(',')
    : null;
  const hideCloseTag = parseInt(req.query.hideCloseTag as string) || 0; // 0: off, 1: on
  const orderBy = (req.query.order_by as string) || orderByEnum.LATEST;
  // offset
  const pageNo = Number(req.query.pageNo) || 1;
  const limit = Number(req.query.limit) || 12;

  try {
    if (weekdayFilter && !weekdayFilter.length) {
      weekdayFilter.forEach((weekday) => {
        if (!(Object.values(WeekDayEnum) as string[]).includes(weekday))
          throw new Error(BAD_REQUEST);
      });
    }
    if (frequencyFilter) {
      if (!(Object.values(FrequencyEnum) as string[]).includes(frequencyFilter))
        throw new Error(BAD_REQUEST);
    }
    if (locationFilter && !locationFilter.length) {
      locationFilter.forEach((location) => {
        if (!(Object.values(LocationEnum) as string[]).includes(location))
          throw new Error(BAD_REQUEST);
      });
    }
    if (!(Object.values(orderByEnum) as string[]).includes(orderBy))
      throw new Error(BAD_REQUEST);
    const studies = await studyService.getAllStudy({
      categoryCode,
      weekdayFilter,
      frequencyFilter,
      locationFilter,
      hideCloseTag,
      orderBy,
      pageNo,
      limit,
    });
    const total = await studyService.countAllStudy({
      categoryCode,
      weekdayFilter,
      frequencyFilter,
      locationFilter,
      hideCloseTag,
      orderBy,
      pageNo,
      limit,
    });
    const lastpage = total % limit;
    const pages =
      lastpage === 0 ? total / limit : Math.trunc(total / limit) + 1;

    if (studies.length === 0) {
      return res
        .status(200)
        .json({ message: '요청에 해당하는 스터디가 존재하지 않습니다' });
    } else {
      return res.status(200).json({
        studies,
        pageNo,
        pages,
        total,
      });
    }
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({ message: BAD_REQUEST });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const createStudy = async (req: Request, res: Response) => {
  const BAD_REQUEST = '요청값이 유효하지 않음';
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const userId = (req.user as { id: string }).id;
    if (!Object.keys(req.body).length) throw new Error(BAD_REQUEST);
    const allowedFields = [
      'title',
      'studyAbout',
      'weekday',
      'frequency',
      'location',
      'capacity',
      'categoryCode',
      'dueDate',
    ];
    const keys = Object.keys(req.body);
    if (
      keys.some((key) => !allowedFields.includes(key)) ||
      keys.length < allowedFields.length
    )
      throw new Error(BAD_REQUEST);
    if (!req.body.weekday.length || !req.body.location.length)
      throw new Error(BAD_REQUEST);
    req.body.weekday.forEach((value: string) => {
      if (!(Object.values(WeekDayEnum) as string[]).includes(value))
        throw new Error(BAD_REQUEST);
    });
    if (
      !(Object.values(FrequencyEnum) as string[]).includes(req.body.frequency)
    )
      throw new Error(BAD_REQUEST);
    req.body.location.forEach((value: string) => {
      if (!(Object.values(LocationEnum) as string[]).includes(value))
        throw new Error(BAD_REQUEST);
    });

    const user = await findUserById(userId);
    if (!user) {
      throw new Error(NOT_FOUND);
    }
    const id = await studyService.createStudy(req.body, user);

    return res.status(201).json({ id });
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({ message: BAD_REQUEST });
    } else if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: NOT_FOUND });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const getStudybyId = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const study = await studyService.findStudyById(studyid);

    if (!study) {
      throw new Error(NOT_FOUND);
    }
    await studyService.updateStudyViews(study);
    return res.status(200).json(study);
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: NOT_FOUND });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const updateStudy = async (req: Request, res: Response) => {
  const BAD_REQUEST = '요청값이 유효하지 않음';
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    if (!Object.keys(req.body).length) throw new Error(BAD_REQUEST);
    const allowedFields = [
      'title',
      'studyAbout',
      'weekday',
      'frequency',
      'location',
      'capacity',
      'categoryCode',
      'dueDate',
    ];
    Object.keys(req.body).forEach((key) => {
      if (!allowedFields.includes(key)) throw new Error(BAD_REQUEST);
    });
    if (!req.body.weekday.length || !req.body.location.length)
      throw new Error(BAD_REQUEST);
    req.body.weekday.forEach((value: string) => {
      if (!(Object.values(WeekDayEnum) as string[]).includes(value))
        throw new Error(BAD_REQUEST);
    });
    if (
      !(Object.values(FrequencyEnum) as string[]).includes(req.body.frequency)
    )
      throw new Error(BAD_REQUEST);
    req.body.location.forEach((value: string) => {
      if (!(Object.values(LocationEnum) as string[]).includes(value))
        throw new Error(BAD_REQUEST);
    });

    const study = await studyService.findStudyById(studyid);
    if (!study) {
      throw new Error(NOT_FOUND);
    }
    await studyService.updateStudy(req.body, study);

    if (process.env.NODE_ENV !== 'test') {
      const users = await findAllByStudyId(studyid);
      if (users.length !== 0) {
        const notiTitle = '모집정보 수정';
        const notiAbout = '신청한 스터디의 모집 정보가 수정되었어요.';
        for (const user of users) {
          await createStudyNoti(
            studyid,
            user?.USER_ID,
            notiTitle,
            notiAbout,
            103
          );
        }
      }
    }

    return res.status(200).json({ message: '스터디 정보 업데이트 성공' });
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({ message: BAD_REQUEST });
    } else if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: NOT_FOUND });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const deleteStudy = async (req: Request, res: Response) => {
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const study = await studyService.findStudyById(studyid);

    if (!study) {
      throw new Error(NOT_FOUND);
    }
    await studyService.deleteStudy(study);
    return res.status(200).json({ message: '스터디 삭제 성공' });
  } catch (e) {
    if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: NOT_FOUND });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const searchStudy = async (req: Request, res: Response) => {
  const BAD_REQUEST = '요청값이 유효하지 않음';

  const keyword: string = req.query.keyword as string;
  const weekdayFilter = req.query.weekday
    ? (req.query.weekday as string).split(',')
    : null;
  const frequencyFilter = req.query.frequency as string;
  const locationFilter = req.query.location
    ? (req.query.location as string).split(',')
    : null;
  const orderBy: string = (req.query.order_by as string) || orderByEnum.LATEST;

  try {
    if (weekdayFilter && !weekdayFilter.length) {
      weekdayFilter.forEach((weekday) => {
        if (!(Object.values(WeekDayEnum) as string[]).includes(weekday))
          throw new Error(BAD_REQUEST);
      });
    }
    if (frequencyFilter) {
      if (!(Object.values(FrequencyEnum) as string[]).includes(frequencyFilter))
        throw new Error(BAD_REQUEST);
    }
    if (locationFilter && !locationFilter.length) {
      locationFilter.forEach((location) => {
        if (!(Object.values(LocationEnum) as string[]).includes(location))
          throw new Error(BAD_REQUEST);
      });
    }
    if (!(Object.values(orderByEnum) as string[]).includes(orderBy))
      throw new Error(BAD_REQUEST);
    const studies = await studyService.searchStudy({
      keyword,
      weekdayFilter,
      frequencyFilter,
      locationFilter,
      orderBy,
    });

    return res.status(200).json(studies);
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({ message: BAD_REQUEST });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

const getMyStudy = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as { id: string }).id;

    const studies = await studyService.getMyStudy(userId);
    return res.status(200).json(studies);
  } catch (e) {
    return res.status(500).json({ message: (e as Error).message });
  }
};

const closeStudy = async (req: Request, res: Response) => {
  const BAD_REQUEST = '잘못된 요청입니다';
  const NOT_FOUND = '데이터베이스에 일치하는 요청값이 없습니다';

  try {
    const { studyid } = req.params;
    const study = await studyService.findStudyById(studyid);

    if (!study) throw new Error(NOT_FOUND);
    if (study.isOpen) {
      await studyService.closeStudy(study);
    } else {
      throw new Error(BAD_REQUEST);
    }
    return res.status(200).json({ message: '스터디 마감 성공' });
  } catch (e) {
    if ((e as Error).message === BAD_REQUEST) {
      return res.status(400).json({ message: BAD_REQUEST });
    } else if ((e as Error).message === NOT_FOUND) {
      return res.status(404).json({ message: NOT_FOUND });
    } else {
      return res.status(500).json({ message: (e as Error).message });
    }
  }
};

export default {
  getAllStudy,
  createStudy,
  getStudybyId,
  updateStudy,
  deleteStudy,
  searchStudy,
  getMyStudy,
  closeStudy,
};

/**
 * @swagger
 * paths:
 *  /api/study:
 *    get:
 *      summary: "스터디 목록 조회"
 *      tags:
 *      - "study"
 *      description: "메인페이지에서 모든 스터디의 목록을 조회하기 위한 엔드포인트입니다"
 *      parameters:
 *      - name: "categoryCode"
 *        in: "query"
 *        description: "조회할 카테고리 코드"
 *        required: false
 *        type: integer
 *      - name: "frequency"
 *        in: "query"
 *        description: "필터 조건 - 스터디 빈도 / FrequencyEnum"
 *        required: false
 *        type: string
 *      - name: "weekday"
 *        in: "query"
 *        description: "필터 조건 - 요일 / WeekDayEnum"
 *        required: false
 *        type: string
 *      - name: "location"
 *        in: "query"
 *        description: "필터 조건 - 장소 / LocationEnum"
 *        required: false
 *        type: string
 *      - name: "order_by"
 *        in: "query"
 *        description: "정렬 조건 기본값: 최근 등록순 (enum: latest, last, small_vacancy, large_vacancy)"
 *        required: false
 *        type: string
 *      - name: "pageNo"
 *        in: "query"
 *        description: "조회할 페이지"
 *        required: false
 *        type: integer
 *      - name: "limit"
 *        in: "query"
 *        description: "한 페이지를 조회할 때 들어갈 스터디의 개수 (기본값: 12개)"
 *        required: false
 *        type: integer
 *      responses:
 *        200:
 *          description: "올바른 요청. 스터디 객체 배열, 현재 페이지, 전체 페이지 수, 전체 스터디 개수를 반환합니다."
 *          schema:
 *            type: object
 *            properties:
 *              studies:
 *                type: array
 *                items:
 *                  $ref: "#/definitions/Study"
 *              pageNo:
 *                type: integer
 *              pages:
 *                type: integer
 *              total:
 *                type: integer
 *
 *    post:
 *      summary: "새로운 스터디 생성"
 *      description: "사용자가 스터디를 생성할 때 사용되는 엔드포인트입니다"
 *      tags:
 *      - "study"
 *      parameters:
 *      - in: "body"
 *        name: "study_body"
 *        description: "DB에 추가할 새로운 스터디 정보 객체"
 *        required: true
 *        schema:
 *          type: object
 *          allOf:
 *            - type: object
 *              properties:
 *                title:
 *                  type: string
 *                studyAbout:
 *                  type: string
 *                weekday:
 *                  type: array
 *                  items:
 *                    type: string
 *                    enum:
 *                    - "mon"
 *                    - "tue"
 *                    - "wed"
 *                    - "thu"
 *                    - "fri"
 *                    - "sat"
 *                    - "sun"
 *                frequency:
 *                  type: string
 *                  enum:
 *                  - "once"
 *                  - "twice"
 *                  - "more"
 *                location:
 *                  type: array
 *                  items:
 *                    type: string
 *                    enum:
 *                    - "no_contact"
 *                    - "studyroom"
 *                    - "library"
 *                    - "study_cafe"
 *                    - "cafe"
 *                    - "loc1"
 *                    - "loc2"
 *                    - "else"
 *                capacity:
 *                  type: number
 *                categoryCode:
 *                  type: number
 *                dueDate:
 *                  type: string
 *      responses:
 *        201:
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              id:
 *                type: string
 *                format: uuid
 *                description: "생성된 스터디의 아이디"
 *        400:
 *          description: "요청값이 유효하지 않은 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "요청값이 유효하지 않음"
 *        401:
 *          description: "로그인이 되어있지 않은 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "로그인 필요"
 *
 *  /api/study/{studyid}:
 *    get:
 *      summary: "스터디 아이디에 해당하는 스터디 정보 조회"
 *      description: "스터디 상세페이지에서 각 스터디 아이디에 해당하는 모든 상세 정보들을 조회할 엔드포인트입니다"
 *      tags:
 *      - "study"
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "정보를 조회할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      responses:
 *        200:
 *          description: "올바른 요청, 스터디 정보를 반환합니다"
 *          schema:
 *            $ref: "#/definitions/Study"
 *        404:
 *          description: "전달한 studyid가 데이터베이스에 없는 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "데이터베이스에 일치하는 요청값이 없습니다"
 *
 *    patch:
 *      summary: "스터디 정보 업데이트"
 *      description: "각 스터디의 정보를 업데이트하기 위한 엔드포인트입니다"
 *      tags:
 *      - "study"
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "수정할 스터디 id"
 *        required: true
 *        type: string
 *        format: uuid
 *      - in: "body"
 *        name: "study_body"
 *        description: "수정할 스터디 정보 객체"
 *        required: true
 *        schema:
 *          type: object
 *          allOf:
 *            - type: object
 *              properties:
 *                title:
 *                  type: string
 *                studyAbout:
 *                  type: string
 *                weekday:
 *                  type: array
 *                  items:
 *                    type: string
 *                    enum:
 *                    - "mon"
 *                    - "tue"
 *                    - "wed"
 *                    - "thu"
 *                    - "fri"
 *                    - "sat"
 *                    - "sun"
 *                frequency:
 *                  type: string
 *                  enum:
 *                  - "once"
 *                  - "twice"
 *                  - "more"
 *                location:
 *                  type: array
 *                  items:
 *                    type: string
 *                    enum:
 *                    - "no_contact"
 *                    - "studyroom"
 *                    - "library"
 *                    - "study_cafe"
 *                    - "cafe"
 *                    - "loc1"
 *                    - "loc2"
 *                    - "else"
 *                capacity:
 *                  type: number
 *                categorycode:
 *                  type: number
 *                dueDate:
 *                  type: string
 *      responses:
 *        200:
 *          description: "올바른 요청"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "스터디 정보 업데이트 성공"
 *        400:
 *          description: "요청값이 유효하지 않은 경우입니다"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "요청값이 유효하지 않음"
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
 *                example: "데이터베이스에 일치하는 요청값이 없습니다"
 *
 *    delete:
 *      summary: "스터디 삭제"
 *      description: "스터디를 삭제하기 위한 엔드포인트입니다"
 *      tags:
 *      - "study"
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "삭제할 스터디 id"
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
 *                example: "스터디 삭제 성공"
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
 *                example: "데이터베이스에 일치하는 요청값이 없습니다"
 *
 *  /api/study/search:
 *    get:
 *      summary: "스터디 검색 목록 조회"
 *      tags:
 *      - "study"
 *      description: "사용자가 검색한 스터디의 목록을 조회할 수 있습니다"
 *      parameters:
 *      - name: "keyword"
 *        in: "query"
 *        description: "검색어로 입력한 키워드"
 *        required: true
 *        type: string
 *      - name: "frequency"
 *        in: "query"
 *        description: "필터 조건 - 스터디 빈도 / FrequencyEnum"
 *        required: false
 *        type: string
 *      - name: "weekday"
 *        in: "query"
 *        description: "필터 조건 - 요일 / WeekDayEnum"
 *        required: false
 *        type: string
 *      - name: "location"
 *        in: "query"
 *        description: "필터 조건 - 장소 / LocationEnum"
 *        required: false
 *        type: string
 *      - name: "order_by"
 *        in: "query"
 *        description: "정렬 조건 기본값: 최근 등록순 (enum: latest, small_vacancy, large_vacancy)"
 *        required: false
 *        type: string
 *      responses:
 *        200:
 *          description: "올바른 요청."
 *          schema:
 *            allOf:
 *            - type: array
 *              items:
 *                $ref: "#/definitions/Study"
 *
 *  /api/study/my-study:
 *    get:
 *      summary: "모집 스터디 목록 조회"
 *      tags:
 *      - "study"
 *      - "my-page"
 *      description: "사용자가 모집한 스터디의 목록을 조회하는 엔드포인트입니다."
 *      responses:
 *        200:
 *          description: "올바른 요청."
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
 *
 *  /api/study/{studyid}/close:
 *    patch:
 *      summary: "스터디 마감"
 *      description: "스터디를 강제 마감 혹은 조기 마감시키기 위한 엔드포인트입니다."
 *      tags:
 *      - "study"
 *      parameters:
 *      - name: "studyid"
 *        in: "path"
 *        description: "마감할 스터디 id"
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
 *                example: "스터디 마감 성공"
 *        400:
 *          description: "이미 마감되어 있는 스터디에 요청을 보낸 경우"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *                example: "요청값이 유효하지 않음"
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
 *                example: "데이터베이스에 일치하는 요청값이 없습니다"
 */
