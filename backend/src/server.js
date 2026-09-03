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
const carRoutes = require('./routes/carRoutes');
const adminRoutes = require('./routes/adminRoutes');
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

// CORS — เปิด preflight OPTIONS ครบทุก method ทั้ง local และ production (single-domain Vercel)
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
// จัดการ OPTIONS preflight สำหรับทุก path แบบ global (กัน 405 Method Not Allowed)
app.options('*', cors(corsOptions));

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

// Routes — mount ที่ /api/* เป็นหลัก
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/admin', adminRoutes);

// รองรับทั้งกรณี Vercel ตัด (/auth/...) หรือคง (/api/auth/...) prefix ไว้
app.use('/auth', authRoutes);
app.use('/trips', tripRoutes);
app.use('/users', userRoutes);
app.use('/cars', carRoutes);
app.use('/admin', adminRoutes);

// WebSocket (Socket.IO) สำหรับแชทกลุ่มทริป
initSocket(server);

// Health Check (ทั้ง /api/health และ /health)
const healthHandler = (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// 404 Handler และ Error Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: status >= 500 ? 'เกิดข้อผิดพลาดในระบบ' : err.message,
    message: status >= 500
      ? (process.env.NODE_ENV === 'development' ? err.message : 'เกิดข้อผิดพลาดในระบบ')
      : err.message,
  });
});

// บน Vercel (serverless) ห้าม listen เอง — ให้แพลตฟอร์มเรียกใช้ app ที่ export ออกไป
// listen เฉพาะบน local development — บน Vercel (serverless) ให้แพลตฟอร์มเรียกใช้ app ที่ export
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Iko Share server running on port ${PORT}`);
  });
}

module.exports = app;
