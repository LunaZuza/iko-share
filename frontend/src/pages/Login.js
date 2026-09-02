import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ full_name: '', email: '', password: '', avatar_url: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <div className="neu-card" style={{ padding: '44px 36px', maxWidth: 440, width: '100%' }}>
        <div
          className="neu-inset-deep"
          style={{
            width: 84, height: 84, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto', fontSize: 42,
          }}
        >
          🚗
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Iko Share</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, textAlign: 'center', marginBottom: 28 }}>
          {mode === 'login' ? 'เข้าสู่ระบบเพื่อแชร์ค่าเดินทาง' : 'สมัครสมาชิกเพื่อเริ่มแชร์ค่ารถ'}
        </p>

        {error && (
          <div className="neu-inset" style={{ color: '#E53E3E', padding: 12, borderRadius: 14, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>ชื่อ-นามสกุล *</label>
              <input className="neu-input" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="เช่น สมชาย ใจดี" />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>อีเมล *</label>
            <input className="neu-input" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>รหัสผ่าน *</label>
            <input className="neu-input" type="password" name="password" value={form.password} onChange={handleChange} required placeholder="อย่างน้อย 6 ตัวอักษร" />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>ลิงก์รูปโปรไฟล์ (ไม่บังคับ)</label>
              <input className="neu-input" name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="https://.../avatar.jpg" />
            </div>
          )}

          <button type="submit" disabled={loading} className="neu-btn-primary" style={{ marginTop: 8, padding: 14, fontSize: 16 }}>
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <>
              ยังไม่มีบัญชี?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                สมัครสมาชิก
              </button>
            </>
          ) : (
            <>
              มีบัญชีอยู่แล้ว?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                เข้าสู่ระบบ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
