import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { createSocket } from '../services/socket';
import { formatDepartureTime } from '../utils/date';

function TripDetailModal({ tripId, currentUser, onClose, onTripChanged }) {
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let socket;

    const load = async () => {
      try {
        const [tripRes, msgRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/messages`),
        ]);
        if (!mounted) return;
        setTrip(tripRes.data.trip);
        setMembers(tripRes.data.members);
        setMessages(msgRes.data);
      } catch (err) {
        if (mounted) console.error('Failed to load trip detail:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    socket = createSocket();
    socketRef.current = socket;
    socket.on('connect', () => {
      // เข้าร่วมห้องแชท — เฉพาะสมาชิกจะผ่าน (socket server ตรวจสอบ)
      socket.emit('joinTrip', { tripId }, (res) => {
        if (!res?.ok) console.warn('joinTrip failed:', res?.error);
      });
    });
    socket.on('message', (m) => {
      if (mounted) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
    });
    socket.on('connect_error', () => {
      // ถ้า socket เชื่อมไม่ได้ เราจะส่งผ่าน REST แทน (ดู handleSend)
    });

    return () => {
      mounted = false;
      if (socket) {
        socket.emit('leaveTrip', { tripId });
        socket.close();
      }
    };
  }, [tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendViaREST = async (text) => {
    try {
      const res = await api.post(`/trips/${tripId}/messages`, { message: text });
      setMessages((prev) => (prev.some((x) => x.id === res.data.id) ? prev : [...prev, res.data]));
    } catch (err) {
      alert(err.response?.data?.error || 'ส่งข้อความล้มเหลว');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;
    setNewMessage('');

    const socket = socketRef.current;
    if (socket && socket.connected) {
      // ส่งผ่าน Socket.IO — ข้อความจะถูก broadcast กลับมาหาเราเอง ไม่ต้อง append ซ้ำ
      socket.emit('sendMessage', { tripId, message: text }, (res) => {
        if (!res?.ok) sendViaREST(text);
      });
    } else {
      await sendViaREST(text);
    }
  };

  if (loading) {
    return (
      <ModalShell onClose={onClose}>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>กำลังโหลดรายละเอียด...</div>
      </ModalShell>
    );
  }

  const driver = members?.driver;
  const passengers = members?.passengers || [];
  const isPassenger = currentUser && passengers.some((p) => String(p.user_id) === String(currentUser.id));
  // ซ่อนปุ่มออกจากทริปถ้าเป็นผู้ขับเอง (driver)
  const isDriver = trip && currentUser && String(trip.driver_id) === String(currentUser.id);

  const handleLeaveTrip = async () => {
    if (!window.confirm('คุณต้องการออกจากทริปนี้ใช่หรือไม่?')) return;
    try {
      const res = await api.delete(`/trips/${tripId}/leave`);
      alert(res.data.message || 'ออกจากทริปสำเร็จ');
      onTripChanged?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'ไม่สามารถออกจากทริปได้');
    }
  };

  return (
    <ModalShell onClose={onClose} width={720}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>🚗 {trip?.destination}</h3>
        <button onClick={onClose} className="neu-btn" style={{ padding: '6px 14px', fontSize: 13 }}>ปิด</button>
      </div>

      <div className="neu-inset-deep" style={{ padding: 16, borderRadius: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 14, marginBottom: 6 }}>📍 {trip?.origin} → {trip?.destination}</p>
        <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>💰 {Number(trip?.price_seat ?? 0).toFixed(2)} ฿ / คน · 💺 เหลือ {trip?.available_seats} / {trip?.seats}</p>
        {trip?.departure_time && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            ⏰ {formatDepartureTime(trip.departure_time)}
          </p>
        )}
      </div>

      {/* สมาชิกในทริป */}
      <div className="neu-inset" style={{ padding: 18, borderRadius: 20, marginBottom: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>👥 สมาชิกในทริป</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <span className="neu-card" style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {driver?.name?.charAt(0) || 'D'}
            </span>
            <strong>{driver?.name}</strong>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>ผู้ขับ (Driver)</span>
            {driver?.phone && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>· {driver.phone}</span>}
          </div>
          {passengers.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ยังไม่มีผู้โดยสารที่ยืนยันแล้ว</p>
          )}
          {passengers.map((p) => (
            <div key={p.booking_id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
              <span className="neu-card" style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {p.name?.charAt(0)}
              </span>
              <strong>{p.name}</strong>
              {p.location && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>· จุดรับ: {p.location}</span>}
              <span style={{ color: '#38B2AC', fontWeight: 700, fontSize: 12 }}>{p.status === 'confirmed' ? 'ยืนยันแล้ว' : p.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ปุ่มออกจากทริป (เฉพาะผู้โดยสารที่ confirmed แล้ว ไม่ใช่ผู้ขับ) */}
      {isPassenger && !isDriver && (
        <button
          onClick={handleLeaveTrip}
          className="neu-btn-danger"
          style={{ width: '100%', padding: '12px', fontSize: 15, marginBottom: 16 }}
        >
          🚪 ออกจากทริป (Leave Trip)
        </button>
      )}

      {/* แชทกลุ่มทริป */}
      <div className="neu-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ fontSize: 15, fontWeight: 800 }}>💬 แชทกลุ่มทริป</h4>
        <div className="neu-inset-deep" style={{ height: 220, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>ยังไม่มีข้อความ</div>
          )}
          {messages.map((m) => {
            const isMe = currentUser && String(m.user_id) === String(currentUser.id);
            return (
              <div key={m.id} className={isMe ? 'chat-bubble-me' : 'chat-bubble-other'}>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2, fontWeight: 700 }}>{m.full_name}</div>
                <div style={{ fontSize: 14 }}>{m.message}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
          <input
            className="neu-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="neu-btn-primary" style={{ padding: '10px 18px' }}>
            ส่ง
          </button>
        </form>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose, width }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
      <div className="neu-card" style={{ width: '100%', maxWidth: width || 520, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        {children}
      </div>
    </div>
  );
}

export default TripDetailModal;
