import { db } from '../database/connection.js';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  is_verified: boolean;
  is_online: boolean;
  last_seen_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  avatar_url?: string;
  bio?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
}

export class UserModel {
  static async create(data: CreateUserDTO): Promise<User> {
    const password_hash = await bcrypt.hash(data.password, 10);
    
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.username, data.email, password_hash, data.avatar_url, data.bio]
    );
    
    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.username) {
      fields.push(`username = $${paramIndex++}`);
      values.push(data.username);
    }
    if (data.email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }

  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await db.query(
      `UPDATE users SET is_online = $1, last_seen_at = NOW() WHERE id = $2`,
      [isOnline, userId]
    );
  }

  static async search(query: string, limit: number = 10): Promise<User[]> {
    const result = await db.query(
      `SELECT id, username, avatar_url, bio, role, is_verified
       FROM users
       WHERE username ILIKE $1 OR bio ILIKE $1
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }
}
