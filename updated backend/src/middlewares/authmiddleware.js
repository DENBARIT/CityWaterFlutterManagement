import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

const { verify } = jwt;

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        subCityId: true,
        woredaId: true,
        status: true,
        deletedAt: true,
      },
    });

    // Check if user exists and is active
    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Account is inactive or deleted' });
    }

    // Attach full user object to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
