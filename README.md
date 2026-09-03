# 🚗 Iko Share — ระบบแชร์ค่าเดินทาง (Carpool Sharing)

เว็บแอปพลิเคชันแชร์ค่าเดินทาง สร้างด้วย **React + Node.js Express + PostgreSQL (Neon)**
รองรับสมัครสมาชิก / เข้าสู่ระบบด้วย Email + Password (JWT), สร้างทริป, เข้าร่วมทริป,
ดูโปรไฟล์ + เรตติ้ง, ดูสมาชิกในทริป, และแชทกลุ่มแบบ real-time ด้วย **Socket.IO**
(เฉพาะสมาชิกทริป — ผู้ขับ + ผู้โดยสารที่ยืนยันแล้ว — เท่านั้นที่เข้าแชทได้) — พร้อมสไตล์ **Soft Neumorphism**

## 📁 โครงสร้างโปรเจค
```
carpool/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── server.js        # Entry point + Config (CORS, Helmet, Rate limit)
│   │   ├── socket.js        # Socket.IO — auth + membership chat
│   │   ├── config/db.js     # PostgreSQL connection (DATABASE_URL aware)
│   │   ├── middleware/auth.js      # verifyToken + optionalAuth (JWT)
│   │   ├── controllers/     # auth / trip / user
│   │   ├── routes/          # authRoutes / tripRoutes / userRoutes
│   │   └── migrations/      # 001_create_tables.sql + run.js
│   ├── render.yaml          # Render Blueprint (สำหรับ deploy)
│   ├── .env / .env.example
│   └── package.json
└── frontend/                # React (Create React App)
    ├── src/
    │   ├── App.js
    │   ├── components/      # Navbar.js, TripDetailModal.jsx
    │   ├── pages/           # Home / Login / CreateTrip / MyTrips / Profile
    │   ├── services/        # api.js (Axios+JWT), socket.js (Socket.IO client)
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

## 🗄️ Database Schema (v2 — ตรง ER Diagram)
- **USER** — `user_id`, `name`, `email`, `phone`, `role` (Driver/Passenger/Both) + auth fields
- **CAR** — `license_plate` (PK), `user_id`, `model`, `capacity`
- **EVENT** — `event_id`, `event_name`, `location`, `event_date`, `category`
- **TRIP** — `trip_id`, `license_plate` (FK→CAR), `event_id` (FK→EVENT), `origin`, `destination`, `available_seats`, `price_seat`
- **BOOKING** — `booking_id`, `user_id`, `trip_id`, `booking_status` (pending/confirmed/cancelled), `location`, `booking_time`
- ยังคงมี **`trip_messages`** (chat) และ **`user_ratings`** (รีวิว) สำหรับฟีเจอร์เดิม

## 🔌 API Reference (ตาม Spec)
| Method | Route | คำอธิบาย |
|--------|-------|----------|
| POST | `/api/auth/register` | สมัครสมาชิก (คืน JWT) |
| POST | `/api/auth/login` | เข้าสู่ระบบ (คืน JWT) |
| GET | `/api/trips` | ดึงทริปทั้งหมด (รวม `driver_name`, `driver_id`, `user_role_in_trip`) |
| POST | `/api/trips` | สร้างทริปใหม่ (ต้อง auth) |
| GET | `/api/trips/:id` | รายละเอียดทริป + สมาชิกทั้งหมด (driver + passengers ที่ confirmed) |
| POST | `/api/trips/:id/join` | เข้าร่วมทริป (สร้าง booking + ลด `available_seats`) |
| DELETE | `/api/trips/:id/leave` | ออกจากทริป (cancelled booking + คืนที่นั่ง) |
| DELETE | `/api/trips/:id` | ลบทริป (เฉพาะเจ้าของ) |
| GET | `/api/trips/my-trips` | ทริปที่ฉันสร้าง + ทริปที่ฉันเข้าร่วม (มี `user_role_in_trip`) |
| GET | `/api/trips/joined` | ทริปที่ฉันเข้าร่วมเป็นผู้โดยสาร (compat) |
| GET | `/api/trips/:id/messages` | ดึงแชท (เฉพาะสมาชิกทริป) |
| POST | `/api/trips/:id/messages` | ส่งแชท (เฉพาะสมาชิกทริป) |
| GET | `/api/users/profile/:id` | ข้อมูลผู้ใช้ + `phone`, `role`, `avg_rating`, `total_reviews` |
| GET | `/api/users/:id` | Route สำรองกัน 404 |
| PUT | `/api/users/profile` | อัปเดต `full_name` / `phone` / `role` / `avatar_url` / `bio` (เฉพาะผู้ใช้ปัจจุบัน) |
| DELETE | `/api/users/me` | ลบบัญชีผู้ใช้ + ลบข้อมูลที่เกี่ยวข้อง (cascade) |

## 💬 Real-time Chat (Socket.IO)
- Client เชื่อมต่อที่ host เดียวกับ API (ตัด `/api` ออก) พร้อมยืนยัน JWT ผ่าน `auth.token`
- เฉพาะ **สมาชิกทริป** (ผู้ขับ หรือผู้โดยสารที่มี `BOOKING` สถานะ `confirmed`) เท่านั้นที่ `joinTrip` / `sendMessage` ได้
- เหตุการณ์: `joinTrip`, `leaveTrip`, `sendMessage`, `message` (broadcast)
