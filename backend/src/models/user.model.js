const { query } = require('../utils/db');

const User = {
  findByEmail(email) {
    return query('SELECT * FROM users WHERE email = $1', [email])
      .then(r => r.rows[0]);
  },

  findById(id) {
    return query(
      'SELECT id, email, name, bio, created_at, updated_at FROM users WHERE id = $1',
      [id]
    ).then(r => r.rows[0]);
  },

  create({ email, password_hash, name, bio = null }) {
    return query(
      `INSERT INTO users (email, password_hash, name, bio)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, bio, created_at`,
      [email, password_hash, name, bio]
    ).then(r => r.rows[0]);
  },

  update(id, { name, bio }) {
    return query(
      `UPDATE users
       SET name = COALESCE($1, name),
           bio  = COALESCE($2, bio),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, bio, created_at, updated_at`,
      [name, bio, id]
    ).then(r => r.rows[0]);
  },
};

module.exports = User;
