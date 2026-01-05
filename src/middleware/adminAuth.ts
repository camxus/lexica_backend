import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isAdmin = req.user.role === 'admin' || req.user.is_admin === true;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};
