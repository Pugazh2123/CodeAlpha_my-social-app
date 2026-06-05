// This is your backend server
// It listens for requests from the frontend and talks to the database

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./database');

const app  = express();
const PORT = 3000;

// Middleware — allows the frontend to talk to the backend
app.use(cors());
app.use(express.json());

// Serve the index.html file when someone opens the app
app.use(express.static(path.join(__dirname)));


// ================================================================
//  AUTH ROUTES — Register and Login
// ================================================================

// REGISTER a new user
// Frontend sends: { name, username, bio, password }
app.post('/api/register', (req, res) => {
  const { name, username, bio, password } = req.body;

  if (!name || !username || !password) {
    return res.json({ success: false, message: 'Name, username and password are required' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO users (name, username, bio, password) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, username.toLowerCase(), bio || '', password);

    res.json({
      success: true,
      user: { id: result.lastInsertRowid, name, username: username.toLowerCase(), bio: bio || '' }
    });
  } catch (err) {
    // If username is already taken
    res.json({ success: false, message: 'Username already taken. Try another one.' });
  }
});


// LOGIN an existing user
// Frontend sends: { username, password }
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare(
    'SELECT * FROM users WHERE username = ? AND password = ?'
  ).get(username.toLowerCase(), password);

  if (!user) {
    return res.json({ success: false, message: 'Wrong username or password' });
  }

  res.json({
    success: true,
    user: { id: user.id, name: user.name, username: user.username, bio: user.bio }
  });
});


// UPDATE profile (name, bio)
app.put('/api/users/:id', (req, res) => {
  const { name, bio } = req.body;
  db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?')
    .run(name, bio, req.params.id);
  res.json({ success: true });
});


// ================================================================
//  POSTS ROUTES
// ================================================================

// GET all posts (newest first) with author info and like count
app.get('/api/posts', (req, res) => {
  const userId = req.query.userId || 0;

  const posts = db.prepare(`
    SELECT
      posts.id,
      posts.content,
      posts.created_at,
      users.id       AS user_id,
      users.name     AS user_name,
      users.username AS user_username,
      (SELECT COUNT(*) FROM likes    WHERE likes.post_id    = posts.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count,
      (SELECT COUNT(*) FROM likes    WHERE likes.post_id    = posts.id AND likes.user_id = ?) AS liked_by_me
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `).all(userId);

  res.json(posts);
});


// GET posts by one user (for profile page)
app.get('/api/posts/user/:userId', (req, res) => {
  const meId = req.query.userId || 0;

  const posts = db.prepare(`
    SELECT
      posts.id,
      posts.content,
      posts.created_at,
      users.id       AS user_id,
      users.name     AS user_name,
      users.username AS user_username,
      (SELECT COUNT(*) FROM likes    WHERE likes.post_id    = posts.id) AS like_count,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count,
      (SELECT COUNT(*) FROM likes    WHERE likes.post_id    = posts.id AND likes.user_id = ?) AS liked_by_me
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.user_id = ?
    ORDER BY posts.created_at DESC
  `).all(meId, req.params.userId);

  res.json(posts);
});


// CREATE a new post
// Frontend sends: { userId, content }
app.post('/api/posts', (req, res) => {
  const { userId, content } = req.body;

  if (!content || !userId) {
    return res.json({ success: false, message: 'Content and userId required' });
  }

  const result = db.prepare(
    'INSERT INTO posts (user_id, content) VALUES (?, ?)'
  ).run(userId, content);

  res.json({ success: true, postId: result.lastInsertRowid });
});


// DELETE a post (only your own)
app.delete('/api/posts/:id', (req, res) => {
  const { userId } = req.body;
  db.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?')
    .run(req.params.id, userId);
  res.json({ success: true });
});


// ================================================================
//  LIKES ROUTES
// ================================================================

// LIKE or UNLIKE a post (toggle)
app.post('/api/likes', (req, res) => {
  const { postId, userId } = req.body;

  // Check if already liked
  const existing = db.prepare(
    'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
  ).get(postId, userId);

  if (existing) {
    // Already liked → unlike it
    db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(postId, userId);
    res.json({ success: true, action: 'unliked' });
  } else {
    // Not liked yet → like it
    db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, userId);
    res.json({ success: true, action: 'liked' });
  }
});


// ================================================================
//  COMMENTS ROUTES
// ================================================================

// GET all comments for a post
app.get('/api/comments/:postId', (req, res) => {
  const comments = db.prepare(`
    SELECT
      comments.id,
      comments.content,
      comments.created_at,
      users.name     AS user_name,
      users.username AS user_username
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC
  `).all(req.params.postId);

  res.json(comments);
});


// ADD a comment to a post
// Frontend sends: { postId, userId, content }
app.post('/api/comments', (req, res) => {
  const { postId, userId, content } = req.body;

  if (!content) return res.json({ success: false, message: 'Comment cannot be empty' });

  const result = db.prepare(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(postId, userId, content);

  res.json({ success: true, commentId: result.lastInsertRowid });
});


// ================================================================
//  FOLLOW ROUTES
// ================================================================

// FOLLOW or UNFOLLOW a user (toggle)
app.post('/api/follow', (req, res) => {
  const { followerId, followingId } = req.body;

  const existing = db.prepare(
    'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?'
  ).get(followerId, followingId);

  if (existing) {
    db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?')
      .run(followerId, followingId);
    res.json({ success: true, action: 'unfollowed' });
  } else {
    db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)')
      .run(followerId, followingId);
    res.json({ success: true, action: 'followed' });
  }
});


// GET follower + following counts for a user
app.get('/api/users/:id/stats', (req, res) => {
  const id = req.params.id;

  const followers  = db.prepare('SELECT COUNT(*) as count FROM followers WHERE following_id = ?').get(id);
  const following  = db.prepare('SELECT COUNT(*) as count FROM followers WHERE follower_id  = ?').get(id);
  const postCount  = db.prepare('SELECT COUNT(*) as count FROM posts     WHERE user_id      = ?').get(id);

  res.json({
    followers:  followers.count,
    following:  following.count,
    posts:      postCount.count
  });
});


// GET all users except yourself (for suggestions)
app.get('/api/users', (req, res) => {
  const myId = req.query.myId || 0;

  const users = db.prepare(`
    SELECT
      users.id, users.name, users.username, users.bio,
      (SELECT COUNT(*) FROM followers
       WHERE follower_id = ? AND following_id = users.id) AS i_follow
    FROM users
    WHERE users.id != ?
  `).all(myId, myId);

  res.json(users);
});


// ================================================================
//  START THE SERVER
// ================================================================
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Server is running!');
  console.log(`👉 Open your browser and go to: http://localhost:${PORT}`);
  console.log('');
});