import { ConnectionOptions } from 'typeorm';

export const db: ConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  entities: [`${__dirname}/../entity/*.{ts,js}`],
};
