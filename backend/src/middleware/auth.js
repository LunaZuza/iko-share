const jwt = require('jsonwebtoken');

// verifyToken: ยืนยันตัวตนผ่าน JWT แล้วใส่ข้อมูลผู้ใช้ลงใน req.user
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token =
    authHeader?.replace('Bearer ', '') || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      error: 'กรุณาเข้าสู่ระบบ',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ให้ทั้ง req.user.id และ req.userId ใช้ได้เพื่อความเข้ากันได้
    req.user = { id: decoded.id, email: decoded.email };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: 'Token ไม่ถูกต้อง',
      code: 'INVALID_TOKEN',
    });
  }
};

module.exports = { verifyToken };
