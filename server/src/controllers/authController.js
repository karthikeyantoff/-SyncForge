import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken, TOKEN_COOKIE, cookieOptions } from '../utils/token.js';

function issueSession(res, user, statusCode = 200) {
  const token = signToken(user._id);
  res.cookie(TOKEN_COOKIE, token, cookieOptions());
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toJSON(),
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password, avatar } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'Email is already registered');
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      avatar: avatar || '',
    });
    await user.setPassword(password);
    await user.save();

    issueSession(res, user, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    issueSession(res, user);
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  res.clearCookie(TOKEN_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function me(req, res) {
  res.json({ success: true, user: req.user.toJSON() });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, avatar } = req.body;
    if (name !== undefined) {
      if (!name.trim()) throw new ApiError(400, 'Name cannot be empty');
      req.user.name = name.trim();
    }
    if (avatar !== undefined) {
      req.user.avatar = avatar;
    }
    await req.user.save();
    res.json({ success: true, user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
}
