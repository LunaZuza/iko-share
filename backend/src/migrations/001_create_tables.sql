-- ============================================================
-- Iko Share · Carpool Sharing — Schema v2 (ER Diagram aligned)
-- USER · CAR · EVENT · TRIP · BOOKING (+ chat / ratings)
--
-- NOTE: นี่คือ clean re-create migration ใช้ได้กับ DB ใหม่ (Neon)
-- หรือ DB เก่า (จะลบตารางชุดเดิมแล้วสร้างใหม่ให้ตรง ER Diagram)
-- ============================================================

-- === ลบตารางเดิมตามลำดับที่ปลอดภัยจาก Foreign Key (idempotent) ===
DROP TABLE IF EXISTS trip_passengers CASCADE;
DROP TABLE IF EXISTS trip_messages CASCADE;
DROP TABLE IF EXISTS user_ratings CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ============================================================
-- 1. USER
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,                       -- user_id
  full_name VARCHAR(100) NOT NULL,             -- name
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,         -- สำหรับ JWT auth (extend นอก ER)
  phone VARCHAR(15),
  role VARCHAR(20) NOT NULL DEFAULT 'Both',    -- 'Driver' | 'Passenger' | 'Both'
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,     -- ผู้ดูแลระบบ
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'Both';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('Driver', 'Passenger', 'Both'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. CAR
-- ============================================================
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,                        -- car_id
  license_plate VARCHAR(100) UNIQUE NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model VARCHAR(50),
  color VARCHAR(50),
  capacity INT NOT NULL DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cars_user ON cars(user_id);
CREATE INDEX IF NOT EXISTS idx_cars_plate ON cars(license_plate);

-- ============================================================
-- 3. EVENT
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  event_id SERIAL PRIMARY KEY,
  event_name VARCHAR(150) NOT NULL,
  location VARCHAR(255),
  event_date TIMESTAMP,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. TRIP
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,                         -- trip_id
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  car_id INT REFERENCES cars(id) ON DELETE SET NULL,   -- เชื่อมกับรถที่เลือก
  license_plate VARCHAR(100) REFERENCES cars(license_plate) ON DELETE SET NULL,
  event_id INT REFERENCES events(event_id) ON DELETE SET NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  available_seats INT NOT NULL DEFAULT 1,
  seats INT NOT NULL DEFAULT 1,                 -- จำนวนที่นั่งทั้งหมด (extend)
  price_seat DECIMAL(9,2) NOT NULL DEFAULT 0,   -- ราคาต่อที่นั่ง
  departure_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_car ON trips(car_id);
CREATE INDEX IF NOT EXISTS idx_trips_plate ON trips(license_plate);
CREATE INDEX IF NOT EXISTS idx_trips_event ON trips(event_id);

-- ============================================================
-- 5. BOOKING
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'cancelled'
  location VARCHAR(255),
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
-- Composite index ใช้กับ query สมาชิกทริป + chat (กรอง trip_id + status confirmed)
CREATE INDEX IF NOT EXISTS idx_bookings_trip_status ON bookings(trip_id, booking_status);

-- ============================================================
-- 6. TRIP MESSAGES (chat กลุ่มทริป)
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_messages (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON trip_messages(trip_id);

-- ============================================================
-- 7. USER RATINGS (คะแนน + รีวิว)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_ratings (
  id SERIAL PRIMARY KEY,
  rater_id INT REFERENCES users(id),
  rated_user_id INT REFERENCES users(id),
  trip_id INT REFERENCES trips(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON user_ratings(rated_user_id);
