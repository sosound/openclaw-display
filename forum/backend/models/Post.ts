import { db } from '../database/connection.js';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt?: string;
  view_count: number;
  like_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: Date;
  updated_at: Date;
  search_vector: string;
}

export interface CreatePostDTO {
  user_id: string;
  title: string;
  content: string;
  tag_ids?: string[];
}

export interface UpdatePostDTO {
  title?: string;
  content?: string;
  tag_ids?: string[];
}

export class PostModel {
  static async create(data: CreatePostDTO): Promise<Post> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create excerpt from content (first 500 chars)
      const excerpt = data.content.substring(0, 500);
      
      const postResult = await client.query(
        `INSERT INTO posts (user_id, title, content, excerpt)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.user_id, data.title, data.content, excerpt]
      );
      
      const post = postResult.rows[0];
      
      // Add tags if provided
      if (data.tag_ids && data.tag_ids.length > 0) {
        for (const tagId of data.tag_ids) {
          await client.query(
            `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [post.id, tagId]
          );
        }
        
        // Update tag post counts
        await client.query(
          `UPDATE tags SET post_count = post_count + 1 WHERE id = ANY($1)`,
          [data.tag_ids]
        );
      }
      
      await client.query('COMMIT');
      return post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: string): Promise<Post | null> {
    const result = await db.query(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(options: {
    page?: number;
    limit?: number;
    tag_id?: string;
    user_id?: string;
    search?: string;
    sort?: 'newest' | 'oldest' | 'popular';
  } = {}): Promise<{ posts: Post[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      tag_id,
      user_id,
      search,
      sort = 'newest',
    } = options;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (tag_id) {
      conditions.push(`p.id IN (SELECT post_id FROM post_tags WHERE tag_id = $${paramIndex++})`);
      values.push(tag_id);
    }

    if (user_id) {
      conditions.push(`p.user_id = $${paramIndex++}`);
      values.push(user_id);
    }

    if (search) {
      conditions.push(`p.search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
      values.push(search);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.created_at DESC';
    if (sort === 'oldest') orderBy = 'p.created_at ASC';
    if (sort === 'popular') orderBy = 'p.like_count DESC, p.created_at DESC';

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM posts p ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get posts
    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
              ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN post_tags pt ON p.id = pt.post_id
       LEFT JOIN tags t ON pt.tag_id = t.id
       ${whereClause}
       GROUP BY p.id, u.id
       ORDER BY ${orderBy}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    return { posts: result.rows, total };
  }

  static async update(id: string, data: UpdatePostDTO): Promise<Post | null> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.title) {
        fields.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }
      if (data.content) {
        fields.push(`content = $${paramIndex++}`);
        const excerpt = data.content.substring(0, 500);
        fields.push(`excerpt = $${paramIndex++}`);
        values.push(excerpt);
      }

      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(id);

        await client.query(
          `UPDATE posts SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          values
        );
      }

      // Update tags if provided
      if (data.tag_ids) {
        await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
        
        for (const tagId of data.tag_ids) {
          await client.query(
            `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)`,
            [id, tagId]
          );
        }
      }

      await client.query('COMMIT');
      
      const result = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: string): Promise<void> {
    await db.query('DELETE FROM posts WHERE id = $1', [id]);
  }

  static async incrementViewCount(id: string): Promise<void> {
    await db.query(
      `UPDATE posts SET view_count = view_count + 1 WHERE id = $1`,
      [id]
    );
  }

  static async search(query: string, limit: number = 20): Promise<Post[]> {
    const result = await db.query(
      `SELECT p.*, u.username, u.avatar_url,
              ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.search_vector @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC, p.created_at DESC
       LIMIT $2`,
      [query, limit]
    );
    return result.rows;
  }
}
