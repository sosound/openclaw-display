import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Validation schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(6),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(50000),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).max(50000).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const createReplySchema = z.object({
  content: z.string().min(1).max(10000),
  parent_reply_id: z.string().uuid().optional(),
});

export const updateReplySchema = z.object({
  content: z.string().min(1).max(10000),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.enum(['posts', 'users', 'all']).optional().default('all'),
});
