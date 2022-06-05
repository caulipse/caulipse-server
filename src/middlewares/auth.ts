import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import User from '../entity/UserEntity';

export const generateToken = (payload: Record<string, string>): string => {
  const token = jwt.sign(payload, process.env.SIGNUP_TOKEN_SECRET as string, {
    algorithm: 'HS256',
    expiresIn: '3h',
  });
  return token;
};

// 실행시 새로운 액세스 토큰을 만들어 반환
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new Error('리프레시 토큰 없음');

    const decoded = jwt.verify(
      refreshToken,
      process.env.SIGNUP_TOKEN_SECRET as string
    ) as { id: string; email: string };

    const user = await getRepository(User).findOne({ id: decoded.id });
    if (user?.id !== decoded.id) throw new Error('id 값 오류');
    if (user?.isLogout) throw new Error('이미 로그아웃 한 유저');

    const newAccessToken = generateToken({ id: decoded.id });

    const hour = 3600 * 1000;
    res.cookie('accessToken', newAccessToken, {
      expires: new Date(Date.now() + 3 * hour),
      domain: 'caustudy.com',
      sameSite: 'none',
      secure: true,
    });
  } catch (e) {
    res.status(403).json({ message: (e as Error).message });
  }
};

// 요청의 쿠키에 토큰이 없다면 401 응답
export const checkToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken && !refreshToken) {
    res.status(401).json({ message: '로그인이 필요한 서비스입니다' });
    return;
  }

  if (!accessToken && refreshToken) {
    await refresh(req, res);
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.SIGNUP_TOKEN_SECRET as string
      ) as { id: string };
      req.user = { id: decoded.id };
      next();
    } catch (e) {
      res.status(401).json({ message: (e as Error).message });
    }
    return;
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.SIGNUP_TOKEN_SECRET as string
    ) as { id: string };
    req.user = { id: decoded.id };

    next();
  } catch (e) {
    res.status(401).json({ message: (e as Error).message });
  }
};
