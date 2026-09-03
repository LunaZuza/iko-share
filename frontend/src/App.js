import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import Profile from './pages/Profile';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 50 }}>กำลังโหลด...</div>;
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
