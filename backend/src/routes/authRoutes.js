const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register — สมัครสมาชิก
router.post('/register', authController.register);

// POST /api/auth/login — เข้าสู่ระบบ (คืน JWT Token)
router.post('/login', authController.login);

// GET /api/auth/me — ข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
