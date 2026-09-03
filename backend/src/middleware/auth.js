const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// verifyToken: ยืนยันตัวตนผ่าน JWT แล้วใส่ข้อมูลผู้ใช้ลงใน req.user
// ครอบทั้งหมดใน try/catch เพื่อให้ 401/500 เป็น JSON ที่ถูกต้อง ไม่ crash serverless
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token =
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
        error: 'กรุณาเข้าสู่ระบบ',
        code: 'UNAUTHORIZED',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // ให้ทั้ง req.user.id และ req.userId ใช้ได้เพื่อความเข้ากันได้
    req.user = { id: decoded.id, email: decoded.email };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    const tokenExpired = error && error.name === 'TokenExpiredError';
    const message = tokenExpired
      ? 'Not authorized, token expired'
      : 'Not authorized, token failed';
    return res.status(401).json({
      success: false,
      message,
      error: tokenExpired ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : 'Token ไม่ถูกต้อง',
      code: tokenExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
};

// optionalAuth: ตรวจ token ถ้ามีก็ใส่ req.user แต่ไม่บล็อกถ้าไม่มี (ใช้กับ route สาธารณะ)
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
  } catch (error) {
    // token ไม่ถูกต้อง — ปล่อยผ่านแบบไม่ระบุตัวตน
  }
  next();
};

// isAdmin: ตรวจว่า req.user เป็นแอดมิน (query DB เพื่อความถูกต้องเสมอ)
const isAdmin = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'ไม่พบผู้ใช้' });
    }
    req.user.is_admin = rows[0].is_admin;
    if (req.user.is_admin !== true) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ผู้ดูแลระบบ (Admin)' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyToken, optionalAuth, isAdmin };
