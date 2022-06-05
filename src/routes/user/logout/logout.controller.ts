import { Request, Response } from 'express';
import { logoutUserById } from '../../../services/user';

export default {
  async handleLogout(req: Request, res: Response) {
    const UNAUTHORIZED = '먼저 로그인하세요';

    try {
      const id = (req.user as { id: string }).id;
      if (!id) throw new Error(UNAUTHORIZED);
      await logoutUserById(id);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.end();
    } catch (e) {
      if ((e as Error).message === UNAUTHORIZED) {
        res.status(401).json({ message: '먼저 로그인하세요' });
      } else {
        res.status(500).json({ message: (e as Error).message });
      }
    }
  },
};
