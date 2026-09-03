const pool = require('../config/db');

// GET /api/admin/stats — สถิติภาพรวมของแพลตฟอร์ม
exports.getStats = async (req, res) => {
  try {
    const [users, trips, activeBookings, drivers, passengers] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM users'),
      pool.query('SELECT COUNT(*)::int AS c FROM trips'),
      pool.query("SELECT COUNT(*)::int AS c FROM bookings WHERE booking_status IN ('confirmed', 'pending')"),
      pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role IN ('Driver', 'Both')"),
      pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role IN ('Passenger', 'Both')"),
    ]);

    res.json({
      total_users: users.rows[0].c,
      total_trips: trips.rows[0].c,
      active_bookings: activeBookings.rows[0].c,
      total_drivers: drivers.rows[0].c,
      total_passengers: passengers.rows[0].c,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/users — รายชื่อผู้ใช้ทั้งหมด พร้อมบทบาท/is_admin/จำนวนทริป
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.phone, u.role, u.is_admin,
              u.avatar_url, u.created_at,
              COUNT(t.id)::int AS trip_count
       FROM users u
       LEFT JOIN trips t ON t.driver_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/admin/users/:id/role — มอบ/ถอนสิทธิ์แอดมิน หรือเปลี่ยนบทบาท
exports.updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_admin, role } = req.body;

    // กันล็อกตัวเองออกจากระบบแอดมิน
    if (userId === req.user.id && is_admin === false) {
      return res.status(400).json({ error: 'ไม่สามารถถอนสิทธิ์แอดมินของตัวเองได้' });
    }

    let safeRole;
    if (role !== undefined) {
      if (!['Driver', 'Passenger', 'Both'].includes(role)) {
        return res.status(400).json({ error: 'บทบาทไม่ถูกต้อง' });
      }
      safeRole = role;
    }

    if (is_admin !== undefined && role !== undefined) {
      await pool.query('UPDATE users SET is_admin = $1, role = $2 WHERE id = $3', [!!is_admin, safeRole, userId]);
    } else if (is_admin !== undefined) {
      await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [!!is_admin, userId]);
    } else if (role !== undefined) {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [safeRole, userId]);
    } else {
      return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัปเดต' });
    }

    res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/admin/users/:id — ลบผู้ใช้ใด ๆ (cascade bookings/trips/cars)
exports.deleteUser = async (req, res) => {
  const userId = parseInt(req.params.id);

  // กันลบบัญชีตัวเอง (ต้องเช็คก่อนเชื่อม DB เพื่อไม่ให้ release ซ้ำ)
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองผ่านระบบแอดมินได้' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const myTrips = await client.query('SELECT id FROM trips WHERE driver_id = $1', [userId]);
    const tripIds = myTrips.rows.map((r) => r.id);
    if (tripIds.length > 0) {
      await client.query('DELETE FROM user_ratings WHERE trip_id = ANY($1)', [tripIds]);
    }
    await client.query('DELETE FROM user_ratings WHERE rater_id = $1 OR rated_user_id = $1', [userId]);
    await client.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM cars WHERE user_id = $1', [userId]);

    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    await client.query('COMMIT');
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// DELETE /api/admin/trips/:id — ลบ/ยกเลิกทริปใด ๆ บนแพลตฟอร์ม
exports.deleteTrip = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING id', [tripId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบทริป' });
    }
    res.json({ message: 'ลบทริปสำเร็จ' });
  } catch (error) {
    console.error('Admin delete trip error:', error);
    res.status(500).json({ error: error.message });
  }
};
