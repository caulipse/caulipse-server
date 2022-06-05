import request from 'supertest';
import {
  Connection,
  ConnectionOptions,
  createConnection,
  getRepository,
} from 'typeorm';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import app from '../src';
import { db } from '../src/config/db';
import Study, {
  FrequencyEnum,
  LocationEnum,
  WeekDayEnum,
} from '../src/entity/StudyEntity';
import User, { UserRoleEnum } from '../src/entity/UserEntity';
import UserProfile from '../src/entity/UserProfileEntity';
import StudyUser from '../src/entity/StudyUserEntity';

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
  profile.categories = ['101'];
  profile.link1 = 'user_link1';
  profile.link2 = 'user_link2';
  profile.link3 = 'user_link3';
  profile.image = 'image';
  await getRepository(UserProfile).save(profile);
});

afterAll(async () => {
  await getRepository(Study).createQueryBuilder().delete().execute();
  await getRepository(UserProfile).createQueryBuilder().delete().execute();
  await getRepository(User).createQueryBuilder().delete().execute();

  conn.close();
});

describe('POST /api/study', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('body를 포함한 요청을 받으면 새로운 스터디를 생성하고 생성된 아이디를 반환', async () => {
    const date = new Date();
    const res = await request(app)
      .post('/api/study')
      .set('Cookie', cookies)
      .send({
        title: '스터디 제목',
        studyAbout: '스터디 내용',
        weekday: ['mon', 'tue'],
        frequency: FrequencyEnum.TWICE,
        location: [LocationEnum.CAFE, LocationEnum.ELSE],
        capacity: 8,
        categoryCode: 101,
        dueDate: new Date(date.getTime() + 60 * 60 * 5),
      });
    studyid = res.body.id;

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBeNull();
  });

  it('유효하지 않은 body를 포함하거나 body를 포함하지 않은 요청을 받으면 400 응답', async () => {
    const res = await request(app)
      .post('/api/study')
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(400);
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const date = new Date();
    const res = await request(app)
      .post('/api/study')
      .send({
        title: '스터디 제목',
        studyAbout: '스터디 내용',
        weekday: [WeekDayEnum.MON, WeekDayEnum.TUE],
        frequency: FrequencyEnum.TWICE,
        location: [LocationEnum.CAFE, LocationEnum.ELSE],
        capacity: 8,
        categorycode: 101,
        dueDate: new Date(date.getTime() + 60 * 60 * 5),
      });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/study', () => {
  it('query를 포함한 요청을 받으면 필터링, 정렬, 페이지네이션을 거친 후 스터디 목록과 페이지 커서 반환(첫번째 페이지) - 마감항목 포함 O', async () => {
    const res = await request(app)
      .get('/api/study')
      .query({
        categoryCode: 101,
        frequency: FrequencyEnum.TWICE,
        weekday: 'mon,tue',
        location: LocationEnum.CAFE + ',' + LocationEnum.ELSE,
      });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();

    expect(studies[0]).toHaveProperty('categoryCode', 101);
    expect(studies[0]).toHaveProperty('frequency', FrequencyEnum.TWICE);
    expect(studies[0]).toHaveProperty('weekday', [
      WeekDayEnum.MON,
      WeekDayEnum.TUE,
    ]);
    expect(studies[0]).toHaveProperty('location', [
      LocationEnum.CAFE,
      LocationEnum.ELSE,
    ]);
    expect(studies[0].dueDate).not.toBeNull();
  });

  it('query를 포함한 요청을 받으면 필터링, 정렬, 페이지네이션을 거친 후 스터디 목록과 페이지 커서 반환(첫번째 페이지) - 마감항목 포함 X', async () => {
    const res = await request(app)
      .get('/api/study')
      .query({
        categoryCode: 101,
        frequency: FrequencyEnum.TWICE,
        weekday: 'mon,tue',
        location: LocationEnum.CAFE + ',' + LocationEnum.ELSE,
        hideCloseTag: 1,
      });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();

    expect(studies[0]).toHaveProperty('categoryCode', 101);
    expect(studies[0]).toHaveProperty('frequency', FrequencyEnum.TWICE);
    expect(studies[0]).toHaveProperty('weekday', [
      WeekDayEnum.MON,
      WeekDayEnum.TUE,
    ]);
    expect(studies[0]).toHaveProperty('location', [
      LocationEnum.CAFE,
      LocationEnum.ELSE,
    ]);
  });
});

describe('GET /api/study - 필터링', () => {
  it('복수 필터링 및 카테고리 필터링 적용 후 리스트 응답 - frequency', async () => {
    /* login */
    const loginRes = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    const cookies = loginRes.headers['set-cookie'];

    /* create study */
    await request(app)
      .post('/api/study')
      .set('Cookie', cookies)
      .send({
        title: 'study#1',
        studyAbout: 'about#1',
        weekday: [WeekDayEnum.FRI, WeekDayEnum.SAT, WeekDayEnum.SUN],
        frequency: FrequencyEnum.MORE,
        location: [LocationEnum.CAFE, LocationEnum.LIBRARY, LocationEnum.LOC1],
        capacity: 8,
        categoryCode: 101,
        dueDate: new Date(new Date().getTime() + 60 * 60 * 5),
      });
    await request(app)
      .post('/api/study')
      .set('Cookie', cookies)
      .send({
        title: 'study#2',
        studyAbout: 'about#2',
        weekday: [WeekDayEnum.MON, WeekDayEnum.WED, WeekDayEnum.FRI],
        frequency: FrequencyEnum.MORE,
        location: [LocationEnum.ELSE, LocationEnum.ROOM, LocationEnum.S_CAFE],
        capacity: 8,
        categoryCode: 102,
        dueDate: new Date(new Date().getTime() + 60 * 60 * 5),
      });
    await request(app)
      .post('/api/study')
      .set('Cookie', cookies)
      .send({
        title: 'study#3',
        studyAbout: 'about#3',
        weekday: [WeekDayEnum.THU, WeekDayEnum.SUN],
        frequency: FrequencyEnum.TWICE,
        location: [LocationEnum.ROOM, LocationEnum.LOC2],
        capacity: 8,
        categoryCode: 104,
        dueDate: new Date(new Date().getTime() + 60 * 60 * 5),
      });

    const res = await request(app).get('/api/study').query({
      frequency: FrequencyEnum.MORE,
      hideCloseTag: 1,
    });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();
    expect(studies[0]).toHaveProperty('frequency', FrequencyEnum.MORE);
  });

  it('복수 필터링 및 카테고리 필터링 적용 후 리스트 응답 - weekday', async () => {
    const res = await request(app).get('/api/study').query({
      weekday: 'mon,sun',
      hideCloseTag: 1,
    });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();
    // expect(studies[0].weekday).toEqual(
    //   expect.arrayContaining([WeekDayEnum.MON, WeekDayEnum.SUN])
    // );
  });

  it('복수 필터링 및 카테고리 필터링 적용 후 리스트 응답 - location', async () => {
    const res = await request(app).get('/api/study').query({
      location: 'room,else',
      hideCloseTag: 1,
    });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();
    // expect(studies[0].location).toEqual(
    //   expect.arrayContaining([LocationEnum.ROOM, LocationEnum.ELSE])
    // );
  });

  it('복수 필터링 및 카테고리 필터링 적용 후 리스트 응답 - 상위 카테고리', async () => {
    const res = await request(app).get('/api/study').query({
      categoryCode: 100,
      hideCloseTag: 1,
    });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();
    expect(total).toBe(4);
  });

  it('복수 필터링 및 카테고리 필터링 적용 후 리스트 응답 - 하위 카테고리', async () => {
    const res = await request(app).get('/api/study').query({
      categoryCode: 104,
      hideCloseTag: 1,
    });
    const { studies, pageNo, pages, total } = res.body;

    expect(res.status).toBe(200);
    expect(studies).not.toBeNull();
    expect(pageNo).not.toBeNull();
    expect(pages).not.toBeNull();
    expect(total).not.toBeNull();
    expect(studies[0]).toHaveProperty('categoryCode', 104);
  });
});

describe('GET /api/study/:studyid', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];

    // bookmark
    await request(app)
      .post(`/api/study/${studyid}/bookmark`)
      .set('Cookie', cookies)
      .send();

    // apply
    await request(app)
      .post(`/api/study/${studyid}/user`)
      .set('Cookie', cookies)
      .send({ tempBio: 'hello' });
  });

  it('각 studyid에 따라 모든 스터디 상세 정보 반환 (로그인O)', async () => {
    const res = await request(app)
      .get(`/api/study/${studyid}`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(res.body).toHaveProperty('id', studyid);
    expect(res.body.bookmarked).toBeTruthy();
    expect(res.body.applied).toBeTruthy();
  });

  it('각 studyid에 따라 모든 스터디 상세 정보 반환 (로그인X)', async () => {
    const res = await request(app).get(`/api/study/${studyid}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toBeNull();
    expect(res.body).toHaveProperty('id', studyid);
    expect(res.body.bookmarked).toBeFalsy();
    expect(res.body.applied).toBeFalsy();
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app).get('/api/study/wrong');

    expect(res.status).toBe(404);
  });

  afterEach(async () => {
    await getRepository(StudyUser).createQueryBuilder().delete().execute();
  });
});

describe('PATCH /api/study/:studyid', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('body를 포함한 요청을 받으면 studyid에 해당하는 스터디 업데이트', async () => {
    const date = new Date();
    const res = await request(app)
      .patch(`/api/study/${studyid}`)
      .set('Cookie', cookies)
      .send({
        title: 'STUDY TITLE',
        studyAbout: 'STUDY ABOUT',
        weekday: [WeekDayEnum.WED, WeekDayEnum.THU],
        frequency: FrequencyEnum.MORE,
        location: [LocationEnum.LIBRARY, LocationEnum.NO_CONTACT],
        capacity: 10,
        categoryCode: 102,
        dueDate: new Date(date.getTime() + 60 * 60 * 7),
      });

    expect(res.status).toBe(200);
  });

  it('유효하지 않은 body를 포함한 요청을 받으면 400 응답', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyid}`)
      .set('Cookie', cookies)
      .send({ createdAt: 'abcd', title: 'asdf' });

    expect(res.status).toBe(400);
  });

  it('body를 포함하지 않은 요청을 받으면 400 응답', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyid}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(400);
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const date = new Date();
    const res = await request(app)
      .patch(`/api/study/${studyid}`)
      .send({
        title: 'STUDY TITLE',
        studyAbout: 'STUDY ABOUT',
        weekday: [WeekDayEnum.WED, WeekDayEnum.THU],
        frequency: FrequencyEnum.MORE,
        location: [LocationEnum.LIBRARY, LocationEnum.NO_CONTACT],
        capacity: 10,
        categoryCode: 102,
        dueDate: new Date(date.getTime() + 60 * 60 * 7),
      });

    expect(res.status).toBe(401);
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const date = new Date();
    const res = await request(app)
      .patch('/api/study/wrong')
      .set('Cookie', cookies)
      .send({
        title: 'STUDY TITLE',
        studyAbout: 'STUDY ABOUT',
        weekday: [WeekDayEnum.WED, WeekDayEnum.THU],
        frequency: FrequencyEnum.MORE,
        location: [LocationEnum.LIBRARY, LocationEnum.NO_CONTACT],
        capacity: 10,
        categoryCode: 102,
        dueDate: new Date(date.getTime() + 60 * 60 * 7),
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/study/:studyid', () => {
  let cookies = '';
  beforeEach(async () => {
    // login
    const res = await request(app).post('/api/user/login').send({
      email: 'test@gmail.com',
      password: 'test',
    });
    cookies = res.headers['set-cookie'];
  });

  it('요청된 studyid가 데이터베이스에 존재하지 않으면 404 응답', async () => {
    const res = await request(app)
      .delete('/api/study/wrong')
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(404);
  });

  it('로그인이 되어있지 않은 경우 401 응답', async () => {
    const res = await request(app).delete(`/api/study/${studyid}`).send();

    expect(res.status).toBe(401);
  });

  it('요청된 studyid에 해당하는 스터디 삭제', async () => {
    const res = await request(app)
      .delete(`/api/study/${studyid}`)
      .set('Cookie', cookies)
      .send();

    expect(res.status).toBe(200);
  });
});
