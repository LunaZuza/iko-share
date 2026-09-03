const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const tripController = require('../controllers/tripController');

// GET /api/trips — ดึงทริปทั้งหมด (ถ้ามี token จะแนบ user_role_in_trip)
router.get('/', optionalAuth, tripController.getTrips);

// POST /api/trips — สร้างทริปใหม่ (ต้อง auth)
router.post('/', verifyToken, tripController.createTrip);

// GET /api/trips/my-trips — ทริปที่ฉันสร้าง + ทริปที่ฉันเข้าร่วม (ต้อง auth)
router.get('/my-trips', verifyToken, tripController.getMyTrips);

// GET /api/trips/joined — ทริปที่ฉันเข้าร่วมเป็นผู้โดยสาร (ต้อง auth)
router.get('/joined', verifyToken, tripController.getJoinedTrips);

// GET /api/trips/:id — รายละเอียดทริป + สมาชิก (ต้อง auth)
router.get('/:id', verifyToken, tripController.getTripById);

// POST /api/trips/:id/join — เข้าร่วมทริป (ต้อง auth)
router.post('/:id/join', verifyToken, tripController.joinTrip);

// DELETE /api/trips/:id — ลบทริป เฉพาะเจ้าของ (ต้อง auth)
router.delete('/:id', verifyToken, tripController.deleteTrip);

// DELETE /api/trips/:id/leave — ออกจากทริป (เฉพาะผู้โดยสาร, ต้อง auth)
router.delete('/:id/leave', verifyToken, tripController.leaveTrip);

// GET /api/trips/:id/messages — ดึงข้อความแชท (เฉพาะสมาชิก, ต้อง auth)
router.get('/:id/messages', verifyToken, tripController.getMessages);

// POST /api/trips/:id/messages — ส่งข้อความแชท (เฉพาะสมาชิก, ต้อง auth)
router.post('/:id/messages', verifyToken, tripController.postMessage);

module.exports = router;
