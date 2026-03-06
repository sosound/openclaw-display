import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { NotificationModel } from '../models/Notification.js';
import { HttpError } from '../middleware/errorHandler.js';

export class NotificationController {
  static async getNotifications(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { page, limit, unread } = req.query as {
        page?: string;
        limit?: string;
        unread?: string;
      };

      const result = await NotificationModel.findByUserId(user.id, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        unreadOnly: unread === 'true',
      });

      res.json({
        notifications: result.notifications,
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const count = await NotificationModel.getUnreadCount(user.id);

      res.json({
        unread_count: count,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      const notification = await NotificationModel.markAsRead(id);
      
      if (!notification) {
        throw new HttpError(404, 'Notification not found');
      }

      // Check ownership
      if (notification.user_id !== user.id) {
        throw new HttpError(403, 'Not authorized');
      }

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      await NotificationModel.markAllAsRead(user.id);

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      // Get notification to check ownership
      const { db } = await import('../database/connection.js');
      const result = await db.query(
        'SELECT user_id FROM notifications WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new HttpError(404, 'Notification not found');
      }

      if (result.rows[0].user_id !== user.id && user.role !== 'admin') {
        throw new HttpError(403, 'Not authorized');
      }

      await NotificationModel.delete(id);

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  }
}
