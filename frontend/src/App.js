import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import api from './services/api';
import { normalizeUser } from './utils/user';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverNotice, setServerNotice] = useState('');
  const retryRef = useRef(null);

  // อัปเดต user state + แคชลง localStorage (ทำให้ ค่าคงที่ต่อ session)
  const cacheUser = (raw) => {
    const u = normalizeUser(raw);
    if (u) {
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return () => { mounted = false; };
    }

    // ใช้ user ที่แคชไว้ตั้งต้น (กัน /profile/undefined ระหว่างโหลด)
    try {
      const cached = localStorage.getItem('user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id || parsed.user_id)) setUser(parsed);
      }
    } catch (e) { /* ignore */ }

    const loadUser = async (attempt = 1) => {
      try {
        const res = await api.get('/auth/me');
        if (!mounted) return;
        cacheUser(res.data);
        setServerNotice('');
        setLoading(false);
      } catch (err) {
        const status = err.response?.status;
        if (!mounted) return;

        // เฉพาะ 401 เท่านั้นที่ logout — 5xx / ERR_NETWORK / timeout ไม่ logout
        if (status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setServerNotice('');
          setLoading(false);
        } else if (attempt < 5) {
          // เซิร์ฟเวอร์เพิ่งตื่น (cold start) — คง login ไว้ แล้ว retry ทีหลัง
          setServerNotice('เซิร์ฟเวอร์กำลังเริ่มต้นทำงาน กรุณารอสักครู่...');
          retryRef.current = setTimeout(() => loadUser(attempt + 1), 4000);
        } else {
          // หมดจำนวน retry แล้ว แต่ไม่ logout — ค้างหน้า boot ให้ผู้ใช้ลองใหม่เอง
          setServerNotice('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณารีเฟรชหน้านี้');
          setLoading(true);
        }
      }
    };

    loadUser();
    return () => {
      mounted = false;
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const handleLogin = (userData) => {
    cacheUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleUserUpdated = (updatedUser) => {
    cacheUser(updatedUser);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ fontSize: 44 }}>🚗</div>
        <p style={{ marginTop: 16, color: serverNotice ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, textAlign: 'center', maxWidth: 420, fontSize: 15 }}>
          {serverNotice || 'กำลังโหลด...'}
        </p>
      </div>
    );
  }

  const isAuthenticated = !!localStorage.getItem('token') && !!user;

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/" element={isAuthenticated ? <Home currentUser={user} /> : <Navigate to="/login" replace />} />
        <Route path="/create-trip" element={isAuthenticated ? <CreateTrip /> : <Navigate to="/login" replace />} />
        <Route path="/my-trips" element={isAuthenticated ? <MyTrips currentUser={user} /> : <Navigate to="/login" replace />} />
        <Route path="/profile/:id" element={isAuthenticated ? <Profile currentUser={user} onUserUpdated={handleUserUpdated} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={isAuthenticated && user?.is_admin ? <AdminDashboard /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
