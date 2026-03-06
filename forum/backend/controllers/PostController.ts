import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { PostModel, CreatePostDTO, UpdatePostDTO } from '../models/Post.js';
import { ReplyModel } from '../models/Reply.js';
import { NotificationModel } from '../models/Notification.js';
import { HttpError } from '../middleware/errorHandler.js';
import { extractMentions } from '../utils/mentionParser.js';

export class PostController {
  static async createPost(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { title, content, tag_ids } = req.body as CreatePostDTO;

      const post = await PostModel.create({
        user_id: user.id,
        title,
        content,
        tag_ids,
      });

      // Extract and process @mentions
      const mentions = extractMentions(content);
      if (mentions.length > 0) {
        // Create notifications for mentioned users
        // (implementation in mention service)
      }

      res.status(201).json({
        message: 'Post created successfully',
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPosts(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, tag_id, user_id, search, sort } = req.query as {
        page?: string;
        limit?: string;
        tag_id?: string;
        user_id?: string;
        search?: string;
        sort?: 'newest' | 'oldest' | 'popular';
      };

      const result = await PostModel.findAll({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        tag_id,
        user_id,
        search,
        sort,
      });

      res.json({
        posts: result.posts,
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
          total: result.total,
          pages: Math.ceil(result.total / (limit ? parseInt(limit, 10) : 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPostById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const post = await PostModel.findById(id);
      if (!post) {
        throw new HttpError(404, 'Post not found');
      }

      // Increment view count
      await PostModel.incrementViewCount(id);

      // Get replies for the post
      const replies = await ReplyModel.findByPostId(id);

      res.json({
        post,
        replies,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePost(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const updates = req.body as UpdatePostDTO;

      const post = await PostModel.findById(id);
      if (!post) {
        throw new HttpError(404, 'Post not found');
      }

      // Check ownership
      if (post.user_id !== user.id && user.role !== 'admin') {
        throw new HttpError(403, 'Not authorized to update this post');
      }

      const updatedPost = await PostModel.update(id, updates);

      res.json({
        message: 'Post updated successfully',
        post: updatedPost,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deletePost(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      const post = await PostModel.findById(id);
      if (!post) {
        throw new HttpError(404, 'Post not found');
      }

      // Check ownership
      if (post.user_id !== user.id && user.role !== 'admin') {
        throw new HttpError(403, 'Not authorized to delete this post');
      }

      await PostModel.delete(id);

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async createReply(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id: postId } = req.params;
      const { content, parent_reply_id } = req.body as {
        content: string;
        parent_reply_id?: string;
      };

      // Verify post exists
      const post = await PostModel.findById(postId);
      if (!post) {
        throw new HttpError(404, 'Post not found');
      }

      // Check if post is locked
      if (post.is_locked && user.role !== 'admin') {
        throw new HttpError(403, 'This post is locked');
      }

      const reply = await ReplyModel.create({
        post_id: postId,
        user_id: user.id,
        content,
        parent_reply_id,
      });

      // Extract mentions and create notifications
      const mentions = extractMentions(content);
      for (const mentionedUsername of mentions) {
        const mentionedUser = await import('../models/User.js').then(m => m.UserModel.findByUsername(mentionedUsername));
        if (mentionedUser && mentionedUser.id !== user.id) {
          await NotificationModel.create({
            user_id: mentionedUser.id,
            type: 'mention',
            title: `${user.username} mentioned you`,
            content: content.substring(0, 200),
            related_user_id: user.id,
            related_post_id: postId,
            related_reply_id: reply.id,
          });
        }
      }

      // Notify post author if not the replier
      if (post.user_id !== user.id) {
        await NotificationModel.create({
          user_id: post.user_id,
          type: 'reply',
          title: `New reply on your post`,
          content: content.substring(0, 200),
          related_user_id: user.id,
          related_post_id: postId,
          related_reply_id: reply.id,
        });
      }

      res.status(201).json({
        message: 'Reply created successfully',
        reply,
      });
    } catch (error) {
      next(error);
    }
  }

  static async togglePin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (user.role !== 'admin') {
        throw new HttpError(403, 'Only admins can pin posts');
      }

      const post = await PostModel.findById(id);
      if (!post) {
        throw new HttpError(404, 'Post not found');
      }

      const updatedPost = await PostModel.update(id, {});
      // Custom query to toggle pin
      await import('../database/connection.js').then(async ({ db }) => {
        await db.query(
          `UPDATE posts SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING *`,
          [id]
        );
      });

      res.json({ message: 'Post pin status toggled' });
    } catch (error) {
      next(error);
    }
  }

  static async toggleLock(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      if (user.role !== 'admin') {
        throw new HttpError(403, 'Only admins can lock posts');
      }

      await import('../database/connection.js').then(async ({ db }) => {
        await db.query(
          `UPDATE posts SET is_locked = NOT is_locked WHERE id = $1`,
          [id]
        );
      });

      res.json({ message: 'Post lock status toggled' });
    } catch (error) {
      next(error);
    }
  }
}
