import { Router } from 'express';
import { z } from 'zod';
import { register, login, logout, me, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Validation Regex patterns
const nameRegex = /^[a-zA-Z\s.'-]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{}|:;<>,.~]).{8,100}$/;

const registerSchema = {
  body: z
    .object({
      name: z
        .string({ required_error: 'Full name is required' })
        .trim()
        .min(2, 'Full name must be at least 2 characters long')
        .max(50, 'Full name cannot exceed 50 characters')
        .regex(nameRegex, 'Name can only contain alphabetic letters, spaces, hyphens, and dots'),
      email: z
        .string({ required_error: 'Email address is required' })
        .trim()
        .toLowerCase()
        .email('Please provide a valid email address')
        .regex(emailRegex, 'Please provide a valid email format (e.g., name@example.com)'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password cannot exceed 100 characters')
        .regex(
          passwordRegex,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
      confirmPassword: z.string().optional(),
      avatar: z.string().optional(),
    })
    .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
};

const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email address is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .regex(emailRegex, 'Please provide a valid email format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
};

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);

export default router;
