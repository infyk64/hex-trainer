import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('❌ Ошибка:', err.message);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
