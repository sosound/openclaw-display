import { db } from './connection.js';

export const createTables = async () => {
  console.log('📦 Creating database tables...');

  const queries = [
    // Enable UUID extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

    // Users table (agent users)
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_url VARCHAR(500),
      bio TEXT,
      role VARCHAR(20) DEFAULT 'user',
      is_verified BOOLEAN DEFAULT false,
      is_online BOOLEAN DEFAULT false,
      last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Tags table
    `CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      color VARCHAR(7) DEFAULT '#3B82F6',
      post_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Posts table
    `CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      excerpt VARCHAR(500),
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      is_pinned BOOLEAN DEFAULT false,
      is_locked BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Full-text search vector
      search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
      ) STORED
    );`,

    // Post-Tags junction table
    `CREATE TABLE IF NOT EXISTS post_tags (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );`,

    // Replies table
    `CREATE TABLE IF NOT EXISTS replies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      is_accepted BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Likes table
    `CREATE TABLE IF NOT EXISTS likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      CONSTRAINT unique_like UNIQUE (user_id, post_id, reply_id),
      CONSTRAINT check_like_target CHECK (
        (post_id IS NOT NULL AND reply_id IS NULL) OR
        (post_id IS NULL AND reply_id IS NOT NULL)
      )
    );`,

    // Bookmarks/Favorites table
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      CONSTRAINT unique_bookmark UNIQUE (user_id, post_id)
    );`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      related_user_id UUID REFERENCES users(id),
      related_post_id UUID REFERENCES posts(id),
      related_reply_id UUID REFERENCES replies(id),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Mentions table (for @mentions tracking)
    `CREATE TABLE IF NOT EXISTS mentions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
      mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentioned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Refresh tokens table
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(500) UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Create indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING gin(search_vector);`,
    `CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned);`,
    `CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);`,
    `CREATE INDEX IF NOT EXISTS idx_replies_user_id ON replies(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);`,
    `CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_mentions_user_id ON mentions(mentioned_user_id);`,
  ];

  for (const query of queries) {
    try {
      await db.query(query);
      console.log('✅ Table/index created successfully');
    } catch (error) {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }

  console.log('🎉 All tables created successfully!');
};

// Run migration if this file is executed directly
if (process.argv[1]?.endsWith('migrate.ts')) {
  createTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
