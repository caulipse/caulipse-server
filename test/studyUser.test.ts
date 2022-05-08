import { randomUUID } from 'crypto';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import app from '../src';
import { db } from '../src/config/db';
import Study, {
  FrequencyEnum,
  LocationEnum,
  WeekDayEnum,
} from '../src/entity/StudyEntity';
import StudyUser from '../src/entity/StudyUserEntity';
import User, { UserRoleEnum } from '../src/entity/UserEntity';
import { saveStudyUserRecord } from '../src/services/studyUser';
import UserProfile from '../src/entity/UserProfileEntity';

let conn: Connection;
let mockHost: User;
let mockUser1: User;
let mockUser2: User;
let mockHostProfile: UserProfile;
let mockProfile1: UserProfile;
let mockProfile2: UserProfile;
const studyId = randomUUID();

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  mockHost = new User();
  mockHost.id = randomUUID();
  mockHost.email = 'mockhost@test.com';
  mockHost.password = bcrypt.hashSync('testpassword', 10);
  mockHost.isLogout = false;
  mockHost.token = '';
  await conn.getRepository(User).save(mockHost);

  mockHostProfile = new UserProfile();
  mockHostProfile.id = mockHost;
  mockHostProfile.email = mockHost.email;
  mockHostProfile.userName = 'host';
  mockHostProfile.dept = 'dept';
  mockHostProfile.grade = 1;
  mockHostProfile.bio = 'bio';
  mockHostProfile.userAbout = 'about';
  mockHostProfile.showDept = false;
  mockHostProfile.showGrade = false;
  mockHostProfile.onBreak = false;
  mockHostProfile.categories = ['100'];
  mockHostProfile.link1 = 'user_link1';
  mockHostProfile.link2 = 'user_link2';
  mockHostProfile.link3 = 'user_link3';
  mockHostProfile.image = 'image';
  await conn.getRepository(UserProfile).save(mockHostProfile);

  mockUser1 = new User();
  mockUser1.id = randomUUID();
  mockUser1.email = 'mockuser1@test.com';
  mockUser1.password = bcrypt.hashSync('testpassword', 10);
  mockUser1.isLogout = false;
  mockUser1.token = '';
  await conn.getRepository(User).save(mockUser1);

  mockProfile1 = new UserProfile();
  mockProfile1.id = mockUser1;
  mockProfile1.email = mockUser1.email;
  mockProfile1.userName = 'user1';
  mockProfile1.dept = 'dept';
  mockProfile1.grade = 1;
  mockProfile1.bio = 'bio';
  mockProfile1.userAbout = 'about';
  mockProfile1.showDept = false;
  mockProfile1.showGrade = false;
  mockProfile1.onBreak = false;
  mockProfile1.categories = ['100'];
  mockProfile1.link1 = 'user_link1';
  mockProfile1.link2 = 'user_link2';
  mockProfile1.link3 = 'user_link3';
  mockProfile1.image = 'image';
  await conn.getRepository(UserProfile).save(mockProfile1);

  mockUser2 = new User();
  mockUser2.id = randomUUID();
  mockUser2.email = 'mockuser2@test.com';
  mockUser2.password = bcrypt.hashSync('testpassword', 10);
  mockUser2.isLogout = false;
  mockUser2.token = '';
  await conn.getRepository(User).save(mockUser2);

  mockProfile2 = new UserProfile();
  mockProfile2.id = mockUser2;
  mockProfile2.email = mockUser2.email;
  mockProfile2.userName = 'user2';
  mockProfile2.dept = 'dept';
  mockProfile2.grade = 1;
  mockProfile2.bio = 'bio';
  mockProfile2.userAbout = 'about';
  mockProfile2.showDept = false;
  mockProfile2.showGrade = false;
  mockProfile2.onBreak = false;
  mockProfile2.categories = ['100'];
  mockProfile2.link1 = 'user_link1';
  mockProfile2.link2 = 'user_link2';
  mockProfile2.link3 = 'user_link3';
  mockProfile2.image = 'image';
  await conn.getRepository(UserProfile).save(mockProfile2);

  const mockStudy = new Study();
  const date = new Date();
  mockStudy.id = studyId;
  mockStudy.title = 'STUDY TITLE';
  mockStudy.studyAbout = 'STUDY ABOUT';
  mockStudy.weekday = [WeekDayEnum.MON, WeekDayEnum.TUE];
  mockStudy.frequency = FrequencyEnum.MORE;
  mockStudy.location = [LocationEnum.LIBRARY, LocationEnum.NO_CONTACT];
  mockStudy.capacity = 10;
  mockStudy.hostId = mockHostProfile;
  mockStudy.categoryCode = 100;
  mockStudy.membersCount = 0;
  mockStudy.vacancy = 10;
  mockStudy.isOpen = true;
  mockStudy.views = 0;
  mockStudy.bookmarkCount = 0;
  mockStudy.dueDate = new Date(date.getTime() + 60 * 60 * 5);

  await conn.getRepository(Study).save(mockStudy);
});

