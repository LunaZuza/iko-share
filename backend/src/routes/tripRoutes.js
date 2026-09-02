const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const tripController = require('../controllers/tripController');

// GET /api/trips — ดึงทริปทั้งหมด
router.get('/', tripController.getTrips);

// POST /api/trips — สร้างทริปใหม่ (ต้อง auth)
router.post('/', verifyToken, tripController.createTrip);

// GET /api/trips/my-trips — ทริปของฉัน (ต้อง auth)
router.get('/my-trips', verifyToken, tripController.getMyTrips);

// GET /api/trips/joined — ทริปที่ฉันเข้าร่วม (ต้อง auth)
router.get('/joined', verifyToken, tripController.getJoinedTrips);

// POST /api/trips/:id/join — เข้าร่วมทริป (ต้อง auth)
router.post('/:id/join', verifyToken, tripController.joinTrip);

// DELETE /api/trips/:id — ลบทริป เฉพาะเจ้าของ (ต้อง auth)
router.delete('/:id', verifyToken, tripController.deleteTrip);

// GET /api/trips/:id/messages — ดึงข้อความแชท (ต้อง auth)
router.get('/:id/messages', verifyToken, tripController.getMessages);

// POST /api/trips/:id/messages — ส่งข้อความแชท (ต้อง auth)
router.post('/:id/messages', verifyToken, tripController.postMessage);

module.exports = router;
