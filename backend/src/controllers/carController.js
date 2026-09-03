const pool = require('../config/db');

// GET /api/cars/my-cars — รถยนต์ทั้งหมดของผู้ใช้ปัจจุบัน
exports.getMyCars = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, license_plate, model, color, capacity, created_at FROM cars WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get my cars error:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรถยนต์ได้' });
  }
};

// POST /api/cars — เพิ่มรถยนต์ใหม่
exports.createCar = async (req, res) => {
  try {
    const { model, color, license_plate, capacity } = req.body;

    if (!model || !license_plate) {
      return res.status(400).json({ error: 'กรุณากรอกยี่ห้อ/รุ่นรถ และทะเบียนรถ' });
    }

    const capacityNum = Math.max(1, parseInt(capacity) || 4);
    if (capacityNum < 1 || capacityNum > 20) {
      return res.status(400).json({ error: 'จำนวนที่นั่งต้องอยู่ระหว่าง 1-20' });
    }

    const existing = await pool.query('SELECT id FROM cars WHERE license_plate = $1', [license_plate]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'ทะเบียนรถนี้ถูกใช้งานแล้ว' });
    }

    const result = await pool.query(
      `INSERT INTO cars (user_id, license_plate, model, color, capacity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, license_plate, model, color, capacity, created_at`,
      [req.user.id, license_plate, model, color || null, capacityNum]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create car error:', error);
    res.status(500).json({ error: 'ไม่สามารถเพิ่มรถยนต์ได้' });
  }
};
