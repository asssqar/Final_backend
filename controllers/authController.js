const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { COOKIE_NAME } = require('../middlewares/authMiddleware');

const JWT_EXPIRES = '7d';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Name, email and password are required' });
      }
      return res.redirect('/register?error=' + encodeURIComponent('Name, email and password are required'));
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }
      return res.redirect('/register?error=' + encodeURIComponent('Email already registered'));
    }
    const user = await User.create({ name, email: email.toLowerCase(), password, role: 'user' });
    const token = generateToken(user._id);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(201).json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }
    res.redirect('/');
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }
      return res.redirect('/login?error=' + encodeURIComponent('Email and password are required'));
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      return res.redirect('/login?error=' + encodeURIComponent('Invalid email or password'));
    }
    const token = generateToken(user._id);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }
    res.redirect(req.query.redirect || '/');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true });
  }
  res.redirect('/');
};
