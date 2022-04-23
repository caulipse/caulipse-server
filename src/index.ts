import express from 'express';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
dotenv.config();
import swaggerUI from 'swagger-ui-express';
import swaggerOption from './config/swagger';
import swaggerJSDoc from 'swagger-jsdoc';
import { db } from './config/db';
import rootRouter from './routes';
import cors from 'cors';

const swaggerSpec = swaggerJSDoc(swaggerOption);
const PORT = process.env.PORT || 3000;

const app = express();
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://caustudy.com',
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', rootRouter);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

if (process.env.NODE_ENV !== 'test') {
  createConnection(db)
    .then(() => {
      app.listen(PORT, () => console.log('listening'));
    })
    .catch((err) => {
      console.log(err);
    });
}

export default app;
