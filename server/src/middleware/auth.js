import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken, TOKEN_COOKIE } from '../utils/token.js';

export async function requireAuth(req, _res, next) {
  try {
    let token = null;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies[TOKEN_COOKIE]) {
      // Check HTTP-only cookie
      token = req.cookies[TOKEN_COOKIE];
    }

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired session token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, 'User account no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
