-- ============================================
-- Iko Share · Carpool Sharing Database Schema
-- ============================================

-- ตารางผู้ใช้งาน
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางทริปเดินทาง
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  driver_id INT REFERENCES users(id) ON DELETE CASCADE,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  seats INT NOT NULL DEFAULT 1,
  available_seats INT NOT NULL DEFAULT 1,
  departure_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางผู้ร่วมเดินทาง
CREATE TABLE IF NOT EXISTS trip_passengers (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, user_id)
);

-- ตารางข้อความแชทกลุ่มทริป
CREATE TABLE IF NOT EXISTS trip_messages (
  id SERIAL PRIMARY KEY,
  trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตารางรีวิวและคะแนน
CREATE TABLE IF NOT EXISTS user_ratings (
  id SERIAL PRIMARY KEY,
  rater_id INT REFERENCES users(id),
  rated_user_id INT REFERENCES users(id),
  trip_id INT REFERENCES trips(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_passengers_trip ON trip_passengers(trip_id);
CREATE INDEX IF NOT EXISTS idx_passengers_user ON trip_passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_trip ON trip_messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON user_ratings(rated_user_id);
