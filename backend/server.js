// Vercel serverless entry — re-export the real Express app from src/server.js
// (vercel.json กำหนดให้ build ตัวนี้เป็น serverless function)
module.exports = require('./src/server');
