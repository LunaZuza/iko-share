require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const userRoutes = require('./routes/userRoutes');
const initSocket = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ปรับแต่ง trust proxy สำหรับใช้งานบน Render / Reverse Proxy
app.set('trust proxy', 1);

app.use(cookieParser());

// ปรับปรุง Helmet เพื่อไม่ให้บล็อกการร้องขอข้าม Origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// กำหนด Origin ที่อนุญาตให้ทำ CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://iko-share.vercel.app',
  'https://carpool-frontend-two.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS — ครอบคลุม preflight OPTIONS สำหรับ https://iko-share.vercel.app
// (Origin header ที่ browser ส่งมาจะเป็นแค่ host (ไม่มี ?fbclid=.../path) ดังนั้น
// การ check ด้วย endsWith('.vercel.app') จึงครอบคลุมทุก deploy/preview domain)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        const error = new Error('Blocked by CORS policy');
        error.status = 403;
        callback(error);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Rate limit — ข้าม OPTIONS preflight เพื่อไม่ให้ถูกบล็อก
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);

// WebSocket (Socket.IO) สำหรับแชทกลุ่มทริป
initSocket(server);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 Handler และ Error Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status >= 500 ? 'เกิดข้อผิดพลาดในระบบ' : err.message,
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Iko Share server running on port ${PORT}`);
});

module.exports = app;
