import { io } from 'socket.io-client';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Socket เชื่อมกับ host เดียวกับ API (ตัด '/api' ออก)
const SOCKET_URL = API.replace(/\/api\/?$/, '');

export const createSocket = () => {
  const token = localStorage.getItem('token');
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 3,
  });
};
