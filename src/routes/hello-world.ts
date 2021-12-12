import { Response, Request } from 'express';

function helloWorld(req: Request, res: Response): void {
  res.json({ message: 'hello world' });
}

export default helloWorld;
