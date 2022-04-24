import { randomUUID } from 'crypto';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import app from '../src';
import { db } from '../src/config/db';
import User from '../src/entity/UserEntity';
import Notification from '../src/entity/NotificationEntity';
import Study, {
  FrequencyEnum,
  LocationEnum,
  WeekDayEnum,
} from '../src/entity/StudyEntity';

let conn: Connection;
// host:  mockUser2
let mockStudy: Study;
let mockUser1: User, mockUser2: User;
// mockNoti1 - owner: mockUser1
let mockNoti1: Notification;

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  mockUser1 = new User();
  mockUser1.id = randomUUID();
  mockUser1.email = 'mockuser1@test.com';
  mockUser1.password = bcrypt.hashSync('testpassword', 10);
  mockUser1.isLogout = false;
  mockUser1.token = '';
  await conn.getRepository(User).save(mockUser1);

  mockUser2 = new User();
  mockUser2.id = randomUUID();
  mockUser2.email = 'mockuser2@test.com';
  mockUser2.password = bcrypt.hashSync('testpassword', 10);
  mockUser2.isLogout = false;
  mockUser2.token = '';
  await conn.getRepository(User).save(mockUser2);

  const date = new Date();
  mockStudy = new Study();
  mockStudy.id = randomUUID();
  mockStudy.title = 'STUDY TITLE';
  mockStudy.studyAbout = 'STUDY ABOUT';
  mockStudy.weekday = [WeekDayEnum.MON, WeekDayEnum.TUE];
  mockStudy.frequency = FrequencyEnum.MORE;
  mockStudy.location = [LocationEnum.CAFE, LocationEnum.ELSE];
  mockStudy.capacity = 10;
  mockStudy.hostId = mockUser2;
  mockStudy.categoryCode = 100;
  mockStudy.membersCount = 10;
  mockStudy.vacancy = 10;
  mockStudy.isOpen = true;
  mockStudy.views = 0;
  mockStudy.bookmarkCount = 0;
  mockStudy.dueDate = new Date(date.getTime() + 60 * 60 * 5);
  await conn.getRepository(Study).save(mockStudy);

  mockNoti1 = new Notification();
  mockNoti1.id = randomUUID();
  mockNoti1.user = mockUser1;
  mockNoti1.read = false;
  mockNoti1.study = mockStudy;
  mockNoti1.type = 0;
  mockNoti1.title = 'test title1';
  mockNoti1.notiAbout = 'test about1';
  mockNoti1.read = false;
  await conn.getRepository(Notification).save(mockNoti1);
});

afterAll(async () => {
  await conn
    .getRepository(Notification)
    .createQueryBuilder()
    .delete()
    .execute();
  await conn.getRepository(Study).createQueryBuilder().delete().execute();
  await conn.getRepository(User).createQueryBuilder().delete().execute();
  conn.close();
});

describe('사용자 알림 조회 api', () => {
  test('로그인하지 않았을 경우 401 코드로 응답한다', async () => {
    const res = await request(app).get('/api/user/notification/');
    expect(res.statusCode).toBe(401);
  });

  test('정상적인 요청의 경우 200 코드와 함께 데이터를 응답한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .get('/api/user/notification')
      .set('Cookie', cookies);

    // then
    const data = res.body;
    expect(res.statusCode).toBe(200);
    expect(data.length).toBe(1);
    expect(data[0].Notification_ID).toBe(mockNoti1.id);
    expect(data[0].Notification_USER_ID).toBe(mockUser1.id);
    expect(data[0].Notification_STUDY_ID).toBe(mockStudy.id);
  });
});

describe('사용자 알림 확인 상태 갱신 api', () => {
  test('로그인하지 않았을 시 401 코드로 응답한다', async () => {
    const res = await request(app)
      .patch(`/api/user/notification/${mockNoti1.id}`)
      .send();
    expect(res.statusCode).toBe(401);
  });

  test('올바르지 않은 알림 id로 요청을 보낼 경우 404 코드로 응답한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongId = 'asdfjlasjdflj';

    // when
    const res = await request(app)
      .patch(`/api/user/notification/${wrongId}`)
      .set('Cookie', cookies)
      .send();

    // then
    expect(res.statusCode).toBe(404);
  });

  test('올바른 요청을 보낼 경우 알림의 확인 상태를 false에서 true로 갱신한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const query = async () => {
      return await conn
        .getRepository(Notification)
        .createQueryBuilder()
        .select()
        .where('id = :id', { id: mockNoti1.id })
        .getOne();
    };

    // when
    const before = await query();
    const res = await request(app)
      .patch(`/api/user/notification/${mockNoti1.id}`)
      .set('Cookie', cookies)
      .send();
    const after = await query();

    // then
    expect(res.statusCode).toBe(200);
    expect(before?.read).toBeFalsy();
    expect(after?.read).not.toBeFalsy();
  });
});

describe('사용자 알림 삭제 api', () => {
  test('로그인하지 않았을 시 401 코드로 응답한다', async () => {
    const res = await request(app)
      .delete(`/api/user/notification/${mockNoti1.id}`)
      .send();
    expect(res.statusCode).toBe(401);
  });

  test('올바르지 않은 알림 id로 요청을 보낼 경우 404 코드로 응답한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongId = 'asdjfoiajdfio';

    // when
    const res = await request(app)
      .delete(`/api/user/notification/${wrongId}`)
      .set('Cookie', cookies)
      .send();

    // then
    expect(res.statusCode).toBe(404);
  });

  test('올바른 요청을 보낼 경우 알림 항목을 삭제한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const query = async () => {
      return await conn
        .getRepository(Notification)
        .createQueryBuilder()
        .select()
        .where('id = :id', { id: mockNoti1.id })
        .getOne();
    };

    // when
    const before = await query();
    const res = await request(app)
      .delete(`/api/user/notification/${mockNoti1.id}`)
      .set('Cookie', cookies)
      .send();
    const after = await query();

    // then
    expect(res.statusCode).toBe(200);
    expect(before).toBeTruthy();
    expect(after).toBeFalsy();
  });
});
