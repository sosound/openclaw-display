import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { db } from '../database/connection.js';

export class InteractionController {
  static async toggleLike(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { targetType, targetId } = req.params as {
        targetType: 'posts' | 'replies';
        targetId: string;
      };

      const client = await db.getClient();

      try {
        await client.query('BEGIN');

        const fieldName = targetType === 'posts' ? 'post_id' : 'reply_id';
        const countField = targetType === 'posts' ? 'like_count' : 'like_count';
        const tableName = targetType === 'posts' ? 'posts' : 'replies';

        // Check if already liked
        const existingLike = await client.query(
          `SELECT * FROM likes WHERE user_id = $1 AND ${fieldName} = $2`,
          [user.id, targetId]
        );

        if (existingLike.rows.length > 0) {
          // Unlike
          await client.query(
            `DELETE FROM likes WHERE user_id = $1 AND ${fieldName} = $2`,
            [user.id, targetId]
          );
          await client.query(
            `UPDATE ${tableName} SET ${countField} = ${countField} - 1 WHERE id = $1`,
            [targetId]
          );

          await client.query('COMMIT');
          res.json({ liked: false, message: 'Like removed' });
        } else {
          // Like
          await client.query(
            `INSERT INTO likes (user_id, ${fieldName}) VALUES ($1, $2)`,
            [user.id, targetId]
          );
          await client.query(
            `UPDATE ${tableName} SET ${countField} = ${countField} + 1 WHERE id = $1`,
            [targetId]
          );

          // Create notification for content owner
          if (targetType === 'posts') {
            const postResult = await client.query(
              'SELECT user_id FROM posts WHERE id = $1',
              [targetId]
            );
            if (postResult.rows.length > 0 && postResult.rows[0].user_id !== user.id) {
              await client.query(
                `INSERT INTO notifications (user_id, type, title, related_user_id, related_post_id)
                 VALUES ($1, 'like', 'Someone liked your post', $2, $3)`,
                [postResult.rows[0].user_id, user.id, targetId]
              );
            }
          }

          await client.query('COMMIT');
          res.json({ liked: true, message: 'Post liked' });
        }
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  static async toggleBookmark(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { postId } = req.params;

      // Check if post exists
      const postResult = await db.query(
        'SELECT * FROM posts WHERE id = $1',
        [postId]
      );

      if (postResult.rows.length === 0) {
        throw new HttpError(404, 'Post not found');
      }

      // Check if already bookmarked
      const existingBookmark = await db.query(
        'SELECT * FROM bookmarks WHERE user_id = $1 AND post_id = $2',
        [user.id, postId]
      );

      if (existingBookmark.rows.length > 0) {
        // Remove bookmark
        await db.query(
          'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2',
          [user.id, postId]
        );
        res.json({ bookmarked: false, message: 'Bookmark removed' });
      } else {
        // Add bookmark
        await db.query(
          'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2)',
          [user.id, postId]
        );
        res.json({ bookmarked: true, message: 'Post bookmarked' });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getBookmarks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { page, limit } = req.query as {
        page?: string;
        limit?: string;
      };

      const offset = ((page ? parseInt(page, 10) : 1) - 1) * (limit ? parseInt(limit, 10) : 20);

      const result = await db.query(
        `SELECT p.*, u.username, u.avatar_url,
                ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
                b.created_at as bookmarked_at
         FROM bookmarks b
         JOIN posts p ON b.post_id = p.id
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         WHERE b.user_id = $1
         GROUP BY p.id, u.id, b.created_at
         ORDER BY b.created_at DESC
         LIMIT $2 OFFSET $3`,
        [user.id, limit ? parseInt(limit, 10) : 20, offset]
      );

      res.json({
        bookmarks: result.rows,
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
