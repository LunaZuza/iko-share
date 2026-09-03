const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const carController = require('../controllers/carController');

// GET /api/cars/my-cars — รถยนต์ของผู้ใช้ปัจจุบัน (ต้อง auth)
router.get('/my-cars', verifyToken, carController.getMyCars);

// POST /api/cars — เพิ่มรถยนต์ใหม่ (ต้อง auth)
router.post('/', verifyToken, carController.createCar);

module.exports = router;
