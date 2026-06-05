// This file creates your database and all the tables

const Database = require('better-sqlite3');

// This creates a file called social.db (your database)
const db = new Database('social.db');

// Create the USERS table
// Each user has: id, name, username, bio, password, created_at
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    username  TEXT UNIQUE NOT NULL,
    bio       TEXT DEFAULT '',
    password  TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create the POSTS table
// Each post belongs to a user (user_id)
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the COMMENTS table
// Each comment belongs to a post and a user
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id    INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the LIKES table
// Tracks who liked which post
db.exec(`
  CREATE TABLE IF NOT EXISTS likes (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the FOLLOWERS table
// Tracks who follows who
db.exec(`
  CREATE TABLE IF NOT EXISTS followers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (following_id) REFERENCES users(id)
  )
`);

console.log('✅ Database and tables are ready!');

module.exports = db;
// ============================================================
// SEED DATA — Sample users and posts added automatically
// ============================================================

// Check if sample users already exist
const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

if (existingUsers.count === 0) {

  console.log('🌱 Adding sample users and posts...');

  // Add 5 sample users
  const addUser = db.prepare(
    'INSERT INTO users (name, username, bio, password) VALUES (?, ?, ?, ?)'
  );

  const alex  = addUser.run('Alex Rivera',  'alex',  'Engineer & coffee lover ☕',     'password123');
  const maya  = addUser.run('Maya Chen',    'maya',  'UI/UX Designer 🎨',              'password123');
  const sam   = addUser.run('Sam Patel',    'sam',   'Reading, running, coding 📚',    'password123');
  const priya = addUser.run('Priya Nair',   'priya', 'Chennai based developer 🌏',     'password123');
  const raj   = addUser.run('Raj Kumar',    'raj',   'Full stack dev | Tech blogger',  'password123');

  // Get their IDs
  const alexId  = alex.lastInsertRowid;
  const mayaId  = maya.lastInsertRowid;
  const samId   = sam.lastInsertRowid;
  const priyaId = priya.lastInsertRowid;
  const rajId   = raj.lastInsertRowid;

  // Add posts for each user
  const addPost = db.prepare(
    'INSERT INTO posts (user_id, content) VALUES (?, ?)'
  );

  const p1 = addPost.run(alexId,  'Just shipped a new feature today! The grind never stops 🚀 #buildinpublic');
  const p2 = addPost.run(mayaId,  'Hot take: Good design is invisible. Great design is unforgettable. #design #ux');
  const p3 = addPost.run(samId,   'Reading "Clean Code" for the second time. Every developer should read this book at least once!');
  const p4 = addPost.run(priyaId, 'Chennai rain season is here! Perfect weather to sit inside and code ☔ #chennai');
  const p5 = addPost.run(rajId,   'CSS tip of the day: Use "gap" instead of margin for flex/grid layouts. Cleaner and easier! #webdev #css');
  const p6 = addPost.run(alexId,  'If you are not learning in public, you are missing out. Share your journey! #coding #growth');
  const p7 = addPost.run(mayaId,  'Just redesigned my portfolio. Minimal, clean, fast. Let me know what you think! 🎨');
  const p8 = addPost.run(samId,   'Morning run done ✅ Coffee ready ✅ Code time 💻 Productive day ahead!');
  const p9 = addPost.run(priyaId, 'Tip: Always name your variables clearly. "userLoginTimestamp" is better than "t" or "x" 😄 #programming');
  const p10 = addPost.run(rajId,  'Built a REST API from scratch today using Express + SQLite. Feels amazing when everything works! #nodejs');

  // Add some comments
  const addComment = db.prepare(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)'
  );

  addComment.run(p1.lastInsertRowid, mayaId,  'Amazing! Keep going Alex 🔥');
  addComment.run(p1.lastInsertRowid, samId,   'What feature did you ship?');
  addComment.run(p2.lastInsertRowid, alexId,  'So true! Best quote about design.');
  addComment.run(p3.lastInsertRowid, priyaId, 'Adding it to my reading list right now!');
  addComment.run(p4.lastInsertRowid, rajId,   'Chennai rain + coding = perfect combo 😄');
  addComment.run(p5.lastInsertRowid, mayaId,  'This tip just saved my day, thank you!');
  addComment.run(p6.lastInsertRowid, samId,   'Started my coding blog because of this mindset!');
  addComment.run(p10.lastInsertRowid, alexId, 'Express + SQLite is the best combo for beginners!');

  // Add some likes
  const addLike = db.prepare(
    'INSERT INTO likes (post_id, user_id) VALUES (?, ?)'
  );

  addLike.run(p1.lastInsertRowid,  mayaId);
  addLike.run(p1.lastInsertRowid,  samId);
  addLike.run(p1.lastInsertRowid,  priyaId);
  addLike.run(p2.lastInsertRowid,  alexId);
  addLike.run(p2.lastInsertRowid,  rajId);
  addLike.run(p3.lastInsertRowid,  mayaId);
  addLike.run(p4.lastInsertRowid,  samId);
  addLike.run(p4.lastInsertRowid,  alexId);
  addLike.run(p5.lastInsertRowid,  priyaId);
  addLike.run(p6.lastInsertRowid,  rajId);
  addLike.run(p7.lastInsertRowid,  alexId);
  addLike.run(p8.lastInsertRowid,  priyaId);
  addLike.run(p9.lastInsertRowid,  mayaId);
  addLike.run(p10.lastInsertRowid, samId);

  // Add some follow relationships
  const addFollow = db.prepare(
    'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)'
  );

  addFollow.run(alexId,  mayaId);
  addFollow.run(alexId,  samId);
  addFollow.run(mayaId,  alexId);
  addFollow.run(mayaId,  priyaId);
  addFollow.run(samId,   rajId);
  addFollow.run(priyaId, alexId);
  addFollow.run(rajId,   mayaId);

  console.log('✅ Sample data added! 5 users, 10 posts, comments, likes and follows ready.');

} else {
  console.log('✅ Database already has data. Skipping seed.');
}