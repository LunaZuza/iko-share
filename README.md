# 🚗 Iko Share — ระบบแชร์ค่าเดินทาง (Carpool Sharing)

เว็บแอปพลิเคชันแชร์ค่าเดินทาง สร้างด้วย **React + Node.js Express + PostgreSQL**
รองรับสมัครสมาชิก / เข้าสู่ระบบด้วย Email + Password (JWT), สร้างทริป, เข้าร่วมทริป,
ดูโปรไฟล์ + เรตติ้ง, และแชทกลุ่มภายในทริป — พร้อมสไตล์ **Soft Neumorphism**

## 📁 โครงสร้างโปรเจค
```
carpool/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── server.js        # Entry point + Config (CORS, Helmet, Rate limit)
│   │   ├── config/db.js     # PostgreSQL connection (DATABASE_URL aware)
│   │   ├── middleware/auth.js      # verifyToken (JWT)
│   │   ├── controllers/     # auth / trip / user
│   │   ├── routes/          # authRoutes / tripRoutes / userRoutes
│   │   └── migrations/      # 001_create_tables.sql + run.js
│   ├── render.yaml          # Render Blueprint (สำหรับ deploy)
│   ├── .env / .env.example
│   └── package.json
└── frontend/                # React (Create React App)
    ├── src/
    │   ├── App.js
    │   ├── components/Navbar.js
    │   ├── pages/           # Home / Login / CreateTrip / MyTrips / Profile
    │   ├── services/api.js  # Axios + JWT interceptor
    │   └── index.css        # Neumorphism styles
    ├── vercel.json
    ├── .env.example
    └── package.json
```

## 🧰 เทคโนโลยี
- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express, bcryptjs, jsonwebtoken, pg
- **Database:** PostgreSQL

## 🚀 Run ในเครื่อง (Development)

### 1) Database (PostgreSQL)
สร้าง database และ user ให้ตรงกับ `backend/.env`:
```sql
CREATE USER carpool_user WITH PASSWORD 'carpool123';
CREATE DATABASE carpool_db OWNER carpool_user;
```
หรือตั้ง `DATABASE_URL` แทนก็ได้

> ⚠️ ถ้าเคยรัน schema เก่า (ตาราง `users`/`trips` แบบเก่า) ไว้ก่อนหน้านี้ ให้ลบตารางเก่าทิ้งก่อนเพราะ migration นี้ใช้ `CREATE TABLE IF NOT EXISTS`
> ```sql
> DROP TABLE IF EXISTS trip_participants, trips, users CASCADE;
> ```
> จากนั้นรัน `npm run migrate` เพื่อสร้าง schema ใหม่ตามสเปก

### 2) Backend
```bash
cd backend
npm install
npm run migrate      # สร้างตารางจาก migrations
npm run dev          # เริ่ม server ที่ http://localhost:5000
```

### 3) Frontend
```bash
cd frontend
npm install
npm start            # เปิด http://localhost:3000
```
> ถ้าแก้ `REACT_APP_API_URL` ใน `frontend/.env` ให้ชี้ไป backend ที่ต้องการ

## 🌍 Deploy จริง (Production)

### Backend → Render
1. Push โค้ดขึ้น GitHub แล้วที่ [Render](https://render.com) เลือก **New → Blueprint** และเลือก repo (ใช้ `backend/render.yaml` อัตโนมัติ)
   - จะสร้าง Web Service + PostgreSQL ให้เอง
   - Render ติดตั้ง PostgreSQL และรัน `npm run migrate` (preDeployCommand) ให้อัตโนมัติ
   - เราได้ `DATABASE_URL` และ URL ของ backend (เช่น `https://iko-share-backend.onrender.com`)
2. หรือสร้างด้วยมือ: New → Web Service → Node → build `npm install`, start `npm start`
   - เพิ่ม Environment Variables: `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
   - แนบ Database แล้วใส่ `DATABASE_URL`

### Frontend → Vercel
1. ที่ [Vercel](https://vercel.com) **Import** repo → Framework: Create React App
2. ใน **Settings → Environment Variables** เพิ่ม:
   ```
   REACT_APP_API_URL = https://<backend-url>.onrender.com/api
   ```
3. Deploy (ใช้ `vercel.json` ช่วย rewrite SPA routes) แล้วเปิด URL ที่ได้ เช่น `https://iko-share-frontend.vercel.app`

### ขั้นสุดท้ายหลัง deploy
- ให้ URL ของ Frontend ที่ได้ตั้งเป็น `FRONTEND_URL` ใน Render Backend (เพื่อ CORS)
- ตรวจว่า `/api/health` ของ backend ใช้งานได้

## 🔌 API Reference (ตาม Spec)
| Method | Route | คำอธิบาย |
|--------|-------|----------|
| POST | `/api/auth/register` | สมัครสมาชิก (คืน JWT) |
| POST | `/api/auth/login` | เข้าสู่ระบบ (คืน JWT) |
| GET | `/api/trips` | ดึงทริปทั้งหมด (รวม `driver_name`, `driver_id`) |
| POST | `/api/trips` | สร้างทริปใหม่ (ต้อง auth) |
| POST | `/api/trips/:id/join` | เข้าร่วมทริป (ลด `available_seats`) |
| DELETE | `/api/trips/:id` | ลบทริป (เฉพาะเจ้าของ) |
| GET | `/api/trips/:id/messages` | ดึงข้อความแชทในทริป |
| POST | `/api/trips/:id/messages` | ส่งข้อความแชทในทริป |
| GET | `/api/users/profile/:id` | ข้อมูลผู้ใช้ + `avg_rating`, `total_reviews` |
| GET | `/api/users/:id` | Route สำรองกัน 404 |
| PUT | `/api/users/profile` | อัปเดต bio (เฉพาะผู้ใช้ปัจจุบัน) |
