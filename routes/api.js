const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { uploadBookPdf } = require('../middlewares/uploadMiddleware');
const authController = require('../controllers/authController');
const bookController = require('../controllers/bookController');

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);

router.get('/books', bookController.getBooks);
router.get('/books/:id', bookController.getBookById);

router.post('/books', protect, adminOnly, uploadBookPdf, bookController.createBook);
router.put('/books/:id', protect, adminOnly, uploadBookPdf, bookController.updateBook);
router.delete('/books/:id', protect, adminOnly, bookController.deleteBook);

module.exports = router;
