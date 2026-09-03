import { io } from 'socket.io-client';

const API =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
// Socket เชื่อมกับ origin เดียวกันกับ API (ตัด '/api' ออก)
// — กรณี relative '/api' จะเป็น '' (เชื่อม origin ปัจจุบัน), กรณี absolute เป็น host เดียวกับ API
const SOCKET_URL = API.startsWith('/') ? '' : API.replace(/\/api\/?$/, '');

export const createSocket = () => {
  const token = localStorage.getItem('token');
  return io(SOCKET_URL || undefined, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 3,
  });
};
