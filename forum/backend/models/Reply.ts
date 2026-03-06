import { db } from '../database/connection.js';

export interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  parent_reply_id?: string;
  content: string;
  like_count: number;
  is_accepted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReplyDTO {
  post_id: string;
  user_id: string;
  content: string;
  parent_reply_id?: string;
}

export class ReplyModel {
  static async create(data: CreateReplyDTO): Promise<Reply> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO replies (post_id, user_id, content, parent_reply_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.post_id, data.user_id, data.content, data.parent_reply_id || null]
      );
      
      const reply = result.rows[0];
      
      // Increment reply count on post
      await client.query(
        `UPDATE posts SET reply_count = reply_count + 1 WHERE id = $1`,
        [data.post_id]
      );
      
      await client.query('COMMIT');
      return reply;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: string): Promise<Reply | null> {
    const result = await db.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM replies r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByPostId(postId: string): Promise<Reply[]> {
    const result = await db.query(
      `SELECT r.*, u.username, u.avatar_url
       FROM replies r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.post_id = $1
       ORDER BY r.created_at ASC`,
      [postId]
    );
    return result.rows;
  }

  static async update(id: string, content: string): Promise<Reply | null> {
    const result = await db.query(
      `UPDATE replies SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<void> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Get the reply to find post_id
      const replyResult = await client.query(
        'SELECT post_id FROM replies WHERE id = $1',
        [id]
      );
      
      if (replyResult.rows.length > 0) {
        const postId = replyResult.rows[0].post_id;
        
        // Delete the reply
        await client.query('DELETE FROM replies WHERE id = $1', [id]);
        
        // Decrement reply count
        await client.query(
          `UPDATE posts SET reply_count = reply_count - 1 WHERE id = $1`,
          [postId]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async accept(id: string): Promise<Reply | null> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Unaccept all other replies in the same post
      const reply = await client.query(
        'SELECT post_id FROM replies WHERE id = $1',
        [id]
      );
      
      if (reply.rows.length > 0) {
        await client.query(
          `UPDATE replies SET is_accepted = false WHERE post_id = $1`,
          [reply.rows[0].post_id]
        );
      }
      
      // Accept this reply
      const result = await client.query(
        `UPDATE replies SET is_accepted = true WHERE id = $1 RETURNING *`,
        [id]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
