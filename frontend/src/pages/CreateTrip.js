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
  const [hasCar, setHasCar] = useState(false);
  const [carMode, setCarMode] = useState('existing'); // 'existing' | 'new'
  const [myCars, setMyCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [newCar, setNewCar] = useState({ model: '', color: '', license_plate: '', capacity: 4 });
  const [loadingCars, setLoadingCars] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleNewCarChange = (e) => {
    setNewCar({ ...newCar, [e.target.name]: e.target.value });
  };

  const fetchMyCars = async () => {
    setLoadingCars(true);
    try {
      const res = await api.get('/cars/my-cars');
      setMyCars(res.data);
      if (res.data.length > 0) setSelectedCarId(String(res.data[0].id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCars(false);
    }
  };

  const toggleHasCar = async (checked) => {
    setHasCar(checked);
    if (checked && myCars.length === 0) await fetchMyCars();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };

      if (hasCar) {
        if (carMode === 'existing') {
          if (!selectedCarId) {
            alert('กรุณาเลือกรถยนต์');
            return;
          }
          payload.car_id = Number(selectedCarId);
        } else {
          // เพิ่มรถใหม่ก่อน แล้วเอา car_id ไปสร้างทริป
          if (!newCar.model || !newCar.license_plate) {
            alert('กรุณากรอกยี่ห้อ/รุ่นรถ และทะเบียนรถ');
            return;
          }
          const carRes = await api.post('/cars', {
            ...newCar,
            capacity: Number(newCar.capacity) || 4,
          });
          payload.car_id = carRes.data.id;
        }
      }

      await api.post('/trips', payload);
      alert('สร้างทริปสำเร็จ!');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '40px auto', padding: '0 20px' }}>
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

          {/* --- เลือก/เพิ่มรถยนต์ --- */}
          <div className="neu-inset" style={{ padding: 18, borderRadius: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={hasCar} onChange={(e) => toggleHasCar(e.target.checked)} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>🚗 มีรถยนต์สำหรับเดินทาง</span>
            </label>

            {hasCar && (
              <div style={{ marginTop: 16, display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setCarMode('existing')} className={carMode === 'existing' ? 'neu-btn-primary' : 'neu-btn'} style={{ padding: '8px 14px', fontSize: 13 }}>
                    เลือกจากรถที่มีอยู่
                  </button>
                  <button type="button" onClick={() => setCarMode('new')} className={carMode === 'new' ? 'neu-btn-primary' : 'neu-btn'} style={{ padding: '8px 14px', fontSize: 13 }}>
                    เพิ่มรถยนต์ใหม่
                  </button>
                </div>

                {carMode === 'existing' && (
                  <div>
                    {loadingCars ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>กำลังโหลดรถ...</p>
                    ) : myCars.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>ยังไม่มีรถ — สลับไปที่ "เพิ่มรถยนต์ใหม่"</p>
                    ) : (
                      <select className="neu-input" value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)}>
                        {myCars.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.model} · {c.color || '-'} · {c.license_plate} ({c.capacity} ที่นั่ง)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {carMode === 'new' && (
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <input className="neu-input" name="model" value={newCar.model} onChange={handleNewCarChange} placeholder="ยี่ห้อ/รุ่นรถ * เช่น Honda City" />
                      <input className="neu-input" name="color" value={newCar.color} onChange={handleNewCarChange} placeholder="สีรถ เช่น ขาว" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                      <input className="neu-input" name="license_plate" value={newCar.license_plate} onChange={handleNewCarChange} placeholder="ทะเบียนรถ * เช่น กข1234" />
                      <input className="neu-input" type="number" name="capacity" value={newCar.capacity} onChange={handleNewCarChange} min="1" max="20" placeholder="ที่นั่งรอ" />
                    </div>
                  </div>
                )}
              </div>
            )}
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
