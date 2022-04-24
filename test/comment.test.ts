import request from 'supertest';
import {
  Connection,
  ConnectionOptions,
  createConnection,
  getRepository,
} from 'typeorm';
import app from '../src';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../src/config/db';
import User, { UserRoleEnum } from '../src/entity/UserEntity';
import Study, {
  WeekDayEnum,
  FrequencyEnum,
  LocationEnum,
} from '../src/entity/StudyEntity';
import commentService from '../src/services/comment';
import Notification from '../src/entity/NotificationEntity';
import Comment from '../src/entity/CommentEntity';

let conn: Connection;
let userid: string;
let studyid: string;
let commentid1: string;
let commentid2: string;

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  userid = randomUUID();
  const password = bcrypt.hashSync('test', 10);
  const userRepo = getRepository(User);
  const user = new User();
  user.id = userid;
  user.email = 'test@gmail.com';
  user.password = password;
  user.isLogout = false;
  user.token = '';
  user.role = UserRoleEnum.USER;

  await userRepo.save(user);

  studyid = randomUUID();
  const studyRepo = getRepository(Study);
  const study = new Study();
  const date = new Date();
  study.id = studyid;
  study.createdAt = date;
  study.title = '스터디 제목';
  study.studyAbout = '스터디 내용';
  study.weekday = [WeekDayEnum.MON, WeekDayEnum.TUE];
  study.frequency = FrequencyEnum.ONCE;
  study.location = [LocationEnum.CAFE, LocationEnum.ELSE];
  study.hostId = user;
  study.capacity = 10;
  study.membersCount = 0;
  study.vacancy = 10;
  study.isOpen = true;
  study.categoryCode = 101;
  study.views = 0;
  study.bookmarkCount = 0;
  study.dueDate = new Date(date.getTime() + 60 * 60 * 5);

  await studyRepo.save(study);
});

afterAll(async () => {
  await getRepository(Notification).createQueryBuilder().delete().execute();
  await getRepository(Comment).createQueryBuilder().delete().execute();
  await getRepository(Study).createQueryBuilder().delete().execute();
  await getRepository(User).createQueryBuilder().delete().execute();

  conn.close();
});

describe('POST /api/study/:studyid/comment', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('body에 작성내용, 유저 id가 포함된 요청을 받으면 studyid에 해당하는 스터디에 문의글을 등록하고 아이디 반환', async () => {
    const res = await request(app)
      .post(`/api/study/${studyid}/comment`)
      .set('Cookie', cookies)
      .send({
        content: '댓글 내용',
      });

    const { commentId } = res.body;
    commentid1 = commentId;

    expect(res.status).toBe(201);
    expect(commentId).not.toBeNull();
  });

  it('body에 작성내용, 유저id, 댓글을 작성한 문의글 id가 포함된 요청을 받으면 문의글을 등록하고 아이디 반환', async () => {
    const res = await request(app)
      .post(`/api/study/${studyid}/comment`)
      .set('Cookie', cookies)
      .send({
        content: '대댓글 내용',
        replyTo: commentid1,
      });

    const { commentId } = res.body;
    commentid2 = commentId;

    expect(res.status).toBe(201);
    expect(commentId).not.toBeNull();
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const res = await request(app).post(`/api/study/${studyid}/comment`).send({
      content: '대댓글 내용',
    });

    expect(res.status).toBe(401);
  });

  it('유효하지 않은 body를 포함하거나 body를 포함하지 않은 요청을 받으면 400 응답', async () => {
    const res = await request(app)
      .post(`/api/study/${studyid}/comment`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(400);
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .post('/api/study/wrong/comment')
      .set('Cookie', cookies)
      .send({
        content: '댓글 내용',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/:studyid/comment', () => {
  it('요청된 studyid에 해당하는 스터디의 모든 문의글 목록 조회', async () => {
    const res = await request(app).get(`/api/study/${studyid}/comment`);

    const { comments } = res.body;

    expect(res.status).toBe(200);
    expect(comments).not.toBeNull();
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app).get('/api/study/wrong/comment');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/study/:studyid/comment/:commentid', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('body를 포함한 요청을 받으면 studyid, commentid에 해당하는 문의글 업데이트', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyid}/comment/${commentid2}`)
      .set('Cookie', cookies)
      .send({
        content: '수정한 내용',
      });

    expect(res.status).toBe(200);
  });

  it('유효하지 않은 body를 포함하거나 body를 포함하지 않은 요청을 받으면 400 응답', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyid}/comment/${commentid2}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(400);
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyid}/comment/${commentid2}`)
      .send({
        content: '수정한 내용',
      });

    expect(res.status).toBe(401);
  });

  it('요청된 commentid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyid}/comment/wrong`)
      .set('Cookie', cookies)
      .send({
        content: '수정한 내용',
      });

    expect(res.status).toBe(404);
  });

  it('요청된 studyid 또는 commentid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .patch('/api/study/wrong/comment/wrong')
      .set('Cookie', cookies)
      .send({
        content: '수정한 내용',
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/study/:studyid/comment/:commentid', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/${commentid2}`)
      .send();

    expect(res.status).toBe(401);
  });

  it('요청된 commentid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/wrong`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(404);
  });

  it('요청된 studyid 또는 commentid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .delete('/api/study/wrong/comment/wrong')
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(404);
  });

  it('대댓글이 달려있는 댓글을 삭제할 때는 데이터베이스에서 삭제하지 않고, 사용자 아이디와 내용 업데이트하여 삭제 처리', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/${commentid1}`)
      .set('Cookie', cookies)
      .send();

    const comment = await commentService.findCommentById(commentid1);

    expect(res.status).toBe(200);
    expect(comment?.user).toBeUndefined();
    expect(comment?.content).toEqual('삭제된 문의글입니다.');
  });

  it('대댓글을 삭제할 때는 바로 데이터베이스에서 삭제', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/${commentid2}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
  });

  it('대댓글이 남아있지 않은 댓글을 삭제할 때는 바로 데이터베이스에서 삭제', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/${commentid1}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
  });
});
