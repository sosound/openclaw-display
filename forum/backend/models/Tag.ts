import { db } from '../database/connection.js';

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  post_count: number;
  created_at: Date;
}

export interface CreateTagDTO {
  name: string;
  description?: string;
  color?: string;
}

export class TagModel {
  static async create(data: CreateTagDTO): Promise<Tag> {
    const result = await db.query(
      `INSERT INTO tags (name, description, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.description, data.color || '#3B82F6']
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<Tag | null> {
    const result = await db.query(
      'SELECT * FROM tags WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByName(name: string): Promise<Tag | null> {
    const result = await db.query(
      'SELECT * FROM tags WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  static async findAll(): Promise<Tag[]> {
    const result = await db.query(
      'SELECT * FROM tags ORDER BY post_count DESC, name ASC'
    );
    return result.rows;
  }

  static async update(id: string, data: Partial<CreateTagDTO>): Promise<Tag | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.color) {
      fields.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }

    if (fields.length === 0) return null;

    values.push(id);

    const result = await db.query(
      `UPDATE tags SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<void> {
    await db.query('DELETE FROM tags WHERE id = $1', [id]);
  }
}
