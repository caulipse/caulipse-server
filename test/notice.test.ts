import app from '../src';
import request from 'supertest';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { db } from '../src/config/db';
import { randomUUID } from 'crypto';
import Notice from '../src/entity/NoticeEntity';
import User, { UserRoleEnum } from '../src/entity/UserEntity';
import bcrypt from 'bcrypt';
import Notification from '../src/entity/NotificationEntity';

let conn: Connection;
let noticeId: string;
const admin = new User();

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  admin.id = randomUUID();
  admin.email = 'testadmin@cau.ac.kr';
  admin.password = bcrypt.hashSync('testadmin', 10);
  admin.isLogout = false;
  admin.role = UserRoleEnum.ADMIN;
  admin.token = '';
  await conn.getRepository(User).save(admin);

  const user = new User();
  user.id = randomUUID();
  user.email = 'testuser@cau.ac.kr';
  user.password = bcrypt.hashSync('testuser', 10);
  user.isLogout = false;
  user.role = UserRoleEnum.USER;
  user.token = '';
  await conn.getRepository(User).save(user);
});

afterAll(async () => {
  await conn
    .getRepository(Notification)
    .createQueryBuilder()
    .delete()
    .execute();
  await conn.getRepository(Notice).createQueryBuilder().delete().execute();
  await conn.getRepository(User).createQueryBuilder().delete().execute();
  conn.close();
});

describe('공지사항 생성 api', () => {
  it('새로운 공지사항을 생성한다', async () => {
    // login
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'testadmin@cau.ac.kr',
      password: 'testadmin',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/notice')
      .set('Cookie', cookies)
      .send({
        title: 'test notice title',
        about: 'test notice about',
      });
    noticeId = res.body.noticeId;

    expect(res.status).toBe(201);
  });

  it('요청값이 유효하지 않은 경우 400을 반환한다', async () => {
    // login
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'testadmin@cau.ac.kr',
      password: 'testadmin',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/notice')
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(400);
  });

  it('요청을 보낸 사용자가 ADMIN이 아닌 경우 403을 반환한다', async () => {
    // login
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'testuser@cau.ac.kr',
      password: 'testuser',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/notice')
      .set('Cookie', cookies)
      .send({
        title: 'test notice title',
        about: 'test notice about',
      });

    expect(res.status).toBe(403);
  });
});

