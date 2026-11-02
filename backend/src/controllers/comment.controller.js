const { body } = require('express-validator');
const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const { AppError } = require('../utils/helpers');

const createValidation = [
  body('content').trim().notEmpty().withMessage('Content is required'),
];

async function listComments(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');

    const comments = await Comment.findByPost(req.params.id);
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
}

async function createComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');

    const comment = await Comment.create({
      content: req.body.content,
      post_id: req.params.id,
      author_id: req.user.userId,
    });
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new AppError('Comment not found', 404, 'NOT_FOUND');
    if (comment.author_id !== req.user.userId) throw new AppError('Forbidden', 403, 'FORBIDDEN');

    await Comment.delete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

async function getComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new AppError('Comment not found', 404, 'NOT_FOUND');
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

async function getPostComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404, 'NOT_FOUND');
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || String(comment.post_id) !== String(req.params.id)) {
      throw new AppError('Comment not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

module.exports = { listComments, createComment, deleteComment, getComment, getPostComment, createValidation };
