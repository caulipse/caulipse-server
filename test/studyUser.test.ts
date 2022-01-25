import { randomUUID } from 'crypto';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import app from '../src';
import { db } from '../src/config/db';
import Category from '../src/entity/CategoryEntity';
import Study, {
  FrequencyEnum,
  LocationEnum,
  WeekDayEnum,
} from '../src/entity/StudyEntity';
import StudyUser from '../src/entity/StudyUserEntity';
import User from '../src/entity/UserEntity';
import { saveStudyUserRecord } from '../src/services/studyUser';

let conn: Connection;
const studyId = randomUUID();

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  const mockStudy = new Study();
  mockStudy.id = studyId;
  mockStudy.title = 'STUDY TITLE';
  mockStudy.studyAbout = 'STUDY ABOUT';
  mockStudy.weekday = WeekDayEnum.TUE;
  mockStudy.frequency = FrequencyEnum.MORE;
  mockStudy.location = LocationEnum.LIBRARY;
  mockStudy.capacity = 10;
  mockStudy.hostId = new User();
  mockStudy.categoryCode = new Category();
  mockStudy.membersCount = 10;
  mockStudy.vacancy = 10;
  mockStudy.isOpen = true;
  mockStudy.views = 0;

  await conn.getRepository(Study).save(mockStudy);
});

afterAll(async () => {
  await conn.getRepository(StudyUser).createQueryBuilder().delete().execute();
  await conn.getRepository(User).createQueryBuilder().delete().execute();
  await conn.getRepository(Study).createQueryBuilder().delete().execute();
  conn.close();
});

describe('참가신청 api', () => {
  test('서비스 로직이 데이터베이스에 레코드를 생성한다', async () => {
    // given
    const userId = randomUUID();
    await conn.getRepository(User).save({
      id: userId,
      email: 'testtt@example.com',
      password: 'testpw',
      isLogout: false,
      token: '',
    });
    const tempBio = 'hi';

    // when
    await saveStudyUserRecord({ userId, studyId, tempBio });
    const found = await conn
      .getRepository(StudyUser)
      .findOne({ USER_ID: userId });

    // then
    expect(found).toBeTruthy();
    expect(found?.tempBio).toBe(tempBio);
  });

  test('참가신청 요청을 보내면 데이터베이스에 레코드를 생성한다', async () => {
    // given
    const userId = randomUUID();
    const email = 'asjdkf@test.com';
    const password = 'testpassword';
    await conn.getRepository(User).save({
      id: userId,
      email,
      password: bcrypt.hashSync(password, 10),
      isLogout: false,
      token: '',
    });
    const tempBio = 'adjsfojasdof';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .post(`/api/study/user/${studyId}`)
      .set('Cookie', cookies)
      .send({ tempBio });
    const record = await conn
      .getRepository(StudyUser)
      .findOne({ STUDY_ID: studyId, USER_ID: userId });

    // then
    expect(res.statusCode).toBe(201);
    expect(record).toBeTruthy();
    expect(record?.tempBio).toBe(tempBio);
  });

  test('요청 body에 tempBio 프로퍼티가 없을 경우 400 코드로 응답한다', async () => {
    // given
    const userId = randomUUID();
    const email = 'asjdkf@test.com';
    const password = 'testpassword';
    await conn.getRepository(User).save({
      id: userId,
      email,
      password: bcrypt.hashSync(password, 10),
      isLogout: false,
      token: '',
    });
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .post(`/api/study/user/${studyId}`)
      .set('Cookie', cookies)
      .send();
    const record = await conn
      .getRepository(StudyUser)
      .findOne({ STUDY_ID: studyId, USER_ID: userId });

    // then
    expect(res.statusCode).toBe(400);
    expect(record).toBeFalsy();
  });

  test('로그인하지 않은 채로 참가신청 요청을 보내면 401 코드로 응답한다', async () => {
    // given
    const userId = randomUUID();
    const email = 'asjsdkjfdkf@test.com';
    const password = 'testpassword';
    await conn.getRepository(User).save({
      id: userId,
      email,
      password,
      isLogout: false,
      token: '',
    });
    const tempBio = 'adjsfojasdofsadf';

    // when
    const res = await request(app)
      .post(`/api/study/user/${studyId}`)
      .send({ tempBio });
    const record = await conn
      .getRepository(StudyUser)
      .findOne({ STUDY_ID: studyId, USER_ID: userId });

    // then
    expect(res.statusCode).toBe(401);
    expect(record).toBeFalsy();
  });

  test('올바르지 않은 스터디 id 로 참가신청 요청을 보낼 경우 404 코드로 응답한다', async () => {
    // given
    const userId = randomUUID();
    const email = 'asdjfoj@test.com';
    const password = 'testpassword';
    await conn.getRepository(User).save({
      id: userId,
      email,
      password: bcrypt.hashSync(password, 10),
      isLogout: false,
      token: '',
    });
    const tempBio = 'adjsfojasdof';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongStudyId = '123423434234244324123';

    // when
    const res = await request(app)
      .post(`/api/study/user/${wrongStudyId}`)
      .set('Cookie', cookies)
      .send({ tempBio });
    const record = await conn
      .getRepository(StudyUser)
      .findOne({ STUDY_ID: studyId, USER_ID: userId });

    // then
    expect(res.statusCode).toBe(404);
    expect(record).toBeFalsy();
  });
});
