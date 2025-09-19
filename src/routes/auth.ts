import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByIdWithPassword,
  updateUserProfile,
  updateUserPassword,
} from '../db/repository';
import { hashPassword, comparePassword } from '../utils/hash';
import { validateBody } from '../middleware/validate';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = express.Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Ensure JWT_SECRET is defined and typed correctly
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

router.post('/register', validateBody(RegisterSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body as z.infer<typeof RegisterSchema>;
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash, name);

    // Generate token for immediate login after registration
    const token = jwt.sign(
      { sub: String(user.id) },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES } as jwt.SignOptions,
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateBody(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;
    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // As a last resort, you can use type assertion
    const token = jwt.sign(
      { sub: String(user.id) },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES } as jwt.SignOptions,
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Stateless logout - client should delete token. Provide optional route for convenience.
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out. Delete token client-side.' });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await getUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/profile',
  requireAuth,
  validateBody(ProfileUpdateSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

      const { name, email } = req.body as z.infer<typeof ProfileUpdateSchema>;

      // Check if email is already taken by another user
      const existingUser = await getUserByEmail(email);
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(409).json({ error: 'Email already taken by another user' });
      }

      const updatedUser = await updateUserProfile(req.userId, name, email);
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/change-password',
  requireAuth,
  validateBody(PasswordChangeSchema),
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

      const { currentPassword, newPassword } = req.body as z.infer<typeof PasswordChangeSchema>;

      const user = await getUserByIdWithPassword(req.userId);
      if (!user || !user.password_hash) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password in database
      await updateUserPassword(req.userId, newPasswordHash);

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