afterAll(async () => {
  await conn.getRepository(StudyUser).createQueryBuilder().delete().execute();
  await conn.getRepository(Study).createQueryBuilder().delete().execute();
  await conn.getRepository(UserProfile).createQueryBuilder().delete().execute();
  await conn.getRepository(User).createQueryBuilder().delete().execute();
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
    await conn.getRepository(UserProfile).save({
      USER_ID: userId,
      email: 'testtt@example.com',
      userName: 'test1',
      dept: 'test1',
      grade: 2,
      bio: 'test1',
      userAbout: 'test1',
      showDept: false,
      showGrade: false,
      onBreak: false,
      categories: ['100'],
      link1: 'test1',
      link2: 'test1',
      link3: 'test1',
      image: 'test1',
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
    await conn.getRepository(UserProfile).save({
      USER_ID: userId,
      email,
      userName: 'test2',
      dept: 'test2',
      grade: 2,
      bio: 'test2',
      userAbout: 'test2',
      showDept: false,
      showGrade: false,
      onBreak: false,
      categories: ['100'],
      link1: 'test2',
      link2: 'test2',
      link3: 'test2',
      image: 'test2',
    });
    const tempBio = 'adjsfojasdof';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .post(`/api/study/${studyId}/user`)
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
    await conn.getRepository(UserProfile).save({
      USER_ID: userId,
      email,
      userName: 'test2',
      dept: 'test2',
      grade: 2,
      bio: 'test2',
      userAbout: 'test2',
      showDept: false,
      showGrade: false,
      onBreak: false,
      categories: ['100'],
      link1: 'test2',
      link2: 'test2',
      link3: 'test2',
      image: 'test2',
    });
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .post(`/api/study/${studyId}/user`)
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
    await conn.getRepository(UserProfile).save({
      USER_ID: userId,
      email,
      userName: 'test2',
      dept: 'test2',
      grade: 2,
      bio: 'test2',
      userAbout: 'test2',
      showDept: false,
      showGrade: false,
      onBreak: false,
      categories: ['100'],
      link1: 'test2',
      link2: 'test2',
      link3: 'test2',
      image: 'test2',
    });
    const tempBio = 'adjsfojasdofsadf';

    // when
    const res = await request(app)
      .post(`/api/study/${studyId}/user`)
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
    await conn.getRepository(UserProfile).save({
      USER_ID: userId,
      email,
      userName: 'test2',
      dept: 'test2',
      grade: 2,
      bio: 'test2',
      userAbout: 'test2',
      showDept: false,
      showGrade: false,
      onBreak: false,
      categories: ['100'],
      link1: 'test2',
      link2: 'test2',
      link3: 'test2',
      image: 'test2',
    });
    const tempBio = 'adjsfojasdof';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongStudyId = '123423434234244324123';

    // when
    const res = await request(app)
      .post(`/api/study/${wrongStudyId}/user`)
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

describe('참가신청 수락대기중인 사용자 목록 조회 api', () => {
  const email = 'qwernm@test.com';
  const password = 'testpassword';
  const userId = randomUUID();

  test('로그인 하지 않았을 경우 401 코드로 응답한다', async () => {
    const res = await request(app).get(`/api/study/${studyId}/user`);
    expect(res.statusCode).toBe(401);
  });

  test('올바르지 않은 스터디 id로 요청을 보내면 404 코드로 응답한다', async () => {
    // given
    await conn.getRepository(User).save({
      id: userId,
      email,
      password: bcrypt.hashSync(password, 10),
      isLogout: false,
      token: '',
    });
    await conn.getRepository(UserProfile).save({
      USER_ID: userId,
      email,
      userName: 'test3',
      dept: 'test3',
      grade: 2,
      bio: 'test3',
      userAbout: 'test3',
      showDept: false,
      showGrade: false,
      onBreak: false,
      categories: ['100'],
      link1: 'test3',
      link2: 'test3',
      link3: 'test3',
      image: 'test3',
    });
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongStudyId = 'asdjfalksdj';

    const res = await request(app)
      .get(`/api/study/${wrongStudyId}/user`)
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(404);
  });

  test('자신이 소유하지 않은 스터디에 대한 참가신청 수락대기중 인원 현황을 요청하면 403 코드로 응답한다', async () => {
    // given
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .get(`/api/study/${studyId}/user`)
      .set('Cookie', cookies);

    // then
    expect(res.statusCode).toBe(403);
  });

  test('자신이 소유한 스터디에 대한 참가신청 수락대기 현황을 요청하면 200 코드로 응답한다', async () => {
    // given
    const newUserEmail = 'asodfjaod@test.com';
    const newUserPassword = 'testPassword';
    const newUser = new User();
    newUser.id = userId;
    newUser.email = newUserEmail;
    newUser.password = bcrypt.hashSync(newUserPassword, 10);
    newUser.token = '';
    newUser.isLogout = false;
    newUser.role = UserRoleEnum.USER;
    await conn.getRepository(User).save(newUser);

    const newProfile = new UserProfile();
    newProfile.id = newUser;
    newProfile.email = newUser.email;
    newProfile.userName = 'test4';
    newProfile.dept = 'dept';
    newProfile.grade = 1;
    newProfile.bio = 'bio';
    newProfile.userAbout = 'about';
    newProfile.showDept = false;
    newProfile.showGrade = false;
    newProfile.onBreak = false;
    newProfile.categories = ['100'];
    newProfile.link1 = 'user_link1';
    newProfile.link2 = 'user_link2';
    newProfile.link3 = 'user_link3';
    newProfile.image = 'image';
    await conn.getRepository(UserProfile).save(newProfile);

    const myStudyId = randomUUID();
    const date = new Date();
    await conn
      .getRepository(Study)
      .createQueryBuilder()
      .insert()
      .values({
        id: myStudyId,
        title: 'STUDY TITLE',
        studyAbout: 'STUDY ABOUT',
        weekday: [WeekDayEnum.MON, WeekDayEnum.TUE],
        frequency: FrequencyEnum.MORE,
        location: [LocationEnum.LIBRARY, LocationEnum.NO_CONTACT],
        capacity: 10,
        hostId: newProfile,
        categoryCode: 100,
        membersCount: 10,
        vacancy: 10,
        isOpen: true,
        views: 0,
        bookmarkCount: 0,
        dueDate: new Date(date.getTime() + 60 * 60 * 5).toString(),
      })
      .execute();

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: newUserEmail, password: newUserPassword });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .get(`/api/study/${myStudyId}/user`)
      .set('Cookie', cookies);

    // then
    expect(res.statusCode).toBe(200);
  });

  test('스터디 신청현황에 대한 정보를 반환한다', async () => {
    await conn.getRepository(StudyUser).delete({});
    await conn
      .getRepository(StudyUser)
      .createQueryBuilder()
      .insert()
      .values([
        {
          STUDY_ID: studyId,
          USER_ID: mockUser1.id,
          isAccepted: false,
          tempBio: '',
        },
      ])
      .execute();
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email: mockHost.email, password: 'testpassword' });
    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get(`/api/study/${studyId}/user`)
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].userId).toBe(mockUser1.id);
    expect(res.body[0].studyId).toBe(studyId);
  });
});

