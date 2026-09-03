// คืนค่าเป็น array เสมอ (กัน .map is not a function จากข้อมูลที่มาแปลก ๆ)
export const asArray = (value) => (Array.isArray(value) ? value : []);

// สกัด array ออกจาก response (รองรับ return เป็น array ตรง ๆ หรือ
// object { trips|users|bookings|data: [...] } ตามที่ backends บางตัวคืนมา)
export const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.trips)) return data.trips;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.bookings)) return data.bookings;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};
