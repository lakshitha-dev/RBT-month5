const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/user.model');
const { AppError } = require('../utils/helpers');

const SALT_ROUNDS = 10;

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('bio').optional().isString(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function register(req, res, next) {
  try {
    const { email, password, name, bio } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) throw new AppError('Email already in use', 409, 'CONFLICT');

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user  = await User.create({ email, password_hash, name, bio });
    const token = signToken(user);

    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    const valid = user && (await bcrypt.compare(password, user.password_hash));
    // same error for both cases — don't leak whether the email exists
    if (!valid) throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser);

    res.json({ success: true, data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, registerValidation, loginValidation };
