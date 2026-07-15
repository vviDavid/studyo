require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const session = require('express-session');
const { transporter } = require('./config/mail');

const mentorRoutes = require('./routes/mentorRoutes');
const learnerRoutes = require('./routes/learnerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const contentRoutes = require('./routes/contentRoutes');
const groupRoutes = require('./routes/groupRoutes');
const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated, authorize } = require('./middlewares/authMiddleware');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 60 * 60 * 1000
  }
}));

app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    isSelected: (a, b) => {
      return String(a) === String(b) ? 'selected' : '';
    },
    isChecked: (arr, val) => {
      if (!arr) return '';
      const arrValues = (Array.isArray(arr) ? arr : [arr]).map(v => String(v));
      return arrValues.includes(String(val)) ? 'checked' : '';
    },
    eq: function(a, b, options) {
      const isEqual = String(a) === String(b);
      if (options && typeof options.fn === 'function') {
        return isEqual ? options.fn(this) : options.inverse(this);
      } else {
        return isEqual;
      }
    },
    or: function(a, b, options) {
      const result = a || b;
      if (options && typeof options.fn === 'function') {
        return result ? options.fn(this) : options.inverse(this);
      } else {
        return result;
      }
    }
  }
}))

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use('/bootstrap', 
  express.static(path.join(__dirname, 'node_modules/bootstrap/dist'))
);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render("pages/index", {
    title: "Home - Studyo"
  });
});

app.use("/mentor", isAuthenticated, authorize('admin'), mentorRoutes);
app.use("/learner", isAuthenticated, authorize('admin'), learnerRoutes);
app.use("/admin", isAuthenticated, authorize('admin'), adminRoutes);
app.use("/course", isAuthenticated, courseRoutes);
app.use("/course/:id/content", isAuthenticated, contentRoutes);
app.use("/course/:id/group", isAuthenticated, groupRoutes);
app.use("/profile", isAuthenticated, profileRoutes);
app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Page Not Found',
    message: "The page you're looking for doesn't exist.",
    errorCode: 404
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).render('pages/error', {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    errorCode: 500
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  transporter.verify().catch(err => {
    console.warn('Mail transporter not available:', err.message);
  });
  console.log(`Studyo is running on http://localhost:${PORT}`);
});