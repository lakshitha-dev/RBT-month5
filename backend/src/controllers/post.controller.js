const { body } = require('express-validator');
const Post = require('../models/post.model');
const { AppError } = require('../utils/helpers');

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('published').optional().isBoolean(),
];

const updateValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('published').optional().isBoolean(),
];

async function list(req, res, next) {
  try {
    const page      = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit     = Math.min(parseInt(req.query.limit) || 10, 50);
    const author_id = req.query.author_id || null;
    const published = req.query.published !== undefined
      ? req.query.published === 'true'
      : null;

    const { rows, total } = await Post.findAll({ page, limit, author_id, published });

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, content, published } = req.body;
    const post = await Post.create({ title, content, published, author_id: req.user.userId });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (post.author_id !== req.user.userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    const { title, content, published } = req.body;
    const updated = await Post.update(req.params.id, { title, content, published });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    if (post.author_id !== req.user.userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await Post.delete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, createValidation, updateValidation };
