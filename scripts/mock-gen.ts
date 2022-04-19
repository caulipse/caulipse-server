import dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { createConnection } from 'typeorm';
import Study, {
  FrequencyEnum,
  LocationEnum,
  WeekDayEnum,
} from '../src/entity/StudyEntity';
import StudyUser from '../src/entity/StudyUserEntity';
import User, { UserRoleEnum } from '../src/entity/UserEntity';
import Notification from '../src/entity/NotificationEntity';
import Notice from '../src/entity/NoticeEntity';
import UserProfile from '../src/entity/UserProfileEntity';
import Comment from '../src/entity/CommentEntity';

/******************************************************************************
 * Util functions
 ******************************************************************************/
function rand(from: number, to: number): number {
  // from 포함 to 미포함
  if (from > to) throw new Error('from should be smaller than to');
  const range = to - from;
  return Math.floor(from + Math.random() * range);
}

function pickTrueOrFalse(truthiness = 0.5): boolean {
  return Math.random() > 1 - truthiness;
}

function pickRandomArrayValue<T>(arraylike: T[]): T {
  const idx = rand(0, arraylike.length);
  return arraylike[idx];
}

function pickRandomEnumValue<T>(enumlike: T): T[keyof T] {
  const entries = Object.entries(enumlike);
  const idx = rand(0, entries.length);
  return entries[idx][1];
}