describe('참가인원 조회 api', () => {
  test('로그인하지 않아도 401 코드로 응답하지 않는다', async () => {
    const res = await request(app)
      .get(`/api/study/${studyId}/user/participants`)
      .send();
    expect(res.statusCode).not.toBe(401);
  });

  test('잘못된 스터디 id로 요청할 경우 404 코드로 응답한다', async () => {
    // given
    const wrongStudyId = 'asodjfoasjdf';

    // when
    const res = await request(app)
      .get(`/api/study/${wrongStudyId}/user/participants`)
      .send();

    // then
    expect(res.statusCode).toBe(404);
  });

  test('스터디 참가가 수락된 인원에 대한 정보를 반환한다', async () => {
    // given
    const study = new Study();
    const date = new Date();
    study.id = randomUUID();
    study.title = 'STUDY TITLE';
    study.studyAbout = 'STUDY ABOUT';
    study.weekday = [WeekDayEnum.MON, WeekDayEnum.TUE];
    study.frequency = FrequencyEnum.MORE;
    study.location = [LocationEnum.LIBRARY, LocationEnum.NO_CONTACT];
    study.capacity = 10;
    study.hostId = mockHostProfile;
    study.categoryCode = 100;
    study.membersCount = 10;
    study.vacancy = 10;
    study.isOpen = true;
    study.views = 0;
    study.bookmarkCount = 0;
    study.dueDate = new Date(date.getTime() + 60 * 60 * 5);
    await conn.getRepository(Study).save(study);

    // when
    const res = await request(app)
      .get(`/api/study/${study.id}/user/participants`)
      .send();

    // then
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toEqual(0);
  });

  test('스터디 참가가 수락된 인원에 대한 정보를 반환한다', async () => {
    // given
    const user = new User();
    user.id = randomUUID();
    user.email = '';
    user.password = '';
    user.isLogout = false;
    user.role = UserRoleEnum.USER;
    user.token = '';
    await conn.getRepository(User).save(user);
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
    await conn.getRepository(UserProfile).save(profile);
    await conn
      .getRepository(StudyUser)
      .createQueryBuilder()
      .insert()
      .values({
        user: profile,
        STUDY_ID: studyId,
        isAccepted: true,
        tempBio: '',
      })
      .execute();

    // when
    const res = await request(app)
      .get(`/api/study/${studyId}/user/participants`)
      .send();

    // then
    expect(res.statusCode).toBe(200);
    expect(res.body.length).not.toEqual(0);
    expect(res.body[0].userId).toEqual(user.id);
  });
});

