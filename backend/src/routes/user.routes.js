const router   = require('express').Router();
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getMe, updateMe, getUser, updateValidation } = require('../controllers/user.controller');

router.get('/me',  auth, getMe);
router.put('/me',  auth, updateValidation, validate, updateMe);
router.get('/:id', getUser);

module.exports = router;
