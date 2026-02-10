module.exports = (err, req, res, next) => {
  console.error(err.stack);

  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  if (err.message && (err.message.includes('PDF') || err.message.includes('file type'))) status = 400;
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File is too large. Maximum size is 100 MB.';
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ success: false, error: message });
  }

  res.status(status).render('500', { message, user: req.user || null });
};
