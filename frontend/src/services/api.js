import axios from 'axios';

// ตั้งค่า REACT_APP_API_URL ในไฟล์ .env หรือ env ของ Vercel เพื่อชี้ไปยัง Backend จริง
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// แนบ JWT Token ไปกับทุก request ผ่าน Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — logout ก่อนเวลา (auto-logout) ต้องเกิดจาก 401 เท่านั้น
// ไม่ redirect/logout บน 500/502/503/504, ERR_NETWORK หรือ timeout (ECONNABORTED)
// เพื่อให้ผู้ใช้ยัง login ค้างไว้ระหว่างที่ Render/Neon กำลังเริ่มต้นทำงาน
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