describe('참가신청 수락/거절 api', () => {
  test('로그인하지 않았을 경우 401 코드로 응답한다', async () => {
    const res = await request(app)
      .patch(`/api/study/${studyId}/user/accept`)
      .send();
    expect(res.statusCode).toBe(401);
  });

  test('유효하지 않은 request body로 요청을 보낼 경우 400 코드로 응답한다', async () => {
    // given
    const { email } = mockHost;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user/accept`)
      .set('Cookie', cookies)
      .send();

    // then
    expect(res.statusCode).toBe(400);
  });

  test('자신이 개설한 스터디가 아닐 경우 403 코드로 응답한다', async () => {
    // given
    const { email } = mockUser2;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user/accept`)
      .set('Cookie', cookies)
      .send({ accept: true, userId: mockUser1.id }); // README: 스터디 신청현황 테스트에서 mockUser1의 mockStudy에 대한 참가신청을 진행함

    // then
    expect(res.statusCode).toBe(403);
  });

  test('존재하지 않는 study id 에 대한 요청은 404 코드로 응답한다', async () => {
    // given
    const { email } = mockHost;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongStudyId = 'aslkdfjaldjkflasj';

    // when
    const res = await request(app)
      .patch(`/api/study/${wrongStudyId}/user/accept`)
      .set('Cookie', cookies)
      .send({ accept: true, userId: mockUser1.id }); // README: 스터디 신청현황 테스트에서 mockUser1의 mockStudy에 대한 참가신청을 진행함

    // then
    expect(res.statusCode).toBe(404);
  });

  test('스터디에 신청하지 않은 사용자에 대한 참가수락 요청은 404 코드로 응답한다', async () => {
    // given
    const { email } = mockHost;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user/accept`)
      .set('Cookie', cookies)
      .send({ accept: true, userId: mockUser2.id }); // README: 스터디 신청현황 테스트에서 mockUser1의 mockStudy에 대한 참가신청을 진행함

    // then
    expect(res.statusCode).toBe(404);
  });

  test('정상적인 요청의 경우 스터디 신청 상태를 업데이트한다', async () => {
    // given
    const { email } = mockHost;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user/accept`)
      .set('Cookie', cookies)
      .send({ accept: true, userId: mockUser1.id }); // README: 스터디 신청현황 테스트에서 mockUser1의 mockStudy에 대한 참가신청을 진행함
    const record = await conn
      .getRepository(StudyUser)
      .createQueryBuilder()
      .select()
      .where('STUDY_ID = :id', { id: studyId })
      .andWhere('USER_ID = :userid', { userid: mockUser1.id })
      .getOne();

    // then
    expect(res.statusCode).toBe(200);
    expect(record?.isAccepted).toBe(true);
  });
});

