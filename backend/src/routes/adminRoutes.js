const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// ทุก route ใน /api/admin ต้องเข้าสู่ระบบ + เป็นแอดมิน
router.use(verifyToken, isAdmin);

// GET /api/admin/stats
router.get('/stats', adminController.getStats);

// GET /api/admin/users
router.get('/users', adminController.getUsers);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', adminController.updateUser);

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

// DELETE /api/admin/trips/:id
router.delete('/trips/:id', adminController.deleteTrip);

module.exports = router;
