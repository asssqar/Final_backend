document.querySelectorAll('form[action*="/delete"]').forEach(function (form) {
  form.addEventListener('submit', function (e) {
    if (!confirm('Delete this book? This cannot be undone.')) e.preventDefault();
  });
});
