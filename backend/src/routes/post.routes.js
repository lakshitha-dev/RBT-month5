const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  list, getOne, create, update, remove,
  createValidation, updateValidation,
} = require('../controllers/post.controller');
const {
  listComments, createComment, getPostComment, createValidation: commentCreateValidation,
} = require('../controllers/comment.controller');

router.get('/',    list);
router.get('/:id', getOne);
router.post('/',   auth, createValidation, validate, create);
router.put('/:id', auth, updateValidation, validate, update);
router.delete('/:id', auth, remove);

router.get('/:id/comments',                  listComments);
router.post('/:id/comments',                 auth, commentCreateValidation, validate, createComment);
router.get('/:id/comments/:commentId',       getPostComment);

module.exports = router;
