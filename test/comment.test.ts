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
import Comment from '../src/entity/CommentEntity';
import UserProfile from '../src/entity/UserProfileEntity';

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
  const user = new User();
  user.id = userid;
  user.email = 'test@gmail.com';
  user.password = password;
  user.isLogout = false;
  user.token = '';
  user.role = UserRoleEnum.USER;
  await getRepository(User).save(user);

  const profile = new UserProfile();
  profile.id = user;
  profile.email = user.email;
  profile.userName = 'user';
  profile.dept = 'dept';
  profile.grade = 1;
  profile.bio = 'bio';
  profile.userAbout = 'about';
  profile.showDept = false;
  profile.showGrade = false;
  profile.onBreak = false;
  profile.categories = ['100'];
  profile.link1 = 'user_link1';
  profile.link2 = 'user_link2';
  profile.link3 = 'user_link3';
  profile.image = 'image';
  await getRepository(UserProfile).save(profile);

  studyid = randomUUID();
  const study = new Study();
  const date = new Date();
  study.id = studyid;
  study.createdAt = date;
  study.title = '스터디 제목';
  study.studyAbout = '스터디 내용';
  study.weekday = [WeekDayEnum.MON, WeekDayEnum.TUE];
  study.frequency = FrequencyEnum.ONCE;
  study.location = [LocationEnum.CAFE, LocationEnum.ELSE];
  study.hostId = profile;
  study.capacity = 10;
  study.membersCount = 0;
  study.vacancy = 10;
  study.isOpen = true;
  study.categoryCode = 101;
  study.views = 0;
  study.bookmarkCount = 0;
  study.dueDate = new Date(date.getTime() + 60 * 60 * 5);
  await getRepository(Study).save(study);
});

afterAll(async () => {
  await getRepository(Comment).createQueryBuilder().delete().execute();
  await getRepository(Study).createQueryBuilder().delete().execute();
  await getRepository(UserProfile).createQueryBuilder().delete().execute();
  await getRepository(User).createQueryBuilder().delete().execute();

  conn.close();
});

describe('GET /api/:studyid/comment - 댓글 X', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('요청된 studyid에 해당하는 스터디의 모든 문의글 목록 조회 (로그인O)', async () => {
    const res = await request(app)
      .get(`/api/study/${studyid}/comment`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.length).toEqual(0);
  });

  it('요청된 studyid에 해당하는 스터디의 모든 문의글 목록 조회 (로그인X)', async () => {
    const res = await request(app).get(`/api/study/${studyid}/comment`);

    expect(res.status).toBe(200);
    expect(res.body.length).toEqual(0);
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app).get('/api/study/wrong/comment');

    expect(res.status).toBe(404);
  });
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

    commentid1 = res.body.id;

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBeNull();
  });

  it('body에 작성내용, 유저id, 댓글을 작성한 문의글 id가 포함된 요청을 받으면 문의글을 등록하고 아이디 반환', async () => {
    const res = await request(app)
      .post(`/api/study/${studyid}/comment`)
      .set('Cookie', cookies)
      .send({
        content: '대댓글 내용',
        replyTo: commentid1,
      });

    commentid2 = res.body.id;

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBeNull();
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

describe('GET /api/:studyid/comment - 댓글 O', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];

    // metoo
    await request(app)
      .post(`/api/study/${studyid}/comment/${commentid1}/metoo`)
      .set('Cookie', cookies)
      .send();
  });

  it('요청된 studyid에 해당하는 스터디의 모든 문의글 목록 조회 (로그인O)', async () => {
    const res = await request(app)
      .get(`/api/study/${studyid}/comment/login`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.length).not.toEqual(0);
    expect(res.body[0].metoo).toBeTruthy();
  });

  it('요청된 studyid에 해당하는 스터디의 모든 문의글 목록 조회 (로그인X)', async () => {
    const res = await request(app).get(`/api/study/${studyid}/comment`);

    expect(res.status).toBe(200);
    expect(res.body.length).not.toEqual(0);
    expect(res.body[0].metoo).toBeFalsy();
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

    const comment = await commentService.findCommentById(commentid2);

    expect(res.status).toBe(200);
    expect(comment?.content).toEqual('수정한 내용');
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

    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
    expect(res.body.content).toEqual('삭제된 문의글입니다.');
    expect(res.body.updateRequired).toBeTruthy();
  });

  it('대댓글을 삭제할 때는 바로 데이터베이스에서 삭제', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/${commentid2}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.updateRequired).toBeFalsy();
  });

  it('대댓글이 남아있지 않은 댓글을 삭제할 때는 바로 데이터베이스에서 삭제', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/comment/${commentid1}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.updateRequired).toBeFalsy();
  });
});
