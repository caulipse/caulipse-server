import app from '../src';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { db } from '../src/config/db';
import { saveUser } from '../src/services/user';
import User from '../src/entity/UserEntity';
import { makeSignUpToken } from '../src/utils/auth';

let conn: Connection;
let newToken: string;
const initialToken = '';
const email = 'example@cau.ac.kr';
const password = 'test';

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  saveUser({ id: randomUUID(), email, password, token: initialToken });
});

afterAll(async () => {
  await conn.getRepository(User).createQueryBuilder().delete().execute();
  conn.close();
});

describe('비밀번호 재설정 요청 api', () => {
  test('요청 body에 포탈 id를 포함시키지 않으면 400 코드로 응답한다', async () => {
    const res = await request(app)
      .patch('/api/user/password')
      .send({ data: 'asdf' });
    expect(res.statusCode).toBe(400);
  });

  test('가입되지 않은 portalId를 body에 포함시켜 요청을 보내면 404 코드로 응답한다', async () => {
    const res = await request(app)
      .patch('/api/user/password')
      .send({ portalId: 'falsyportalid' });
    expect(res.statusCode).toBe(404);
  });

  test('정상적인 요청을 보내면 데이터베이스의 token 필드를 갱신하고 200 코드로 응답한다', async () => {
    const res = await request(app)
      .patch('/api/user/password')
      .send({ portalId: 'example' });

    const updatedUser = await conn
      .getRepository(User)
      .createQueryBuilder()
      .select()
      .where('EMAIL = :email', { email })
      .execute();
    newToken = updatedUser.token;

    expect(res.statusCode).toBe(200);
    expect(newToken).not.toBe(initialToken);
  });
});

describe('비밀번호 재설정 마무리 api', () => {
  test('요청 body에 이메일 또는 패스워드가 포함되지 않을 시 400 코드로 응답한다', async () => {
    const res = await request(app)
      .patch(`/api/user/${newToken}/password`)
      .send({ field: false });
    expect(res.statusCode).toBe(400);
  });

  test('데이터베이스에 존재하지 않는 토큰을 요청에 포함할 시 403 코드로 응답한다', async () => {
    const invalidToken = 'askdfjosadjfokjo';
    const res = await request(app)
      .patch(`/api/user/${invalidToken}/password`)
      .send({ email, password: 'asdf' });
    expect(res.statusCode).toBe(404);
  });

  test('올바른 요청일 경우 사용자의 비밀번호를 전달된 비밀번호로 업데이트한다', async () => {
    const newPassword = 'updated';
    const id = randomUUID();
    const token = makeSignUpToken(id);
    const email2 = 'asdf@cau.ac.kr';

    await conn
      .getRepository(User)
      .createQueryBuilder()
      .insert()
      .values({
        id: id,
        email: email2,
        password: 'test',
        isLogout: false,
        token,
      })
      .execute();
    const res = await request(app)
      .patch(`/api/user/${token}/password`)
      .send({ email: email2, password: newPassword });
    const updatedUser = await conn
      .getRepository(User)
      .createQueryBuilder()
      .select()
      .where('ID = :id', { id })
      .getOne();

    expect(res.statusCode).toBe(200);
    expect(updatedUser?.password).toBe(newPassword);
  });
});
