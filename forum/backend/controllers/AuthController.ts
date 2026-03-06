import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserModel, CreateUserDTO } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

export class AuthController {
  static async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, email, password, avatar_url, bio } = req.body as CreateUserDTO;

      // Check if username or email already exists
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        throw new HttpError(409, 'Username already taken');
      }

      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        throw new HttpError(409, 'Email already registered');
      }

      // Create user
      const user = await UserModel.create({
        username,
        email,
        password,
        avatar_url,
        bio,
      });

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, password } = req.body as { username: string; password: string };

      // Find user by username or email
      let user = await UserModel.findByUsername(username);
      if (!user) {
        user = await UserModel.findByEmail(username);
      }

      if (!user) {
        throw new HttpError(401, 'Invalid credentials');
      }

      // Verify password
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        throw new HttpError(401, 'Invalid credentials');
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // Update last seen
      await UserModel.updateOnlineStatus(user.id, true);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refresh_token } = req.body as { refresh_token: string };

      if (!refresh_token) {
        throw new HttpError(400, 'Refresh token required');
      }

      const decoded = jwt.verify(refresh_token, config.jwt.secret) as { userId: string };
      
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new HttpError(401, 'User not found');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        access_token: accessToken,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new HttpError(401, 'Invalid refresh token');
      }
      next(error);
    }
  }

  static async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const updates = req.body as { username?: string; email?: string; avatar_url?: string; bio?: string };

      // Check username uniqueness if changing
      if (updates.username && updates.username !== user.username) {
        const existing = await UserModel.findByUsername(updates.username);
        if (existing) {
          throw new HttpError(409, 'Username already taken');
        }
      }

      // Check email uniqueness if changing
      if (updates.email && updates.email !== user.email) {
        const existing = await UserModel.findByEmail(updates.email);
        if (existing) {
          throw new HttpError(409, 'Email already registered');
        }
      }

      const updatedUser = await UserModel.update(user.id, updates);
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser!.id,
          username: updatedUser!.username,
          email: updatedUser!.email,
          avatar_url: updatedUser!.avatar_url,
          bio: updatedUser!.bio,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      await UserModel.updateOnlineStatus(user.id, false);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}
