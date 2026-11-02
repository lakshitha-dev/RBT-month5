const { query } = require('../utils/db');

const Comment = {
  findByPost(postId) {
    return query(
      `SELECT c.*, u.name AS author_name
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    ).then(r => r.rows);
  },

  findById(id) {
    return query('SELECT * FROM comments WHERE id = $1', [id])
      .then(r => r.rows[0]);
  },

  create({ content, post_id, author_id }) {
    return query(
      `INSERT INTO comments (content, post_id, author_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [content, post_id, author_id]
    ).then(r => r.rows[0]);
  },

  delete(id) {
    return query('DELETE FROM comments WHERE id = $1', [id]);
  },
};

module.exports = Comment;
