const pool = require('../config/db');

// GET /api/trips — ดึงทริปทั้งหมด รวม driver_name และ driver_id
exports.getTrips = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.full_name AS driver_name, u.avatar_url AS driver_avatar
       FROM trips t
       JOIN users u ON t.driver_id = u.id
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// POST /api/trips — สร้างทริปใหม่ (ต้องผ่าน verifyToken)
exports.createTrip = async (req, res) => {
  try {
    const { origin, destination, price, seats, departure_time } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'กรุณากรอกจุดเริ่มต้นและปลายทางให้ครบถ้วน' });
    }

    const seatCount = Math.max(1, parseInt(seats) || 1);
    if (seatCount < 1 || seatCount > 20) {
      return res.status(400).json({ error: 'จำนวนที่นั่งต้องอยู่ระหว่าง 1-20' });
    }

    const result = await pool.query(
      `INSERT INTO trips (driver_id, origin, destination, price, seats, available_seats, departure_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        origin,
        destination,
        price || 0,
        seatCount,
        seatCount,
        departure_time || null,
      ]
    );

    const trip = result.rows[0];
    const creatorResult = await pool.query(
      'SELECT full_name AS driver_name, avatar_url AS driver_avatar FROM users WHERE id = $1',
      [req.user.id]
    );
    res.status(201).json({ ...trip, ...creatorResult.rows[0] });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างทริปได้' });
  }
};

// POST /api/trips/:id/join — เข้าร่วมทริป (ลด available_seats)
exports.joinTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const tripId = parseInt(req.params.id);
    const userId = req.user.id;
    const seats = Math.max(1, parseInt(req.body?.seats) || 1);

    await client.query('BEGIN');

    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบทริป' });
    }
    const trip = tripResult.rows[0];

    if (trip.driver_id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'คุณไม่สามารถเข้าร่วมทริปของตัวเองได้' });
    }

    if (trip.available_seats < seats) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `ที่นั่งไม่พอ เหลือ ${trip.available_seats} ที่นั่ง` });
    }

    const existing = await client.query(
      'SELECT id FROM trip_passengers WHERE trip_id = $1 AND user_id = $2',
      [tripId, userId]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'คุณเข้าร่วมทริปนี้แล้ว' });
    }

    await client.query(
      'INSERT INTO trip_passengers (trip_id, user_id) VALUES ($1, $2)',
      [tripId, userId]
    );

    const updated = await client.query(
      'UPDATE trips SET available_seats = available_seats - $1 WHERE id = $2 RETURNING *',
      [seats, tripId]
    );

    await client.query('COMMIT');
    res.json({
      message: 'เข้าร่วมทริปสำเร็จ',
      trip: updated.rows[0],
      available_seats: updated.rows[0].available_seats,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Join trip error:', error);
    res.status(500).json({ error: 'ไม่สามารถเข้าร่วมทริปได้' });
  } finally {
    client.release();
  }
};

// DELETE /api/trips/:id — ลบทริป (เฉพาะเจ้าของทริป)
exports.deleteTrip = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM trips WHERE id = $1 AND driver_id = $2 RETURNING id',
      [tripId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบทริปนี้' });
    }
    res.json({ message: 'ลบทริปสำเร็จ' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'ไม่สามารถลบทริปได้' });
  }
};

// GET /api/trips/my-trips — ทริปที่ฉันสร้าง
exports.getMyTrips = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.full_name AS driver_name, u.avatar_url AS driver_avatar
       FROM trips t JOIN users u ON t.driver_id = u.id
       WHERE t.driver_id = $1 ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// GET /api/trips/joined — ทริปที่ฉันเข้าร่วม
exports.getJoinedTrips = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.full_name AS driver_name, u.avatar_url AS driver_avatar
       FROM trip_passengers tp
       JOIN trips t ON tp.trip_id = t.id
       JOIN users u ON t.driver_id = u.id
       WHERE tp.user_id = $1 ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get joined trips error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// GET /api/trips/:id/messages — ดึงข้อความแชทในทริป
exports.getMessages = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const result = await pool.query(
      `SELECT m.id, m.message, m.created_at, u.id AS user_id, u.full_name, u.avatar_url
       FROM trip_messages m JOIN users u ON m.user_id = u.id
       WHERE m.trip_id = $1 ORDER BY m.created_at ASC`,
      [tripId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อความได้' });
  }
};

// POST /api/trips/:id/messages — ส่งข้อความแชทในทริป
exports.postMessage = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'กรุณากรอกข้อความ' });
    }

    const result = await pool.query(
      'INSERT INTO trip_messages (trip_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
      [tripId, req.user.id, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ error: 'ไม่สามารถส่งข้อความได้' });
  }
};
