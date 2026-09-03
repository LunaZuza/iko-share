// Entry point for Vercel Serverless Functions (native /api directory)
// Export Express app instance เพื่อให้ Vercel เรียกใช้โดยไม่บังคับ HTTP method (แก้ 405)
let app;
try {
  app = require('../backend/src/server');
} catch (err) {
  app = require('../backend/server');
}

module.exports = app;
