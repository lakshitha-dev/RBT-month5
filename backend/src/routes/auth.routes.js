const router = require('express').Router();
const validate = require('../middleware/validate');
const { register, login, registerValidation, loginValidation } = require('../controllers/auth.controller');

router.post('/register', registerValidation, validate, register);
router.post('/login',    loginValidation,    validate, login);

module.exports = router;
