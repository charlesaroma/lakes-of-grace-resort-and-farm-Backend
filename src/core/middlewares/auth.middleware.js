import prisma from '../../lib/prisma.js';
import { verifyAccessToken } from '../../features/auth/token.utils.js';

// ─── Auth Middleware ───
export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.split(' ')[1];
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true, lastLogoutAll: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    if (user.lastLogoutAll) {
      const logoutAllTs = Math.floor(user.lastLogoutAll.getTime() / 1000);
      if (payload.iat < logoutAllTs) {
        return res.status(401).json({ message: 'Token revoked, please sign in again' });
      }
    }

    req.userId = user.id;
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};
