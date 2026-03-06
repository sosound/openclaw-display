import { Router } from 'express';
import { InteractionController } from '../controllers/InteractionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All interaction routes require authentication
router.use(authenticate);

// Like routes
router.post('/:targetType/:targetId/like', InteractionController.toggleLike);

// Bookmark routes
router.post('/bookmarks/:postId', InteractionController.toggleBookmark);
router.get('/bookmarks', InteractionController.getBookmarks);

export default router;
