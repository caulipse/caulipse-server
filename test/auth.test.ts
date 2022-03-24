import { randomUUID } from 'crypto';
import request from 'supertest';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import app from '../src';
import { db } from '../src/config/db';
import User from '../src/entity/UserEntity';
import { saveUser } from '../src/services/user';

let conn: Connection;
let cookies: string[];

beforeAll(async () => {
  conn = await createConnection({
    ...db,
    database: process.env.DB_DATABASE_TEST,
  } as ConnectionOptions);

  const email = 'example@test.com';
  const password = 'test';

  saveUser({ id: randomUUID(), email, password, token: '' });
  const res = await request(app)
    .post('/api/user/login')
    .send({ email, password });
  cookies = res.headers['set-cookie'];
});

afterAll(async () => {
  await conn.getRepository(User).createQueryBuilder().delete().execute();
  conn.close();
});

describe('인증 미들웨어', () => {
  test('쿠키가 포함되지 않은 요청을 보내면 401코드로 응답한다', async () => {
    const res = await request(app).post('/api/user/notification').send();
    expect(res.statusCode).toBe(401);
  });

  test('올바른 쿠키가 포함된 요청을 보내면 200코드로 응답한다', async () => {
    const res = await request(app)
      .get('/api/user/notification') // FIXME: notification api 구현 후 수정
      .set('Cookie', cookies)
      .send();
    expect(res.statusCode).toBe(200);
  });
});
