import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Profile({ currentUser, onUserUpdated, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: 'Both', avatar_url: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // กัน /profile/undefined — ถ้า id ไม่ดี ให้ fallback ไปใช้ id ของตัวเอง
  const targetId = !id || id === 'undefined' ? currentUser?.id || currentUser?.user_id : id;
  const validTargetId = targetId && targetId !== 'undefined';

  const isOwnProfile = currentUser && validTargetId && parseInt(currentUser.id, 10) === parseInt(targetId, 10);

  useEffect(() => {
    if (!validTargetId) {
      // ไม่มี id ที่ใช้ได้ — แสดง fallback โดยไม่ต้องเรียก API / ไม่ throw console error
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        let res;
        // รองรับรูปแบบ Route ของ Backend ทั้ง 3 แบบ เพื่อป้องกัน 404 Error
        try {
          res = await api.get(`/users/profile/${targetId}`);
        } catch (err1) {
          try {
            res = await api.get(`/users/${targetId}`);
          } catch (err2) {
            res = await api.get(`/profile/${targetId}`);
          }
        }

        const data = res.data.user || res.data;
        setProfile(data);
        setBio(data.bio || '');
      } catch (err) {
        console.warn('ไม่สามารถดึงข้อมูลโปรไฟล์ได้:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetId, validTargetId]);

  const handleSaveBio = async () => {
    try {
      await api.put('/users/profile', { bio });
      setProfile({ ...profile, bio });
      setIsEditing(false);
      alert('บันทึก Bio สำเร็จ');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const openEditProfile = () => {
    setEditForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      role: profile.role || 'Both',
      avatar_url: profile.avatar_url || '',
    });
    setShowEditProfile(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/users/profile', editForm);
      if (res.data.user) {
        setProfile({ ...profile, ...res.data.user });
        onUserUpdated?.(res.data.user);
      }
      setShowEditProfile(false);
      alert('บันทึกโปรไฟล์สำเร็จ');
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      alert('ลบบัญชีสำเร็จ');
      onLogout?.();
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'ไม่สามารถลบบัญชีได้');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--text-muted)' }}>กำลังโหลดโปรไฟล์...</div>;
  if (!profile) return <div style={{ textAlign: 'center', marginTop: 80 }}>ไม่พบผู้ใช้นี้</div>;

  return (
    <div style={{ maxWidth: 650, margin: '40px auto', padding: '0 20px' }}>
      <div className="neu-card" style={{ padding: 40, textAlign: 'center' }}>
        <div className="neu-inset-deep" style={{ width: 110, height: 110, borderRadius: '50%', margin: '0 auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 40, fontWeight: 800 }}>{(profile.full_name || profile.name || 'U').charAt(0)}</span>
          )}
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{profile.full_name || profile.name}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>{profile.email}</p>
        {profile.phone && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>📞 {profile.phone}</p>}
        {profile.role && (
          <span className="neu-inset" style={{ display: 'inline-block', marginTop: 8, padding: '3px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            {profile.role === 'Driver' ? '🚗 ผู้ขับรถ' : profile.role === 'Passenger' ? '🧍 ผู้โดยสาร' : '🚗🧍 ขับ & โดยสาร'}
          </span>
        )}

        {isOwnProfile && (
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <button onClick={openEditProfile} className="neu-btn" style={{ padding: '8px 20px', fontSize: 14 }}>
              ✏️ แก้ไขโปรไฟล์
            </button>
          </div>
        )}

        {/* ระบบคะแนนดาว */}
        <div className="neu-inset" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, marginBottom: 28 }}>
          <span style={{ color: '#F59E0B', fontSize: 18 }}>⭐</span>
          <span style={{ fontWeight: 800, fontSize: 16 }}>{profile.avg_rating || '5.0'} / 5.0</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({profile.total_reviews || 0} รีวิว)</span>
        </div>

        {/* ส่วนแสดง / แก้ไข Bio */}
        <div className="neu-inset-deep" style={{ padding: 24, textAlign: 'left', borderRadius: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>📝 เกี่ยวกับฉัน (Bio)</h3>
            {isOwnProfile && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="neu-btn" style={{ padding: '4px 12px', fontSize: 12 }}>แก้ไข</button>
            )}
          </div>

          {isEditing ? (
            <div>
              <textarea
                className="neu-input"
                rows="4"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="เขียนแนะนำตัวเองสั้นๆ..."
                style={{ resize: 'none', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setIsEditing(false)} className="neu-btn" style={{ padding: '6px 16px', fontSize: 13 }}>ยกเลิก</button>
                <button onClick={handleSaveBio} className="neu-btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>บันทึก</button>
              </div>
            </div>
          ) : (
            <p style={{ color: profile.bio ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {profile.bio || 'ยังไม่มีคำบรรยายตัวเอง'}
            </p>
          )}
        </div>
      </div>

      {/* Dangerous Zone — ลบบัญชี */}
      {isOwnProfile && (
        <div className="neu-card" style={{ padding: 24, marginTop: 24, border: '1px solid rgba(229,62,62,0.3)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#E53E3E', marginBottom: 8 }}>⚠️ โซนอันตราย</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            การลบบัญชีจะลบข้อมูลทั้งหมดของท่าน (ทริปที่สร้าง, การจอง, รถยนต์, รีวิว) อย่างถาวร ไม่สามารถกู้คืนได้
          </p>
          <button onClick={() => setShowDeleteConfirm(true)} className="neu-btn-danger" style={{ padding: '10px 20px', fontSize: 14 }}>
            🗑️ ลบบัญชีผู้ใช้
          </button>
        </div>
      )}

      {/* Modal แก้ไขโปรไฟล์ */}
      {showEditProfile && (
        <Overlay onClose={() => setShowEditProfile(false)}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>✏️ แก้ไขโปรไฟล์</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>ชื่อ-นามสกุล *</label>
              <input className="neu-input" name="full_name" value={editForm.full_name} onChange={handleEditChange} required placeholder="ชื่อ-นามสกุล" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>เบอร์โทร</label>
              <input className="neu-input" name="phone" value={editForm.phone} onChange={handleEditChange} placeholder="08xxxxxxxx" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>บทบาท</label>
              <select className="neu-input" name="role" value={editForm.role} onChange={handleEditChange}>
                <option value="Both">ทั้งขับและโดยสาร</option>
                <option value="Driver">ผู้ขับ (Driver)</option>
                <option value="Passenger">ผู้โดยสาร (Passenger)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>รูปโปรไฟล์ (URL)</label>
              <input className="neu-input" name="avatar_url" value={editForm.avatar_url} onChange={handleEditChange} placeholder="https://.../avatar.jpg" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditProfile(false)} className="neu-btn" style={{ padding: '8px 20px', fontSize: 14 }}>ยกเลิก</button>
              <button onClick={handleSaveProfile} className="neu-btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}>บันทึก</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Modal ยืนยันลบบัญชี */}
      {showDeleteConfirm && (
        <Overlay onClose={() => setShowDeleteConfirm(false)}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#E53E3E', marginBottom: 12 }}>⚠️ ยืนยันการลบบัญชี</h3>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.6 }}>
            คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี? ข้อมูลทั้งหมดจะถูกลบถาวร (ทริป, การจอง, รถยนต์, รีวิว)
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDeleteConfirm(false)} className="neu-btn" style={{ padding: '10px 20px', fontSize: 14 }}>ยกเลิก</button>
            <button onClick={handleDeleteAccount} className="neu-btn-danger" style={{ padding: '10px 20px', fontSize: 14 }}>ลบบัญชีถาวร</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }} onClick={onClose}>
      <div className="neu-card" style={{ width: '100%', maxWidth: 440, padding: 28 }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default Profile;
