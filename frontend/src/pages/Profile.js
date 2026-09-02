import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function Profile({ currentUser }) {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser && currentUser.id === parseInt(id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        // รองรับรูปแบบ Route ของ Backend ทั้ง 3 แบบ เพื่อป้องกัน 404 Error
        try {
          res = await api.get(`/users/profile/${id}`);
        } catch (err1) {
          try {
            res = await api.get(`/users/${id}`);
          } catch (err2) {
            res = await api.get(`/profile/${id}`);
          }
        }
        
        const data = res.data.user || res.data;
        setProfile(data);
        setBio(data.bio || '');
      } catch (err) {
        console.error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

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
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>{profile.email}</p>

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
    </div>
  );
}

export default Profile;
