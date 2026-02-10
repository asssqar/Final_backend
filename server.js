const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const { optionalAuth } = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const apiRoutes = require('./routes/api');
const User = require('./models/User');

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('Missing MONGODB_URI or MONGO_URI. Set it in Render Dashboard → Environment.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Set it in Render Dashboard → Environment.');
  process.exit(1);
}

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) return;
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log('Existing user promoted to admin:', email);
      }
      return;
    }
    await User.create({
      name: 'Admin',
      email: email.toLowerCase(),
      password,
      role: 'admin',
    });
    console.log('Admin user created:', email);
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
}

app.use(optionalAuth);
app.use(routes);
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.status(404).render('404', { user: req.user || null });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
