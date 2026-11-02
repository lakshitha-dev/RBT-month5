const { query } = require('../utils/db');

const Post = {
  async findAll({ page = 1, limit = 10, author_id = null, published = null } = {}) {
    const offset = (page - 1) * limit;
    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (author_id !== null) { conds.push(`p.author_id = $${idx++}`); params.push(author_id); }
    if (published  !== null) { conds.push(`p.published  = $${idx++}`); params.push(published);  }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) FROM posts p ${where}`, params
    );

    const { rows } = await query(
      `SELECT p.*,
              u.name  AS author_name,
              u.email AS author_email,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::int AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { rows, total: parseInt(count) };
  },

  findById(id) {
    return query(
      `SELECT p.*,
              u.name  AS author_name,
              u.email AS author_email,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)::int AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.id = $1`,
      [id]
    ).then(r => r.rows[0]);
  },

  create({ title, content, author_id, published = false }) {
    return query(
      `INSERT INTO posts (title, content, author_id, published)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, content, author_id, published]
    ).then(r => r.rows[0]);
  },

  update(id, { title, content, published }) {
    return query(
      `UPDATE posts
       SET title     = COALESCE($1, title),
           content   = COALESCE($2, content),
           published = COALESCE($3, published),
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, content, published, id]
    ).then(r => r.rows[0]);
  },

  delete(id) {
    return query('DELETE FROM posts WHERE id = $1', [id]);
  },
};

module.exports = Post;