function getRandomDate(): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = pickRandomArrayValue([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const d = pickRandomArrayValue(
    Array(28)
      .fill(0)
      .map((_, i) => i + 1)
  );
  return new Date(y, m, d);
}

/******************************************************************************
 * User table
 ******************************************************************************/
function makeUser(idx: number): User {
  const user = new User();
  user.id = randomUUID();
  user.email = `userno${idx}@cau.ac.kr`;
  user.password = bcrypt.hashSync(`password${idx}`, 10);
  user.token = '';
  user.role = UserRoleEnum.USER;
  user.isLogout = false;
  return user;
}

const users = Array(50)
  .fill(0)
  .map((_, i) => makeUser(i));

/******************************************************************************
 * UserProfile table
 ******************************************************************************/
function makeUserProfile(idx: number, user: User): UserProfile {
  const userProfile = new UserProfile();
  userProfile.id = user;
  userProfile.userName = `username#${idx}`;
  userProfile.dept = `user#${idx}'s dept`;
  userProfile.grade = pickRandomArrayValue([1, 2, 3, 4, 5]);
  userProfile.bio = `user#${idx}'s bio`;
  userProfile.userAbout = `user#${idx}'s about`;
  userProfile.showDept = pickTrueOrFalse(0.9);
  userProfile.showGrade = pickTrueOrFalse(0.9);
  userProfile.onBreak = pickTrueOrFalse(0.05);
  userProfile.categories = [''];
  userProfile.link1 = `user#${idx}'s link1`;
  userProfile.link2 = `user#${idx}'s link2`;
  userProfile.link3 = `user#${idx}'s link3`;
  userProfile.image = `user#${idx}'s image`;
  return userProfile;
}

const userProfiles = users.map((user, i) => makeUserProfile(i, user));

/******************************************************************************
 * Study table
 ******************************************************************************/
function makeStudy(idx: number, host: User): Study {
  const bookmarks = Array<User>();
  const bookmarkCount = rand(2, 30);
  for (let i = 0; bookmarks.length < bookmarkCount; i++) {
    const user = pickRandomArrayValue(users);
    if (bookmarks.includes(user) || host === user) continue;
    bookmarks.push(user);
  }
  const study = new Study();
  study.id = randomUUID();
  study.createdAt = getRandomDate();
  study.title = `study#${idx}`;
  study.studyAbout = `study abount #${idx}`;
  study.weekday = pickRandomEnumValue(WeekDayEnum);
  study.frequency = pickRandomEnumValue(FrequencyEnum);
  study.location = pickRandomEnumValue(LocationEnum);
  study.hostId = host;
  study.capacity = rand(5, 11);
  study.membersCount = rand(1, 11);
  study.vacancy = study.capacity - study.membersCount;
  study.isOpen = pickTrueOrFalse(0.75);
  study.categoryCode = pickRandomArrayValue([101, 102, 103, 104, 105]);
  study.views = rand(0, 200);
  study.bookmarkCount = bookmarkCount;
  study.bookmarks = bookmarks;
  study.dueDate = getRandomDate();
  return study;
}

const studies = Array(50)
  .fill(0)
  .map((_, i) => makeStudy(i, pickRandomArrayValue(users)));

/******************************************************************************
 * StudyUser table
 ******************************************************************************/
function makeStudyUser(idx: number, study: Study, user: User): StudyUser {
  const studyUser = new StudyUser();
  studyUser.user = user;
  studyUser.study = study;
  studyUser.isAccepted = false;
  studyUser.tempBio = `hello i'm User#${user.id}, applying study ${study.title}`;
  return studyUser;
}

const studyUsers = Array<StudyUser>();
for (let i = 0; studyUsers.length < 75; i++) {
  const user = pickRandomArrayValue(users);
  const study = pickRandomArrayValue(studies);
  const duplicate = (item: StudyUser) =>
    item.user.id === user.id && item.study.id === study.id;

  if (studyUsers.some(duplicate)) continue;
  studyUsers.push(makeStudyUser(i, study, user));
}

/******************************************************************************
 * Notice table
 ******************************************************************************/
function makeNotice(idx: number, user: User): Notice {
  const notice = new Notice();
  notice.id = randomUUID();
  notice.title = `notice #${idx}`;
  notice.about = `this is notice number ${idx}'s content`;
  notice.createdAt = getRandomDate();
  notice.views = rand(0, 100);
  notice.hostId = user;
  return notice;
}

const admins = users.filter((user) => user.role === UserRoleEnum.ADMIN);
const notices = Array(30)
  .fill(0)
  .map((_, i) => makeNotice(i, pickRandomArrayValue(admins)));

/******************************************************************************
 * Comment table
 ******************************************************************************/
function makeComment(idx: number, study: Study, user: User): Comment {
  const comment = new Comment();
  comment.id = randomUUID();
  comment.createdAt = getRandomDate();
  comment.isNested = pickTrueOrFalse(0.1);
  comment.content = `comment #${idx}`;
  comment.user = user;
  comment.study = study;
  comment.metooCount = rand(0, 20);
  return comment;
}

const comments = Array<Comment>();
for (let i = 0; comments.length < 100; i++) {
  const user = pickRandomArrayValue(users);
  const study = pickRandomArrayValue(studies);
  const duplicate = (item: Comment) =>
    item.user?.id === user.id && item.study.id === study.id;

  if (comments.some(duplicate)) continue;
  comments.push(makeComment(i, study, user));
}

/******************************************************************************
 * Notification table
 ******************************************************************************/
function makeNotification(idx: number, study: Study, user: User): Notification {
  const notification = new Notification();
  notification.id = randomUUID();
  notification.user = user;
  notification.study = study;
  notification.notice = null;
  notification.type = pickRandomArrayValue([101, 102]);
  notification.title = `notice #${idx}`;
  notification.notiAbout = `notice #${idx}'s content`;
  notification.read = false;
  notification.createdAt = getRandomDate();
  return notification;
}

const notifications = Array<Notification>();
for (let i = 0; notifications.length < 100; i++) {
  const user = pickRandomArrayValue(users);
  const study = pickRandomArrayValue(studies);
  const duplicate = (item: Notification) =>
    item.user?.id === user.id && item.study?.id === study.id;

  if (notifications.some(duplicate)) continue;
  notifications.push(makeNotification(i, study, user));
}

(async () => {
  /****************************************************************************
   * Init
   ****************************************************************************/
  process.stdout.write('opening connection...');
  const conn = await createConnection({
    type: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true,
    entities: [`${__dirname}/../src/entity/*.{ts,js}`],
  });
  console.log('DONE!');

  /****************************************************************************
   * User table
   ****************************************************************************/
  process.stdout.write('saving User data...');
  await conn
    .getRepository(User)
    .createQueryBuilder()
    .insert()
    .values([
      // admin #1
      {
        id: '28464dc7-7537-4b91-9d52-764b6de32122',
        email: 'testadmin1@cau.ac.kr',
        password:
          '$2b$10$18n8DFDZ1QUrhBlf9CDr6O8LiN7cjIRAFX37HfK.SpnyJg1y7c.5K',
        token: '',
        role: UserRoleEnum.ADMIN,
        isLogout: false,
      },
      // admin #2
      {
        id: 'dea61890-363d-4574-8ad1-ef1fa6fe66db',
        email: 'testadmin2@cau.ac.kr',
        password:
          '$2b$10$jsUh3x5kvMfBECfEoiq15.hRnhtrVLRCid2d2r8tMQTtCa6ILNr/u',
        token: '',
        role: UserRoleEnum.ADMIN,
        isLogout: false,
      },
      // user #1
      {
        id: '9b083624-9475-4ad2-b5c0-eb40c98411c2',
        email: 'testuser1@cau.ac.kr',
        password:
          '$2b$10$xtp6zwK8.0FqRrq4okZRXOcTkH9oCXhA8X02NJaAXgPockMw9ZFWi',
        token: '',
        role: UserRoleEnum.USER,
        isLogout: false,
      },
      // user #2
      {
        id: 'ec7283be-d2e5-4b39-b723-1cfa000a9303',
        email: 'testuser2@cau.ac.kr',
        password:
          '$2b$10$Ls2oCM/bHbss5S18VyWgB.R2jet9xdATWFU8ZdNXZ3JR7PjAoXdwy',
        token: '',
        role: UserRoleEnum.USER,
        isLogout: false,
      },
      // guest #1
      {
        id: 'cd915b33-d4c3-4379-b5c1-fe8d389b0de7',
        email: 'testguest1@cau.ac.kr',
        password:
          '$2b$10$f69XmMM3DPKDs91.6qgmOebP/bfrdKcCQNQG/ldl71GXet3BYBjEq',
        token: '',
        role: UserRoleEnum.GUEST,
        isLogout: false,
      },
      // guest #2
      {
        id: '492a437d-14ca-4e15-9347-0748ba14e269',
        email: 'testguest2@cau.ac.kr',
        password:
          '$2b$10$sGJji6iVcZc/JJTq/cpFcukB3YXwUSbsygBFmKVJvw6QRmhpVPV0m',
        token: '',
        role: UserRoleEnum.GUEST,
        isLogout: false,
      },
      ...users,
    ])
    .execute();
  console.log('DONE!');

  /****************************************************************************
   * UserProfile table
   ****************************************************************************/
  process.stdout.write('saving UserProfile data...');
  await conn
    .getRepository(UserProfile)
    .createQueryBuilder()
    .insert()
    .values(userProfiles)
    .execute();
  console.log('DONE!');

  /****************************************************************************
   * Study table
   ****************************************************************************/
  process.stdout.write('saving Study data...');
  await conn
    .getRepository(Study)
    .createQueryBuilder()
    .insert()
    .values(studies)
    .execute();
  console.log('DONE!');

  /****************************************************************************
   * StudyUser table
   ****************************************************************************/
  process.stdout.write('saving StudyUser data...');
  await conn
    .getRepository(StudyUser)
    .createQueryBuilder()
    .insert()
    .values(studyUsers)
    .execute();
  console.log('DONE!');

  /****************************************************************************
   * Notice table
   ****************************************************************************/
  process.stdout.write('saving Notice data...');
  await conn
    .getRepository(Notice)
    .createQueryBuilder()
    .insert()
    .values(notices)
    .execute();
  console.log('DONE!');

  /****************************************************************************
   * Comment table
   ****************************************************************************/
  process.stdout.write('saving Comment data...');
  await conn
    .getRepository(Comment)
    .createQueryBuilder()
    .insert()
    .values(comments)
    .execute();
  console.log('DONE!');

  /****************************************************************************
   * Notification table
   ****************************************************************************/
  process.stdout.write('saving Notification data...');
  await conn
    .getRepository(Notification)
    .createQueryBuilder()
    .insert()
    .values(notifications)
    .execute();
  console.log('DONE!');

  await conn.close();
})();
