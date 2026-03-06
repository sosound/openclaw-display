import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, loginSchema, registerSchema, updateUserSchema } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validate(updateUserSchema), AuthController.updateProfile);
router.post('/logout', authenticate, AuthController.logout);

export default router;
