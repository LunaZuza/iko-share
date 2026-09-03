const pool = require('../config/db');

// คอลัมน์ที่ใช้ร่วมกันสำหรับ query ทริป (alias ให้ Frontend ใช้ `price`, `trip_id`)
// departure_time: ตีความค่า wall-clock ที่เก็บไว้เป็นเวลากรุงเทพ (UTC+7) แล้วแปลงเป็น UTC
// เพื่อให้ Frontend แสดงกลับเป็นเวลากรุงเทพได้ถูกต้อง (แก้บัค +7 ชั่วโมง)
const TRIP_COLS = `
  t.id, t.id AS trip_id, t.driver_id, t.car_id, t.license_plate, t.event_id,
  t.origin, t.destination, t.available_seats, t.seats,
  t.price_seat, t.price_seat AS price,
  (t.departure_time AT TIME ZONE 'Asia/Bangkok') AS departure_time, t.created_at,
  c.model AS car_model, c.color AS car_color,
  u.full_name AS driver_name, u.avatar_url AS driver_avatar,
  u.phone AS driver_phone, u.role AS driver_role
`;

const TRIP_SELECT = `SELECT ${TRIP_COLS} FROM trips t JOIN users u ON t.driver_id = u.id LEFT JOIN cars c ON t.car_id = c.id`;

// ตรวจว่าผู้ใช้เป็นสมาชิกของทริป (driver หรือ passenger ที่ confirmed แล้ว)
const isTripMember = async (tripId, userId) => {
  const trip = await pool.query('SELECT driver_id FROM trips WHERE id = $1', [tripId]);
  if (trip.rows.length === 0) return { member: false, trip: null, role: null };
  const driverId = String(trip.rows[0].driver_id);
  if (driverId === String(userId)) {
    return { member: true, trip: trip.rows[0], role: 'driver' };
  }
  const bk = await pool.query(
    "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'confirmed'",
    [tripId, userId]
  );
  if (bk.rows.length > 0) {
    return { member: true, trip: trip.rows[0], role: 'passenger' };
  }
  return { member: false, trip: trip.rows[0], role: null };
};

