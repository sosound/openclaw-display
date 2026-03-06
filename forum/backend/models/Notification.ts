import { db } from '../database/connection.js';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  related_user_id?: string;
  related_post_id?: string;
  related_reply_id?: string;
  is_read: boolean;
  created_at: Date;
}

export interface CreateNotificationDTO {
  user_id: string;
  type: string;
  title: string;
  content?: string;
  related_user_id?: string;
  related_post_id?: string;
  related_reply_id?: string;
}

export class NotificationModel {
  static async create(data: CreateNotificationDTO): Promise<Notification> {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, content, related_user_id, related_post_id, related_reply_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.user_id,
        data.type,
        data.title,
        data.content,
        data.related_user_id || null,
        data.related_post_id || null,
        data.related_reply_id || null,
      ]
    );
    return result.rows[0];
  }

  static async findByUserId(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const offset = (page - 1) * limit;

    const whereClause = unreadOnly 
      ? 'WHERE user_id = $1 AND is_read = false'
      : 'WHERE user_id = $1';

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM notifications ${whereClause}`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get notifications
    const result = await db.query(
      `SELECT n.*, 
              ru.username as related_username,
              ru.avatar_url as related_user_avatar,
              p.title as post_title
       FROM notifications n
       LEFT JOIN users ru ON n.related_user_id = ru.id
       LEFT JOIN posts p ON n.related_post_id = p.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${unreadOnly ? 3 : 2} OFFSET $${unreadOnly ? 4 : 3}`,
      unreadOnly ? [userId, limit, offset] : [userId, limit, offset]
    );

    return { notifications: result.rows, total };
  }

  static async markAsRead(id: string): Promise<Notification | null> {
    const result = await db.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await db.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [userId]
    );
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async delete(id: string): Promise<void> {
    await db.query('DELETE FROM notifications WHERE id = $1', [id]);
  }
}