describe('스터디 참가신청 수정 api', () => {
  test('로그인하지 않았을 경우 401 코드로 응답한다', async () => {
    const res = await request(app).patch(`/api/study/${studyId}/user`).send();
    expect(res.statusCode).toBe(401);
  });

  test('유효하지 않은 request body로 요청을 보낼 경우 400 코드로 응답한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user`)
      .set('Cookie', cookies)
      .send();

    // then
    expect(res.statusCode).toBe(400);
  });

  test('존재하지 않는 study id 에 대한 요청은 404 코드로 응답한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongStudyId = 'aslkdfjaldjkflasj';

    // when
    const res = await request(app)
      .patch(`/api/study/${wrongStudyId}/user`)
      .set('Cookie', cookies)
      .send({ tempBio: 'updatedTempBio' });

    // then
    expect(res.statusCode).toBe(404);
  });

  test('스터디에 신청하지 않은 사용자에 대한 신청현황 수정 요청은 404 코드로 응답한다', async () => {
    // given
    const { email } = mockUser2;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user`)
      .set('Cookie', cookies)
      .send({ tempBio: 'updatedTempBio' }); // README: 스터디 신청현황 테스트에서 mockUser1의 mockStudy에 대한 참가신청을 진행함

    // then
    expect(res.statusCode).toBe(404);
  });

  test('정상적인 요청의 경우 스터디 신청 상태를 업데이트한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const updatedTempBio = 'updated tempBio';

    // when
    const res = await request(app)
      .patch(`/api/study/${studyId}/user`)
      .set('Cookie', cookies)
      .send({ tempBio: updatedTempBio }); // README: 스터디 신청현황 테스트에서 mockUser1의 mockStudy에 대한 참가신청을 진행함
    const record = await conn
      .getRepository(StudyUser)
      .createQueryBuilder()
      .select()
      .where('STUDY_ID = :id', { id: studyId })
      .andWhere('USER_ID = :userid', { userid: mockUser1.id })
      .getOne();

    // then
    expect(res.statusCode).toBe(200);
    expect(record?.tempBio).toBe(updatedTempBio);
  });
});

describe('스터디 참가신청 취소 api', () => {
  test('로그인하지 않았을 경우 401 코드로 응답한다', async () => {
    const res = await request(app).delete(
      `/api/study/${studyId}/user/${mockUser1.id}`
    );
    expect(res.statusCode).toBe(401);
  });

  test('존재하지 않는 study id 에 대한 요청은 404 코드로 응답한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const wrongStudyId = 'aslkdfjaldjkflasj';

    // when
    const res = await request(app)
      .delete(`/api/study/${wrongStudyId}/user/${mockUser1.id}`)
      .set('Cookie', cookies);

    // then
    expect(res.statusCode).toBe(404);
  });

  test('스터디에 신청하지 않은 사용자의 참가신청 취소 요청은 404 코드로 응답한다', async () => {
    // given
    const { email } = mockUser2;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];

    // when
    const res = await request(app)
      .delete(`/api/study/${studyId}/user/${mockUser2.id}`)
      .set('Cookie', cookies);

    // then
    expect(res.statusCode).toBe(404);
  });

  test('정상적인 요청의 경우 스터디 신청 상태를 업데이트한다', async () => {
    // given
    const { email } = mockUser1;
    const password = 'testpassword';
    const loginRes = await request(app)
      .post('/api/user/login')
      .send({ email, password });
    const cookies = loginRes.headers['set-cookie'];
    const query = async () => {
      return await conn
        .getRepository(StudyUser)
        .createQueryBuilder()
        .select()
        .where('STUDY_ID = :id', { id: studyId })
        .andWhere('USER_ID = :userid', { userid: mockUser1.id })
        .getOne();
    };

    // when
    const before = await query();
    const res = await request(app)
      .delete(`/api/study/${studyId}/user/${mockUser1.id}`)
      .set('Cookie', cookies);
    const after = await query();

    // then
    expect(res.statusCode).toBe(200);
    expect(before).toBeTruthy();
    expect(after).toBeFalsy();
  });
});
