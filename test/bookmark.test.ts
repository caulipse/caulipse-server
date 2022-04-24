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

let conn: Connection;
let userid: string;
let studyid: string;

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
  await getRepository(Study).createQueryBuilder().delete().execute();
  await getRepository(User).createQueryBuilder().delete().execute();

  conn.close();
});

describe('POST /api/study/:studyid/bookmark', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('studyid에 해당하는 스터디를 찾아 북마크 생성', async () => {
    const res = await request(app)
      .post(`/api/study/${studyid}/bookmark`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(201);
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const res = await request(app)
      .post(`/api/study/${studyid}/bookmark`)
      .send();

    expect(res.status).toBe(401);
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .post(`/api/study/wrong/bookmark`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(404);
  });
});

describe('GET /api/user/bookmark', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('해당 사용자의 모든 북마크 목록 반환', async () => {
    const res = await request(app)
      .get('/api/user/bookmark')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const res = await request(app).get('/api/user/bookmark');

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/study/:studyid/bookmark', () => {
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
      .delete(`/api/study/${studyid}/bookmark`)
      .send();

    expect(res.status).toBe(401);
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .delete(`/api/study/wrong/bookmark`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(404);
  });

  it('studyid에 해당하는 스터디의 북마크 취소', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}/bookmark`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
  });
});
