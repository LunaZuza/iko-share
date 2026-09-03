import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdminDashboard() {
  const [tab, setTab] = useState('overview'); // 'overview' | 'users' | 'trips'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'overview') loadStats();
    if (tab === 'users') loadUsers();
    if (tab === 'trips') loadTrips();
  }, [tab]);

  const loadStats = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/stats'); setStats(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const loadUsers = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/users'); setUsers(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const loadTrips = async () => {
    setLoading(true);
    try { const res = await api.get('/trips'); setTrips(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleAdmin = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/role`, { is_admin: !user.is_admin });
      loadUsers();
    } catch (err) { alert(err.response?.data?.error || 'ไม่สามารถเปลี่ยนสิทธิ์แอดมินได้'); }
  };
  const changeRole = async (user, role) => {
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      loadUsers();
    } catch (err) { alert(err.response?.data?.error || 'ไม่สามารถเปลี่ยนบทบาทได้'); }
  };
  const deleteUser = async (user) => {
    if (!window.confirm(`ลบผู้ใช้ "${user.name}" ? ข้อมูลทั้งหมดจะถูกถาวร`)) return;
    try { await api.delete(`/admin/users/${user.id}`); loadUsers(); }
    catch (err) { alert(err.response?.data?.error || 'ไม่สามารถลบผู้ใช้ได้'); }
  };
  const deleteTrip = async (trip) => {
    if (!window.confirm(`ลบทริปไปที่ "${trip.destination}" ?`)) return;
    try { await api.delete(`/admin/trips/${trip.id}`); loadTrips(); }
    catch (err) { alert(err.response?.data?.error || 'ไม่สามารถลบทริปได้'); }
  };

  const tabStyle = (active) => ({
    padding: '10px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
    color: active ? '#fff' : 'var(--text-muted)',
    background: active ? 'var(--accent)' : 'var(--bg-surface)',
    boxShadow: active ? 'none' : '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)',
  });

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 20 }}>👑 ระบบจัดการแอดมิน</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button style={tabStyle(tab === 'overview')} onClick={() => setTab('overview')}>📊 ภาพรวม</button>
        <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>👥 จัดการผู้ใช้</button>
        <button style={tabStyle(tab === 'trips')} onClick={() => setTab('trips')}>🚗 จัดการทริป</button>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 20 }}>กำลังโหลด...</div>}

      {/* Tab 1: Overview */}
      {tab === 'overview' && (
        <div>
          {!stats ? (
            <div className="neu-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              <StatCard label="ผู้ใช้งานทั้งหมด" value={stats.total_users} icon="👥" />
              <StatCard label="ทริปทั้งหมด" value={stats.total_trips} icon="🚗" />
              <StatCard label="การจองที่ใช้งาน" value={stats.active_bookings} icon="🧾" />
              <StatCard label="ผู้ขับรถ" value={stats.total_drivers} icon="🚙" />
              <StatCard label="ผู้โดยสาร" value={stats.total_passengers} icon="🧍" />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: User Management */}
      {tab === 'users' && (
        <div className="neu-card" style={{ padding: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['ผู้ใช้', 'อีเมล', 'เบอร์โทร', 'บทบาท', 'แอดมิน', 'ทริป', 'จัดการ'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid var(--shadow-dark)', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>ไม่มีผู้ใช้</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="neu-card" style={{ width: 30, height: 30, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {u.name?.charAt(0)}
                    </span>
                    <strong>{u.name}</strong>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{u.email}</td>
                  <td style={{ padding: '10px 8px' }}>{u.phone || '-'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select className="neu-input" value={u.role} onChange={(e) => changeRole(u, e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                      <option value="Driver">Driver</option>
                      <option value="Passenger">Passenger</option>
                      <option value="Both">Both</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className="neu-inset" style={{ padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: u.is_admin ? '#38B2AC' : 'var(--text-muted)' }}>
                      {u.is_admin ? 'แอดมิน' : 'ผู้ใช้'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{u.trip_count}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="neu-btn" onClick={() => toggleAdmin(u)} style={{ padding: '5px 10px', fontSize: 12 }}>
                        {u.is_admin ? 'ถอนสิทธิ์' : 'มอบสิทธิ์'}
                      </button>
                      <button className="neu-btn-danger" onClick={() => deleteUser(u)} style={{ padding: '5px 10px', fontSize: 12 }}>
                        ลบผู้ใช้
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Trip Management */}
      {tab === 'trips' && (
        <div className="neu-card" style={{ padding: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['ปลายทาง', 'เส้นทาง', 'ผู้ขับ', 'ราคา', 'ที่นั่ง', 'วันที่', 'จัดการ'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid var(--shadow-dark)', color: 'var(--text-muted)', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>ไม่มีทริป</td></tr>
              )}
              {trips.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{t.destination}</td>
                  <td style={{ padding: '10px 8px' }}>{t.origin} → {t.destination}</td>
                  <td style={{ padding: '10px 8px' }}>{t.driver_name}</td>
                  <td style={{ padding: '10px 8px' }}>💰 {Number(t.price || 0).toFixed(2)}</td>
                  <td style={{ padding: '10px 8px' }}>{t.available_seats}/{t.seats}</td>
                  <td style={{ padding: '10px 8px' }}>{t.departure_time ? new Date(t.departure_time).toLocaleDateString('th-TH') : '-'}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <button className="neu-btn-danger" onClick={() => deleteTrip(t)} style={{ padding: '5px 10px', fontSize: 12 }}>ลบทริป</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="neu-card" style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</div>
    </div>
  );
}

export default AdminDashboard;
