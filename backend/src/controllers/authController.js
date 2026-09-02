const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register — สมัครสมาชิก
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, avatar_url, phone, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const safeRole = ['Driver', 'Passenger', 'Both'].includes(role) ? role : 'Both';
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, avatar_url, bio, phone, role)
       VALUES ($1, $2, $3, $4, '', $5, $6)
       RETURNING id, full_name, email, avatar_url, bio, phone, role, created_at`,
      [full_name, email, password_hash, avatar_url || null, phone || null, safeRole]
    );

    const user = result.rows[0];
    const token = generateToken({ id: user.id, email: user.email });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'ไม่สามารถสมัครสมาชิกได้' });
  }
};

// POST /api/auth/login — เข้าสู่ระบบ (คืน JWT Token)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ไม่สามารถเข้าสู่ระบบได้' });
  }
};

// GET /api/auth/me — ข้อมูลผู้ใช้ปัจจุบัน
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, avatar_url, bio, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