// GET /api/trips — ดึงทริปทั้งหมด พร้อม driver_name/driver_id และ user_role_in_trip (ถ้ามี token)
exports.getTrips = async (req, res) => {
  try {
    // แสดงทริปที่ยัง"ใช้งาน": ยังไม่ถึงเวลาออกเดินทาง หรือเพิ่งออกไปไม่เกิน 1 ชั่วโมง
    // (ใช้เวลากรุงเทพ / UTC+7 ผ่าน AT TIME ZONE เพื่อไม่ให้เพี้ยนจาก NOW())
    const result = await pool.query(
      `${TRIP_SELECT}
       WHERE t.departure_time IS NULL
          OR (t.departure_time AT TIME ZONE 'Asia/Bangkok') >= NOW() - INTERVAL '1 hour'
       ORDER BY t.created_at DESC`
    );
    let trips = result.rows;
    const userId = req.user?.id;

    if (userId != null) {
      const tripIds = trips.map((t) => t.id);
      const confirmedSet = new Set();
      if (tripIds.length > 0) {
        const bks = await pool.query(
          "SELECT trip_id FROM bookings WHERE user_id = $1 AND booking_status = 'confirmed' AND trip_id = ANY($2)",
          [userId, tripIds]
        );
        bks.rows.forEach((b) => confirmedSet.add(String(b.trip_id)));
      }
      trips = trips.map((t) => ({
        ...t,
        user_role_in_trip:
          String(t.driver_id) === String(userId)
            ? 'driver'
            : confirmedSet.has(String(t.id))
            ? 'passenger'
            : null,
      }));
    }

    res.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// GET /api/trips/:id — รายละเอียดทริป + สมาชิกทั้งหมด (driver + passengers ที่ confirmed)
exports.getTripById = async (req, res) => {
  try {
    const tripResult = await pool.query(`${TRIP_SELECT} WHERE t.id = $1`, [req.params.id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบทริป' });
    }
    const trip = tripResult.rows[0];

    const passengerResult = await pool.query(
      `SELECT b.booking_id, b.user_id, u.full_name AS name, u.phone, u.role,
              b.booking_status AS status, b.location, b.booking_time
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trips t ON b.trip_id = t.id
       WHERE b.trip_id = $1 AND b.booking_status = 'confirmed' AND b.user_id != t.driver_id
       ORDER BY b.booking_time ASC`,
      [req.params.id]
    );

    const members = {
      driver: {
        user_id: trip.driver_id,
        name: trip.driver_name,
        phone: trip.driver_phone,
        role: trip.driver_role,
        avatar_url: trip.driver_avatar,
      },
      passengers: passengerResult.rows,
    };

    res.json({ trip, members });
  } catch (error) {
    console.error('Get trip by id error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// POST /api/trips — สร้างทริปใหม่ (ต้อง auth)
exports.createTrip = async (req, res) => {
  try {
    const { origin, destination, price, seats, departure_time, license_plate, car_id, event_id } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'กรุณากรอกจุดเริ่มต้นและปลายทางให้ครบถ้วน' });
    }

    const seatCount = Math.max(1, parseInt(seats) || 1);
    if (seatCount < 1 || seatCount > 20) {
      return res.status(400).json({ error: 'จำนวนที่นั่งต้องอยู่ระหว่าง 1-20' });
    }

    // ลิงก์รถผ่าน car_id (ถ้าให้มา) — ต้องเป็นรถของผู้ใช้เองเท่านั้น แล้วดึง license_plate มาด้วย
    let plate = license_plate || null;
    let carId = car_id || null;
    if (carId) {
      const carCheck = await pool.query('SELECT id, license_plate FROM cars WHERE id = $1 AND user_id = $2', [carId, req.user.id]);
      if (carCheck.rows.length === 0) {
        return res.status(400).json({ error: 'ไม่พบรถยนต์หรือรถไม่ใช่ของผู้ใช้ท่านนี้' });
      }
      plate = carCheck.rows[0].license_plate;
    } else if (plate) {
      // backward compatible: ผูก license_plate เฉพาะถ้ามีรถจริงในตาราง cars
      const carCheck = await pool.query('SELECT id FROM cars WHERE license_plate = $1 AND user_id = $2', [plate, req.user.id]);
      if (carCheck.rows.length === 0) {
        // ไม่ใช่รถของผู้ใช้ ให้คงเป็น null (กัน FK error)
        plate = null;
      } else {
        carId = carCheck.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO trips
         (driver_id, origin, destination, price_seat, seats, available_seats, departure_time, license_plate, car_id, event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        req.user.id,
        origin,
        destination,
        price || 0,
        seatCount,
        seatCount,
        departure_time || null,
        plate,
        carId,
        event_id || null,
      ]
    );

    const trip = result.rows[0];
    const creator = await pool.query(
      'SELECT full_name AS driver_name, avatar_url AS driver_avatar, phone AS driver_phone, role AS driver_role FROM users WHERE id = $1',
      [req.user.id]
    );
    res.status(201).json({
      ...trip,
      price: trip.price_seat,
      trip_id: trip.id,
      ...creator.rows[0],
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างทริปได้' });
  }
};

// POST /api/trips/:id/join — เข้าร่วมทริป (สร้าง booking + ลด available_seats)
exports.joinTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const tripId = parseInt(req.params.id);
    const userId = req.user.id;
    const { location } = req.body;

    await client.query('BEGIN');

    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบทริป' });
    }
    const trip = tripResult.rows[0];

    if (String(trip.driver_id) === String(userId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'คุณไม่สามารถเข้าร่วมทริปของตัวเองได้' });
    }

    if (trip.available_seats < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ที่นั่งเต็มแล้ว' });
    }

    const existing = await client.query(
      'SELECT booking_id, booking_status FROM bookings WHERE trip_id = $1 AND user_id = $2',
      [tripId, userId]
    );
    if (existing.rows.length > 0) {
      const booking = existing.rows[0];
      // ถ้าเคยออก (cancelled) แล้ว ให้ reactivate ได้
      if (booking.booking_status === 'cancelled') {
        await client.query(
          "UPDATE bookings SET booking_status = 'confirmed', booking_time = NOW(), location = COALESCE($1, location) WHERE booking_id = $2",
          [location || null, booking.booking_id]
        );
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'คุณเข้าร่วมทริปนี้แล้ว' });
      }
    } else {
      await client.query(
        "INSERT INTO bookings (user_id, trip_id, booking_status, location) VALUES ($1, $2, 'confirmed', $3)",
        [userId, tripId, location || null]
      );
    }

    const updated = await client.query(
      'UPDATE trips SET available_seats = available_seats - 1 WHERE id = $1 RETURNING *',
      [tripId]
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

// DELETE /api/trips/:id/leave — ออกจากทริป (เฉพาะผู้โดยสารที่ confirmed แล้ว)
exports.leaveTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const tripId = parseInt(req.params.id);
    const userId = req.user.id;

    await client.query('BEGIN');

    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบทริป' });
    }

    if (String(tripResult.rows[0].driver_id) === String(userId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ผู้ขับไม่สามารถออกจากทริปของตัวเองได้' });
    }

    const bk = await client.query(
      "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'confirmed'",
      [tripId, userId]
    );
    if (bk.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'คุณไม่ได้เข้าร่วมทริปนี้' });
    }

    // เปลี่ยนสถานะเป็น cancelled (เก็บประวัติไว้) แล้วคืนที่นั่ง
    await client.query(
      "UPDATE bookings SET booking_status = 'cancelled' WHERE trip_id = $1 AND user_id = $2",
      [tripId, userId]
    );
    const updated = await client.query(
      'UPDATE trips SET available_seats = available_seats + 1 WHERE id = $1 RETURNING *',
      [tripId]
    );

    await client.query('COMMIT');
    res.json({
      message: 'ออกจากทริปสำเร็จ',
      trip: updated.rows[0],
      available_seats: updated.rows[0].available_seats,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Leave trip error:', error);
    res.status(500).json({ error: 'ไม่สามารถออกจากทริปได้' });
  } finally {
    client.release();
  }
};

// GET /api/trips/my-trips — ทริปที่ฉันสร้าง (driver) + ทริปที่ฉันเข้าร่วม (passenger)
exports.getMyTrips = async (req, res) => {
  try {
    const driverTrips = await pool.query(
      `${TRIP_SELECT} WHERE t.driver_id = $1 ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    const passengerTrips = await pool.query(
      `SELECT ${TRIP_COLS}
       FROM bookings b
       JOIN trips t ON b.trip_id = t.id
       JOIN users u ON t.driver_id = u.id
       LEFT JOIN cars c ON t.car_id = c.id
       WHERE b.user_id = $1 AND b.booking_status IN ('confirmed', 'pending')
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const asDriver = driverTrips.rows.map((t) => ({ ...t, user_role_in_trip: 'driver' }));
    const asPassenger = passengerTrips.rows.map((t) => ({ ...t, user_role_in_trip: 'passenger' }));

    res.json([...asDriver, ...asPassenger]);
  } catch (error) {
    console.error('Get my trips error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// GET /api/trips/joined — ทริปที่ฉันเข้าร่วมเป็นผู้โดยสาร (compat)
exports.getJoinedTrips = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${TRIP_COLS}
       FROM bookings b
       JOIN trips t ON b.trip_id = t.id
       JOIN users u ON t.driver_id = u.id
       LEFT JOIN cars c ON t.car_id = c.id
       WHERE b.user_id = $1 AND b.booking_status = 'confirmed'
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows.map((t) => ({ ...t, user_role_in_trip: 'passenger' })));
  } catch (error) {
    console.error('Get joined trips error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลทริปได้' });
  }
};

// GET /api/trips/:id/messages — ดึงข้อความแชท (เฉพาะสมาชิกทริป)
exports.getMessages = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const check = await isTripMember(tripId, req.user.id);
    if (!check.member) {
      return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของทริปนี้' });
    }
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

// POST /api/trips/:id/messages — ส่งข้อความแชท (เฉพาะสมาชิกทริป)
exports.postMessage = async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);
    const { message } = req.body;

    const check = await isTripMember(tripId, req.user.id);
    if (!check.member) {
      return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของทริปนี้' });
    }
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
