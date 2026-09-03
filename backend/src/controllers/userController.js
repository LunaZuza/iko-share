const pool = require('../config/db');
const { userResponse, parseUserId } = require('../utils/user');

// ประกอบข้อมูลโปรไฟล์ + คะแนนรีวิว
const buildProfile = async (id) => {
  const userResult = await pool.query(
    'SELECT id, full_name, email, avatar_url, bio, phone, role, is_admin, created_at FROM users WHERE id = $1',
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
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }
    const profile = await buildProfile(userId);
    if (!profile) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json(userResponse(profile));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/users/:id — Route สำรองกัน 404
exports.getUserById = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }
    const profile = await buildProfile(userId);
    if (!profile) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json(userResponse(profile));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/users/profile — อัปเดตโปรไฟล์ (เฉพาะผู้ใช้ปัจจุบัน)
// รองรับ full_name, phone, role, avatar_url, bio (backward compatible กับ bio เดิม)
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, role, avatar_url, bio } = req.body;

    if (full_name != null && String(full_name).trim() === '') {
      return res.status(400).json({ error: 'ชื่อไม่สามารถว่างได้' });
    }
    const safeRole = ['Driver', 'Passenger', 'Both'].includes(role) ? role : null;

    await pool.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         role = COALESCE($3, role),
         avatar_url = COALESCE($4, avatar_url),
         bio = COALESCE($5, bio)
       WHERE id = $6`,
      [full_name || null, phone || null, safeRole, avatar_url || null, bio || null, req.user.id]
    );

    const userResult = await pool.query(
      'SELECT id, full_name, email, avatar_url, bio, phone, role, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ', ...userResponse(userResult.rows[0]) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
  }
};

// DELETE /api/users/me — ลบบัญชีผู้ใช้ (จ่ายบัญชี + ข้อมูลที่เกี่ยวข้อง)
exports.deleteAccount = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    await client.query('BEGIN');

    // 1) ลบรีวิวที่เกี่ยวกับผู้ใช้รายนี้ หรืออยู่บนทริปของเขา (เพราะ FK ไม่ cascade)
    const myTrips = await client.query('SELECT id FROM trips WHERE driver_id = $1', [userId]);
    const tripIds = myTrips.rows.map((r) => r.id);
    if (tripIds.length > 0) {
      await client.query('DELETE FROM user_ratings WHERE trip_id = ANY($1)', [tripIds]);
    }
    await client.query('DELETE FROM user_ratings WHERE rater_id = $1 OR rated_user_id = $1', [userId]);

    // 2) ลบ booking ที่ผู้ใช้เป็นผู้โดยสาร
    await client.query('DELETE FROM bookings WHERE user_id = $1', [userId]);

    // 3) ลบรถของผู้ใช้ (ทริปที่ชี้ license_plate จะถูก SET NULL ผ่าน FK)
    await client.query('DELETE FROM cars WHERE user_id = $1', [userId]);

    // 4) ลบผู้ใช้ (cascade ลบ trips ที่เป็น driver, trip_messages ของเขา ฯลฯ)
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    await client.query('COMMIT');
    res.json({ message: 'ลบบัญชีสำเร็จ' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'ไม่สามารถลบบัญชีได้' });
  } finally {
    client.release();
  }
};
