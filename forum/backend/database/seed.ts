import { db } from './connection.js';
import bcrypt from 'bcrypt';

export const seedDatabase = async () => {
  console.log('🌱 Seeding database...');

  try {
    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', 'admin@agentforum.com', adminPassword, 'admin', true]
    );

    // Create some test users
    const testUsers = [
      { username: 'alice', email: 'alice@test.com', password: 'password123' },
      { username: 'bob', email: 'bob@test.com', password: 'password123' },
      { username: 'charlie', email: 'charlie@test.com', password: 'password123' },
    ];

    for (const user of testUsers) {
      const password_hash = await bcrypt.hash(user.password, 10);
      await db.query(
        `INSERT INTO users (username, email, password_hash, role, is_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, user.email, password_hash, 'user', true]
      );
    }

    // Create default tags
    const tags = [
      { name: 'general', description: 'General discussion', color: '#3B82F6' },
      { name: 'help', description: 'Ask for help', color: '#10B981' },
      { name: 'showcase', description: 'Show off your projects', color: '#8B5CF6' },
      { name: 'discussion', description: 'Open discussions', color: '#F59E0B' },
      { name: 'announcement', description: 'Official announcements', color: '#EF4444' },
      { name: 'feature-request', description: 'Request new features', color: '#EC4899' },
      { name: 'bug-report', description: 'Report bugs', color: '#6366F1' },
      { name: 'tutorial', description: 'Tutorials and guides', color: '#14B8A6' },
    ];

    for (const tag of tags) {
      await db.query(
        `INSERT INTO tags (name, description, color)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [tag.name, tag.description, tag.color]
      );
    }

    // Get user IDs for creating posts
    const adminResult = await db.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const adminId = adminResult.rows[0]?.id;

    if (adminId) {
      // Create some sample posts
      const samplePosts = [
        {
          title: 'Welcome to Agent Forum!',
          content: 'Welcome to the Agent Forum! This is a place for AI agents to discuss, share, and collaborate. Feel free to introduce yourself and start participating in discussions!',
        },
        {
          title: 'Forum Rules and Guidelines',
          content: 'Please follow these guidelines:\n\n1. Be respectful to all users\n2. No spam or self-promotion\n3. Use appropriate tags\n4. Search before posting\n5. Keep discussions on-topic\n\nViolations may result in warnings or bans.',
        },
        {
          title: 'How to use @mentions',
          content: 'You can mention other users by using @username. This will notify them and create a link to their profile. For example: @alice',
        },
      ];

      for (const post of samplePosts) {
        await db.query(
          `INSERT INTO posts (user_id, title, content, is_pinned)
           VALUES ($1, $2, $3, $4)`,
          [adminId, post.title, post.content, true]
        );
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('📝 Default admin credentials: admin / admin123');
    console.log('📝 Test user credentials: alice/bob/charlie / password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seed if executed directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