describe('공지사항 조회 api', () => {
  test('로그인하지 않아도 401 코드로 응답하지 않는다.', async () => {
    const res = await request(app).get('/api/notice');
    expect(res.statusCode).not.toBe(401);
  });

  test('데이터를 조회한다', async () => {
    const res = await request(app).get('/api/notice');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('공지사항 페이지네이션', () => {
  beforeAll(async () => {
    const notices = [];
    const itemNumber = 30;
    const makeNoticeRecord = (idx: number) => {
      const notice = new Notice();
      notice.id = randomUUID();
      notice.title = `페이지네이션 테스트`;
      notice.about = `${idx}`;
      notice.views = 0;
      notice.createdAt = new Date();
      notice.hostId = admin;
      return notice;
    };
    for (let i = 0; i < itemNumber; i++) notices.push(makeNoticeRecord(i));
    await conn
      .getRepository(Notice)
      .createQueryBuilder()
      .insert()
      .values(notices)
      .execute();
  });

  afterAll(async () => {
    await conn
      .getRepository(Notice)
      .createQueryBuilder()
      .delete()
      .where('TITLE = :title', { title: '페이지네이션 테스트' })
      .execute();
  });

  test('5개의 항목을 요청하면 5개의 항목만 반환한다', async () => {
    // given
    const limit = 5;

    // when
    const res = await request(app).get(`/api/notice?limit=${limit}`);

    // then
    expect(res.body.data.length).toBe(5);
  });

  test('쿼리스트링 정보를 아무것도 주지 않으면 12개의 항목을 반환한다', async () => {
    // given
    // when
    const res = await request(app).get('/api/notice');

    // then
    expect(res.body.data.length).toBe(12);
  });

  test('5개씩 요청했을 때 총 페이지 갯수 응답은 7이다', async () => {
    // given
    const limit = 5;

    // when
    const res = await request(app).get(`/api/notice?limit=${limit}`);

    // then
    expect(res.body.pages).toBe(7);
  });

  test('9개씩 요청했을 때 총 페이지 갯수 응답은 4이다', async () => {
    // given
    const limit = 9;

    // when
    const res = await request(app).get(`/api/notice?limit=${limit}`);

    // then
    expect(res.body.pages).toBe(4);
  });

  test('100개씩 요청했을 때 총 페이지 갯수 응답은 1이다', async () => {
    // given
    const limit = 100;

    // when
    const res = await request(app).get(`/api/notice?limit=${limit}`);

    // then
    expect(res.body.pages).toBe(1);
  });
});

describe('공지사항 업데이트 api', () => {
  test('로그인하지 않은 경우 401 코드로 응답한다', async () => {
    const res = await request(app).patch(`/api/notice/${noticeId}`);
    expect(res.statusCode).toBe(401);
  });

  test('유효하지 않은 request body로 요청을 보낼 경우 400 코드로 응답한다', async () => {
    // given
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'testadmin@cau.ac.kr', password: 'testadmin' });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/notice/${noticeId}`)
      .set('Cookie', cookies)
      .send();

    // then
    expect(res.statusCode).toBe(400);
  });

  test('어드민이 아닌 사용자가 요청을 보낼 경우 403 코드로 응답한다', async () => {
    // given
    const title = 'changed title';
    const noticeAbout = 'changed about';

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'testuser@cau.ac.kr', password: 'testuser' });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/notice/${noticeId}`)
      .set('Cookie', cookies)
      .send({ title, noticeAbout });

    // then
    expect(res.statusCode).toBe(403);
  });

  test('올바르지 않은 공지사항 id로 요청을 보낼 경우 404 코드로 응답한다', async () => {
    // given
    const title = 'changed title';
    const noticeAbout = 'changed about';
    const wrongNoticeId = 'aksodjfosajd';

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'testadmin@cau.ac.kr', password: 'testadmin' });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/notice/${wrongNoticeId}`)
      .set('Cookie', cookies)
      .send({ title, noticeAbout });

    // then
    expect(res.statusCode).toBe(404);
  });

  test('올바른 요청을 보낼 경우 공지사항 정보를 업데이트하고 200 코드로 응답한다', async () => {
    // given
    const title = 'changed title';
    const noticeAbout = 'changed about';

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: 'testadmin@cau.ac.kr', password: 'testadmin' });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const before = await conn.getRepository(Notice).findOne(noticeId);
    const res = await request(app)
      .patch(`/api/notice/${noticeId}`)
      .set('Cookie', cookies)
      .send({ title, noticeAbout });
    const after = await conn.getRepository(Notice).findOne(noticeId);

    // then
    expect(res.statusCode).toBe(200);
    expect(before?.title).not.toBe(title);
    expect(before?.about).not.toBe(noticeAbout);
    expect(after?.title).toBe(title);
    expect(after?.about).toBe(noticeAbout);
  });
});

describe('공지사항 상세 정보 api', () => {
  it('공지사항의 상세 정보를 반환한다', async () => {
    const res = await request(app).get(`/api/notice/${noticeId}`);

    expect(res.status).toBe(200);
    expect(res.body.notice.id).toBe(noticeId);
  });

  it('요청한 noticeId가 데이터베이스에 존재하지 않으면 404를 반환한다', async () => {
    const res = await request(app).get(`/api/notice/wrong`);

    expect(res.status).toBe(404);
  });
});

describe('공지사항 삭제 api', () => {
  it('요청을 보낸 사용자가 ADMIN이 아닌 경우 403을 반환한다', async () => {
    // login
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'testuser@cau.ac.kr',
      password: 'testuser',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/notice/${noticeId}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(403);
  });

  it('올바르지 않은 공지사항 id로 요청을 보낼 경우 404 코드로 응답한다', async () => {
    // login
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'testadmin@cau.ac.kr',
      password: 'testadmin',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/notice/wrong`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(404);
  });

  it('공지사항을 삭제한다', async () => {
    // login
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'testadmin@cau.ac.kr',
      password: 'testadmin',
    });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/notice/${noticeId}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
  });
});
