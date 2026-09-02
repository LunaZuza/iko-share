const pool = require('../config/db');

// ประกอบข้อมูลโปรไฟล์ + คะแนนรีวิว
const buildProfile = async (id) => {
  const userResult = await pool.query(
    'SELECT id, full_name, email, avatar_url, bio, phone, role, created_at FROM users WHERE id = $1',
    [id]
  );
  if (userResult.rows.length === 0) return null;

  const user = userResult.rows[0];
  let avg_rating = 5.0;
  let total_reviews = 0;

  try {
    const ratingResult = await pool.query(
      'SELECT AVG(rating)::numeric(10,1) AS avg_rating, COUNT(*) AS total_reviews FROM user_ratings WHERE rated_user_id = $1',
      [id]
    );
    if (ratingResult.rows[0].avg_rating !== null) {
      avg_rating = parseFloat(ratingResult.rows[0].avg_rating);
      total_reviews = parseInt(ratingResult.rows[0].total_reviews);
    }
  } catch (e) {
    // ป้องกัน Error หากยังไม่ได้สร้างตาราง user_ratings
  }

  return { ...user, avg_rating, total_reviews };
};

// GET /api/users/profile/:id — ดึงข้อมูลผู้ใช้ รวม avg_rating และ total_reviews
exports.getProfile = async (req, res) => {
  try {
    const profile = await buildProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/:id — Route สำรองกัน 404
exports.getUserById = async (req, res) => {
  try {
    const profile = await buildProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json(profile);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/users/profile — อัปเดต bio (เฉพาะผู้ใช้ปัจจุบัน)
exports.updateBio = async (req, res) => {
  try {
    const { bio, phone, role } = req.body;
    const safeRole = ['Driver', 'Passenger', 'Both'].includes(role) ? role : null;

    await pool.query(
      'UPDATE users SET bio = $1, phone = COALESCE($2, phone), role = COALESCE($3, role) WHERE id = $4',
      [bio || '', phone || null, safeRole, req.user.id]
    );
    res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('Update bio error:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
  }
};
