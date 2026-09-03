import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TripDetailModal from '../components/TripDetailModal';

function MyTrips({ currentUser }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('driver'); // 'driver' | 'passenger'
  const [detailTrip, setDetailTrip] = useState(null);

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

  const driverTrips = trips.filter((t) => t.user_role_in_trip === 'driver');
  const passengerTrips = trips.filter((t) => t.user_role_in_trip === 'passenger');
  const visibleTrips = tab === 'driver' ? driverTrips : passengerTrips;

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100, color: 'var(--text-muted)' }}>กำลังโหลด...</div>;

  const tabStyle = (active) => ({
    padding: '10px 20px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    color: active ? '#fff' : 'var(--text-muted)',
    background: active ? 'var(--accent)' : 'var(--bg-surface)',
    boxShadow: active ? 'none' : '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)',
  });

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>📋 ทริปของฉัน</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button style={tabStyle(tab === 'driver')} onClick={() => setTab('driver')}>
          🚗 ทริปที่ฉันสร้าง ({driverTrips.length})
        </button>
        <button style={tabStyle(tab === 'passenger')} onClick={() => setTab('passenger')}>
          🧍 ทริปที่ฉันเข้าร่วม ({passengerTrips.length})
        </button>
      </div>

      {visibleTrips.length === 0 ? (
        <div className="neu-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          {tab === 'driver' ? 'คุณยังไม่ได้สร้างทริปใดๆ' : 'คุณยังไม่ได้เข้าร่วมทริปใดๆ'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {visibleTrips.map((trip) => (
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
                  <button onClick={() => setDetailTrip(trip)} className="neu-btn" style={{ padding: '8px 14px', fontSize: 13 }}>
                    💬 ดูรายละเอียด / แชท
                  </button>
                  {trip.user_role_in_trip === 'driver' && (
                    <button onClick={() => handleDeleteTrip(trip.id)} className="neu-btn-danger" style={{ padding: '8px 14px', fontSize: 13 }}>
                      🗑️ ลบทริป
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailTrip && (
        <TripDetailModal tripId={detailTrip.id} currentUser={currentUser} onClose={() => setDetailTrip(null)} onTripChanged={fetchTrips} />
      )}
    </div>
  );
}

export default MyTrips;
