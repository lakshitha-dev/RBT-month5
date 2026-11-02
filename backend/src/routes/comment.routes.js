const router = require('express').Router();
const auth = require('../middleware/auth');
const { deleteComment, getComment } = require('../controllers/comment.controller');

router.get('/:id',    getComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;
