const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { UPLOAD_DIR } = require('../middlewares/uploadMiddleware');

function safePath(relativePath) {
  const full = path.resolve(process.cwd(), relativePath);
  const uploadsResolved = path.resolve(UPLOAD_DIR);
  if (!full.startsWith(uploadsResolved)) return null;
  return full;
}

exports.getBooks = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = {};
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { author: new RegExp(q, 'i') },
      ];
    }
    const books = await Book.find(filter).sort({ createdAt: -1 }).lean();
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, data: books });
    }
    res.locals.books = books;
    res.locals.searchQuery = q;
    next();
  } catch (err) {
    next(err);
  }
};

exports.getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Invalid book id' });
      }
      return res.status(404).render('404', { user: req.user });
    }
    const book = await Book.findById(id).lean();
    if (!book) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }
      return res.status(404).render('404', { user: req.user });
    }
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, data: book });
    }
    res.locals.book = book;
    next();
  } catch (err) {
    next(err);
  }
};

exports.createBook = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'PDF file is required' });
      }
      return res.redirect('/admin/books/new?error=' + encodeURIComponent('PDF file is required'));
    }
    const { title, author, description, year, coverImageUrl } = req.body;
    if (!title || !author) {
      await fs.unlink(req.file.path).catch(() => {});
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Title and author are required' });
      }
      return res.redirect('/admin/books/new?error=' + encodeURIComponent('Title and author are required'));
    }
    const tags = typeof req.body.tags === 'string'
      ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(req.body.tags) ? req.body.tags : [];
    const pdfPath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      description: (description || '').trim(),
      tags,
      year: year ? parseInt(year, 10) : null,
      pdfPath,
      coverImageUrl: (coverImageUrl || '').trim(),
    });
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(201).json({ success: true, data: book });
    }
    res.redirect('/admin');
  } catch (err) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Invalid book id' });
      }
      return res.redirect('/admin');
    }
    const book = await Book.findById(id);
    if (!book) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }
      return res.redirect('/admin');
    }
    const { title, author, description, year, coverImageUrl } = req.body;
    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (description !== undefined) book.description = description.trim();
    if (year !== undefined) book.year = year ? parseInt(year, 10) : null;
    if (coverImageUrl !== undefined) book.coverImageUrl = coverImageUrl.trim();
    if (typeof req.body.tags === 'string') {
      book.tags = req.body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (Array.isArray(req.body.tags)) {
      book.tags = req.body.tags;
    }
    if (req.file && req.file.path) {
      const oldPath = safePath(book.pdfPath);
      if (oldPath) await fs.unlink(oldPath).catch(() => {});
      book.pdfPath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    }
    await book.save();
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, data: book });
    }
    res.redirect('/admin');
  } catch (err) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Invalid book id' });
      }
      return res.redirect('/admin');
    }
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, error: 'Book not found' });
      }
      return res.redirect('/admin');
    }
    const filePath = safePath(book.pdfPath);
    if (filePath) await fs.unlink(filePath).catch(() => {});
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
};

exports.downloadBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('404');
    }
    const book = await Book.findById(id).lean();
    if (!book || !book.pdfPath) {
      return res.status(404).render('404');
    }
    const filePath = safePath(book.pdfPath);
    if (!filePath) return res.status(404).render('404', { user: req.user });
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).render('404', { message: 'File not found', user: req.user });
    }
    const filename = (book.title || 'book').replace(/[^a-zA-Z0-9.-]/g, '_') + '.pdf';
    res.download(filePath, filename);
  } catch (err) {
    next(err);
  }
};
