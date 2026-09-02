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

export default api;
