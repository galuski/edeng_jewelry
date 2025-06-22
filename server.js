import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

import express from 'express';
import mongoose from 'mongoose';

import ypayRoutes from './services/ypay.route.js';

import cors from 'cors';
import cookieParser from 'cookie-parser';

import { jewelService } from './services/jewel.service.js';
import { userService } from './services/user.service.js';
import { loggerService } from './services/logger.service.js';
import { config } from './config/index.js';

import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3030;

console.log('Current NODE_ENV:', process.env.NODE_ENV);

// ✅ חיבור למסד נתונים
mongoose.connect(config.dbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch(err => console.log('❌ Error connecting to MongoDB:', err));

// ✅ CORS תקין לפרודקשן
const corsOptions = {
  origin: ['https://edengjewellry.com', 'https://www.edengjewellry.com', 'http://localhost:5173'],
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// ✅ Middleware קונסולה לכל בקשה
app.use((req, res, next) => {
  console.log(`📥 Incoming request: ${req.method} ${req.url}`);
  next();
});

// ✅ CORS תקף לכל הבקשות כולל preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ⚠️ חשוב מאוד!

app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

// ✅ ROUTES
app.use('/api/ypay', ypayRoutes);

// ✨ Jewelry API
app.get('/api/jewel', async (req, res) => {
  try {
    const { txt, maxPrice, designed } = req.query;
    const filterBy = { txt, maxPrice: +maxPrice, designed };
    const jewelry = await jewelService.query(filterBy);
    res.send(jewelry);
  } catch (err) {
    loggerService.error('❌ Cannot load jewelry', err);
    res.status(400).send('Cannot load jewelry');
  }
});

app.post('/api/jewel', (req, res) => {
  const loggedinUser = userService.validateToken(req.cookies.loginToken);
  if (!loggedinUser) return res.status(401).send('Cannot add jewel');

  const { vendor, speed, price, img, imghover, imgthird, designed, isSoldOut, descriptionENG, descriptionHEB } = req.body;

  const jewel = {
    vendor,
    speed: +speed,
    price: +price,
    img,
    imghover,
    imgthird,
    isSoldOut: false,
    designed,
    descriptionENG,
    descriptionHEB,
  };

  jewelService.save(jewel, loggedinUser)
    .then(savedJewel => res.send(savedJewel))
    .catch(err => {
      loggerService.error('Cannot add jewel', err);
      res.status(400).send('Cannot add jewel');
    });
});

app.put('/api/jewel', (req, res) => {
  const loggedinUser = userService.validateToken(req.cookies.loginToken);
  if (!loggedinUser) return res.status(401).send('Cannot update jewel');

  const { vendor, speed, price, img, imghover, imgthird, isSoldOut, designed, descriptionENG, descriptionHEB, _id, owner } = req.body;

  const jewel = {
    _id,
    vendor,
    speed: +speed,
    price: +price,
    img,
    imghover,
    imgthird,
    isSoldOut,
    designed,
    descriptionENG,
    descriptionHEB,
    owner,
  };

  jewelService.save(jewel, loggedinUser)
    .then(savedJewel => res.send(savedJewel))
    .catch(err => {
      loggerService.error('Cannot update jewel', err);
      res.status(400).send('Cannot update jewel');
    });
});

app.get('/api/jewel/:jewelId', (req, res) => {
  const { jewelId } = req.params;
  jewelService.get(jewelId)
    .then(jewel => res.send(jewel))
    .catch(err => {
      loggerService.error('Cannot get jewel', err);
      res.status(400).send(err);
    });
});

app.delete('/api/jewel/:jewelId', (req, res) => {
  const loggedinUser = userService.validateToken(req.cookies.loginToken);
  if (!loggedinUser) return res.status(401).send('Cannot delete jewel');

  const { jewelId } = req.params;
  jewelService.remove(jewelId, loggedinUser)
    .then(msg => res.send({ msg, jewelId }))
    .catch(err => {
      loggerService.error('Cannot delete jewel', err);
      res.status(400).send(err);
    });
});

// ✨ Users API
app.get('/api/auth/:userId', (req, res) => {
  const { userId } = req.params;
  userService.getById(userId)
    .then(user => res.send(user))
    .catch(err => {
      loggerService.error('Cannot get user', err);
      res.status(400).send('Cannot get user');
    });
});

app.post('/api/auth/login', (req, res) => {
  const credentials = req.body;
  userService.checkLogin(credentials)
    .then(user => {
      const token = userService.getLoginToken(user);
      res.cookie('loginToken', token);
      res.send(user);
    })
    .catch(err => {
      loggerService.error('Cannot login', err);
      res.status(401).send('Not you!');
    });
});

app.post('/api/auth/signup', (req, res) => {
  const credentials = req.body;
  userService.save(credentials)
    .then(user => {
      const token = userService.getLoginToken(user);
      res.cookie('loginToken', token);
      res.send(user);
    })
    .catch(err => {
      loggerService.error('Cannot signup', err);
      res.status(401).send('Nope!');
    });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('loginToken');
  res.send('logged-out!');
});

app.put('/api/user', (req, res) => {
  const loggedinUser = userService.validateToken(req.cookies.loginToken);
  if (!loggedinUser) return res.status(401).send('No logged in user');

  userService.save(loggedinUser)
    .then(user => {
      const token = userService.getLoginToken(user);
      res.cookie('loginToken', token);
      res.send(user);
    });
});

// ✅ Catch-all for React Router
app.get('/**', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  loggerService.info(`🚀 Server listening on http://127.0.0.1:${port}/`);
});