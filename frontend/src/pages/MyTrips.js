import React, { useState, useEffect } from 'react';
import api from '../services/api';

function MyTrips({ currentUser }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatTrip, setActiveChatTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips/my-trips');
      setTrips(res.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบทริปนี้อย่างถาวร?')) return;
    try {
      await api.delete(`/trips/${tripId}`);
      alert('ลบทริปเรียบร้อยแล้ว');
      fetchTrips();
    } catch (error) {
      alert(error.response?.data?.error || 'ไม่สามารถลบทริปได้');
    }
  };

  const openChat = async (trip) => {
    setActiveChatTrip(trip);
    try {
      const res = await api.get(`/trips/${trip.id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post(`/trips/${activeChatTrip.id}/messages`, { message: newMessage });
      setMessages([...messages, { ...res.data, full_name: currentUser?.full_name, avatar_url: currentUser?.avatar_url }]);
      setNewMessage('');
    } catch (err) {
      alert('ส่งข้อความล้มเหลว');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100, color: 'var(--text-muted)' }}>กำลังโหลด...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 28 }}>📋 ทริปที่ฉันสร้าง</h1>

      {trips.length === 0 ? (
        <div className="neu-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          คุณยังไม่ได้สร้างทริปใดๆ
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {trips.map((trip) => (
            <div key={trip.id} className="neu-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{trip.destination || 'ไม่ระบุปลายทาง'}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>📍 {trip.origin} → {trip.destination}</p>
                  <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700, marginTop: 6 }}>
                    💰 {Number(trip.price || 0).toFixed(2)} ฿ / คน · 💺 เหลือ {trip.available_seats} / {trip.seats}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openChat(trip)} className="neu-btn" style={{ padding: '8px 14px', fontSize: 13 }}>
                    💬 แชทกลุ่ม
                  </button>
                  <button onClick={() => handleDeleteTrip(trip.id)} className="neu-btn-danger" style={{ padding: '8px 14px', fontSize: 13 }}>
                    🗑️ ลบทริป
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeChatTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
          <div className="neu-card" style={{ width: '100%', maxWidth: 500, height: 600, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>💬 แชทกลุ่ม: {activeChatTrip.destination}</h3>
              <button onClick={() => setActiveChatTrip(null)} className="neu-btn" style={{ padding: '4px 10px', fontSize: 12 }}>ปิด</button>
            </div>

            <div className="neu-inset-deep" style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderRadius: 20, marginBottom: 16 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 20 }}>ยังไม่มีข้อความ</div>
              )}
              {messages.map((m) => {
                const isMe = m.user_id === currentUser?.id;
                return (
                  <div key={m.id} className={isMe ? 'chat-bubble-me' : 'chat-bubble-other'}>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2, fontWeight: 700 }}>{m.full_name}</div>
                    <div style={{ fontSize: 14 }}>{m.message}</div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10 }}>
              <input className="neu-input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." style={{ flex: 1 }} />
              <button type="submit" className="neu-btn-primary" style={{ padding: '10px 18px' }}>ส่ง</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTrips;
