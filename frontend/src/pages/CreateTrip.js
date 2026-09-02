import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    price: 0,
    seats: 4,
    departure_time: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/trips', form);
      alert('สร้างทริปสำเร็จ!');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
      <div className="neu-card" style={{ padding: 40 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>✨ สร้างทริปใหม่</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>จุดเริ่มต้น *</label>
              <input className="neu-input" name="origin" value={form.origin} onChange={handleChange} required placeholder="เช่น หมอชิต" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>ปลายทาง *</label>
              <input className="neu-input" name="destination" value={form.destination} onChange={handleChange} required placeholder="เช่น เมืองทองธานี" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>ราคา / คน (บาท)</label>
              <input className="neu-input" type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>จำนวนที่นั่ง *</label>
              <input className="neu-input" type="number" name="seats" value={form.seats} onChange={handleChange} min="1" max="20" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>วันเวลาออกเดินทาง</label>
            <input className="neu-input" type="datetime-local" name="departure_time" value={form.departure_time} onChange={handleChange} />
          </div>

          <button type="submit" disabled={loading} className="neu-btn-primary" style={{ marginTop: 10, padding: 14, fontSize: 16 }}>
            {loading ? 'กำลังสร้างทริป...' : 'ยืนยันการสร้างทริป'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTrip;
