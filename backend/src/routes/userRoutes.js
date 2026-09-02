const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

// GET /api/users/profile/:id — ข้อมูลผู้ใช้พร้อมคะแนน
router.get('/profile/:id', userController.getProfile);

// PUT /api/users/profile — อัปเดต bio (ต้อง auth)
router.put('/profile', verifyToken, userController.updateBio);

// GET /api/users/:id — Route สำรองกัน 404
router.get('/:id', userController.getUserById);

module.exports = router;
