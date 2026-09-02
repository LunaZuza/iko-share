import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Home() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTrip = async (tripId) => {
    try {
      const res = await api.post(`/trips/${tripId}/join`);
      alert(res.data.message || 'เข้าร่วมทริปเรียบร้อยแล้ว');
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเข้าร่วมทริป');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--text-muted)' }}>กำลังโหลดทริป...</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>🚗 ทริปแชร์ค่ารถ</h1>
        <p style={{ color: 'var(--text-muted)' }}>ค้นหาและร่วมเดินทางไปยังสถานที่ต่างๆ ด้วยกัน</p>
      </div>

      {trips.length === 0 ? (
        <div className="neu-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          ยังไม่มีทริป — กด "+ สร้างทริป" เพื่อเริ่มแชร์ค่ากันเถอะ!
        </div>
      ) : (
        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {trips.map((trip) => {
            // แปลงราคาเป็นตัวเลขเสมอ เพื่อป้องกัน NaN
            const priceNum = Number(trip.price || 0);
            const availSeats = Number(trip.available_seats ?? 0);
            const totalSeats = Number(trip.seats ?? 0);
            const origin = trip.origin || 'ไม่ระบุต้นทาง';
            const destination = trip.destination || 'ไม่ระบุปลายทาง';
            const driverId = trip.driver_id;
            const driverName = trip.driver_name || 'ผู้สร้างทริป';

            return (
              <div key={trip.id} className="neu-card neu-card-hover" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>{destination}</h3>
                    <span className="neu-inset" style={{ padding: '6px 12px', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                      💰 {priceNum.toFixed(2)} ฿ / คน
                    </span>
                  </div>

                  <div className="neu-inset-deep" style={{ padding: 16, marginBottom: 20 }}>
                    <p style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>
                      📍 <strong>เส้นทาง:</strong> {origin} → {destination}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      👤 ผู้สร้าง:
                      {driverId ? (
                        <Link
                          to={`/profile/${driverId}`}
                          style={{
                            color: 'var(--accent)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            borderBottom: '1.5px dashed var(--accent)',
                          }}
                        >
                          {driverName}
                        </Link>
                      ) : (
                        <span>{driverName}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                    💺 ที่นั่งว่าง: {availSeats} / {totalSeats}
                  </span>
                  <button
                    onClick={() => handleJoinTrip(trip.id)}
                    className="neu-btn-primary"
                    style={{ padding: '8px 16px', fontSize: 14 }}
                    disabled={availSeats <= 0}
                  >
                    {availSeats > 0 ? 'เข้าร่วมทริป' : 'เต็มแล้ว'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
