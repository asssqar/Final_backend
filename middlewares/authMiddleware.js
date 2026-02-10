const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'token';

exports.optionalAuth = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch {
    next();
  }
};

exports.protect = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME] || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') && req.headers.authorization.split(' ')[1]);
  if (!token) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, error: 'Not authorized' });
      }
      res.clearCookie(COOKIE_NAME);
      return res.redirect('/login');
    }
    next();
  } catch {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    res.clearCookie(COOKIE_NAME);
    return res.redirect('/login');
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    return res.redirect('/');
  }
  next();
};

exports.COOKIE_NAME = COOKIE_NAME;
