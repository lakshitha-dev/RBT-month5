require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('../../src/utils/db');

const users = [
  { email: 'alice@example.com', name: 'Alice Johnson', bio: 'Full-stack developer passionate about clean code' },
  { email: 'bob@example.com',   name: 'Bob Smith',     bio: 'Backend engineer with 5 years of experience' },
  { email: 'carol@example.com', name: 'Carol Davis',   bio: 'Frontend developer and UI/UX enthusiast' },
  { email: 'dave@example.com',  name: 'Dave Wilson',   bio: 'DevOps engineer and open source contributor' },
  { email: 'eve@example.com',   name: 'Eve Martinez',  bio: 'Data scientist turned software engineer' },
];

const postTitles = [
  'Getting Started with Express.js',
  'Understanding RESTful API Design',
  'PostgreSQL Performance Tips',
  'JWT Authentication Best Practices',
  'Building Scalable Node.js Apps',
  'Introduction to TypeScript',
  'Docker for Node.js Developers',
  'Testing APIs with Postman',
  'React Hooks Deep Dive',
  'CSS Grid Layout Guide',
  'Async/Await in JavaScript',
  'Database Indexing Strategies',
  'Microservices Architecture Patterns',
  'GraphQL vs REST Comparison',
  'Redis Caching Fundamentals',
  'Git Workflow Best Practices',
  'CI/CD with GitHub Actions',
  'WebSockets with Node.js',
  'OAuth2 Implementation Guide',
  'Monitoring Node.js Applications',
];

const commentTexts = [
  'Great article, very helpful!',
  'Thanks for sharing this.',
  'I had the same issue — this solved it.',
  'Could you elaborate more on this point?',
  'Excellent explanation, keep it up!',
  'This is exactly what I was looking for.',
  'Have you considered using a different approach here?',
  'Nice writeup, bookmarked for later.',
  'Any updates planned for this topic?',
  'Clear and concise, well done.',
];

async function seed() {
  console.log('Clearing existing data...');
  await query('TRUNCATE comments, posts, users RESTART IDENTITY CASCADE');

  console.log('Creating users...');
  const userIds = [];
  for (const u of users) {
    const hash = await bcrypt.hash('password123', 10);
    const { rows } = await query(
      'INSERT INTO users (email, password_hash, name, bio) VALUES ($1, $2, $3, $4) RETURNING id',
      [u.email, hash, u.name, u.bio]
    );
    userIds.push(rows[0].id);
  }

  console.log('Creating posts...');
  const postIds = [];
  for (let i = 0; i < postTitles.length; i++) {
    const authorId = userIds[i % userIds.length];
    const { rows } = await query(
      'INSERT INTO posts (title, content, author_id, published) VALUES ($1, $2, $3, $4) RETURNING id',
      [
        postTitles[i],
        `This is a detailed article about ${postTitles[i].toLowerCase()}. ` +
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor ' +
        'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
        'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        authorId,
        i % 4 !== 0, // 75% published
      ]
    );
    postIds.push(rows[0].id);
  }

  console.log('Creating comments...');
  for (let i = 0; i < 50; i++) {
    await query(
      'INSERT INTO comments (content, post_id, author_id) VALUES ($1, $2, $3)',
      [commentTexts[i % commentTexts.length], postIds[i % postIds.length], userIds[i % userIds.length]]
    );
  }

  console.log(`Done! Created ${userIds.length} users, ${postIds.length} posts, 50 comments`);
  console.log('All user passwords: password123');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
