import { Router } from 'express';
import { PostController } from '../controllers/PostController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate, createPostSchema, updatePostSchema, createReplySchema } from '../middleware/validation.js';
import { postLimiter, replyLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public routes (with optional auth for some)
router.get('/', optionalAuth, PostController.getPosts);
router.get('/:id', optionalAuth, PostController.getPostById);

// Protected routes
router.post('/', authenticate, postLimiter, validate(createPostSchema), PostController.createPost);
router.put('/:id', authenticate, validate(updatePostSchema), PostController.updatePost);
router.delete('/:id', authenticate, PostController.deletePost);

// Reply routes
router.post('/:id/reply', authenticate, replyLimiter, validate(createReplySchema), PostController.createReply);

// Admin routes
router.post('/:id/pin', authenticate, PostController.togglePin);
router.post('/:id/lock', authenticate, PostController.toggleLock);

export default router;
