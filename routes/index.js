const express = require('express');
const router = express.Router();
const { optionalAuth, protect, adminOnly } = require('../middlewares/authMiddleware');
const { uploadBookPdf } = require('../middlewares/uploadMiddleware');
const authController = require('../controllers/authController');
const bookController = require('../controllers/bookController');

router.get('/', optionalAuth, bookController.getBooks, (req, res) => {
  res.render('home', {
    books: res.locals.books || [],
    searchQuery: res.locals.searchQuery || '',
    user: req.user,
  });
});

router.get('/register', (req, res) => res.render('register', { user: null, error: req.query.error }));
router.post('/register', authController.register);
router.get('/login', (req, res) => res.render('login', { user: null, error: req.query.error }));
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/books/:id', optionalAuth, bookController.getBookById, (req, res) => {
  res.render('book-detail', { book: res.locals.book, user: req.user });
});

router.get('/books/:id/download', protect, bookController.downloadBook);

router.get('/admin', protect, adminOnly, bookController.getBooks, (req, res) => {
  res.render('admin/index', {
    books: res.locals.books || [],
    user: req.user,
  });
});

router.get('/admin/books/new', protect, adminOnly, (req, res) => {
  res.render('admin/book-form', { book: null, user: req.user, error: req.query.error });
});

router.post('/admin/books', protect, adminOnly, uploadBookPdf, bookController.createBook);

router.get('/admin/books/:id/edit', protect, adminOnly, bookController.getBookById, (req, res) => {
  if (!res.locals.book) return res.redirect('/admin');
  res.render('admin/book-form', { book: res.locals.book, user: req.user, error: req.query.error });
});

router.post('/admin/books/:id', protect, adminOnly, uploadBookPdf, bookController.updateBook);

router.post('/admin/books/:id/delete', protect, adminOnly, bookController.deleteBook);

module.exports = router;
