import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { PostModel } from '../models/Post.js';
import { UserModel } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

export class SearchController {
  static async search(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q, page, limit, type } = req.query as {
        q: string;
        page?: string;
        limit?: string;
        type?: 'posts' | 'users' | 'all';
      };

      if (!q || q.trim().length === 0) {
        throw new HttpError(400, 'Search query is required');
      }

      const searchType = type || 'all';
      const results: any = {};

      if (searchType === 'posts' || searchType === 'all') {
        const posts = await PostModel.search(q, parseInt(limit || '20', 10));
        results.posts = {
          items: posts,
          total: posts.length,
        };
      }

      if (searchType === 'users' || searchType === 'all') {
        const users = await UserModel.search(q, parseInt(limit || '20', 10));
        results.users = {
          items: users,
          total: users.length,
        };
      }

      res.json({
        query: q,
        type: searchType,
        results,
      });
    } catch (error) {
      next(error);
    }
  }
}
