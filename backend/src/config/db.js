const { Pool } = require('pg');


// ตรวจสอบว่ามี DATABASE_URL (สำหรับ Vercel / Neon) หรือไม่
const isProduction = Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10, // จำกัดจำนวน connection สำหรับ Serverless
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

// ป้องกัน Process Crash เมื่อ Connection ที่พูลไว้นานดรอปในระบบ Serverless
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle DB client:', err.message);
});

module.exports = pool;
