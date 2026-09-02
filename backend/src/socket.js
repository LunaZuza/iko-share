const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');

// ตรวจว่า user เป็นสมาชิกทริป (driver หรือ passenger ที่ confirmed แล้ว)
const isTripMember = async (tripId, userId) => {
  const trip = await pool.query('SELECT driver_id FROM trips WHERE id = $1', [tripId]);
  if (trip.rows.length === 0) return { member: false, role: null };
  const driverId = String(trip.rows[0].driver_id);
  if (driverId === String(userId)) return { member: true, role: 'driver' };
  const bk = await pool.query(
    "SELECT booking_id FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status = 'confirmed'",
    [tripId, userId]
  );
  if (bk.rows.length > 0) return { member: true, role: 'passenger' };
  return { member: false, role: null };
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  });

  // Socket authorization — ยืนยันตัวตนด้วย JWT ก่อนเชื่อมต่อ
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = { id: decoded.id, email: decoded.email };
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;

    // เข้าร่วมห้องแชทของทริป — เฉพาะสมาชิก
    socket.on('joinTrip', async ({ tripId } = {}, callback) => {
      try {
        const check = await isTripMember(tripId, userId);
        if (!check.member) {
          return typeof callback === 'function' && callback({ ok: false, error: 'ไม่ใช่สมาชิกของทริปนี้' });
        }
        socket.join(`trip:${tripId}`);
        return typeof callback === 'function' && callback({ ok: true });
      } catch (err) {
        return typeof callback === 'function' && callback({ ok: false, error: 'server error' });
      }
    });

    socket.on('leaveTrip', async ({ tripId } = {}) => {
      if (tripId != null) socket.leave(`trip:${tripId}`);
    });

    // ส่งข้อความ — เฉพาะสมาชิก
    socket.on('sendMessage', async ({ tripId, message } = {}, callback) => {
      try {
        const check = await isTripMember(tripId, userId);
        if (!check.member) {
          return typeof callback === 'function' && callback({ ok: false, error: 'ไม่ใช่สมาชิกของทริปนี้' });
        }
        if (!message || !String(message).trim()) {
          return typeof callback === 'function' && callback({ ok: false, error: 'กรุณากรอกข้อความ' });
        }

        const insert = await pool.query(
          'INSERT INTO trip_messages (trip_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
          [tripId, userId, message]
        );
        const sender = await pool.query(
          'SELECT id AS user_id, full_name, avatar_url FROM users WHERE id = $1',
          [userId]
        );
        const payload = { ...insert.rows[0], ...sender.rows[0] };
        io.to(`trip:${tripId}`).emit('message', payload);
        return typeof callback === 'function' && callback({ ok: true, message: payload });
      } catch (err) {
        return typeof callback === 'function' && callback({ ok: false, error: 'server error' });
      }
    });

    socket.on('disconnect', () => {
      // ไม่ต้องทำอะไรเป็นพิเศษ
    });
  });

  return io;
};

module.exports = initSocket;
