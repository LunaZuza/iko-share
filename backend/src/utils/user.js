// ทำให้ response ผู้ใช้สม่ำเสมอ (ทั้ง nested `user` และ flattened ที่ระดับบนสุด)
// โดยคงฟิลด์เดิมที่ Frontend ใช้ (full_name/avatar_url/is_admin) และเพิ่ม aliases ตามสเปก
const normalizeUser = (user) => {
  if (!user) return null;
  const id = user.id || user.user_id || user._id;
  const name = user.full_name || user.name || 'ผู้ใช้งาน';
  const image = user.avatar_url || user.profile_image || user.avatar || null;
  const rating = (user.rating !== undefined && user.rating !== null)
    ? user.rating
    : (user.avg_rating !== undefined && user.avg_rating !== null ? user.avg_rating : 5.0);

  return {
    // ฟิลด์เดิม (จำเป็นสำหรับ Frontend ที่ทำงานอยู่)
    id,
    full_name: name,
    email: user.email || '',
    avatar_url: image,
    bio: user.bio || '',
    phone: user.phone || '',
    role: user.role || 'user',
    is_admin: !!user.is_admin,
    created_at: user.created_at || null,
    // aliases (ตามสเปก - ไม่ทำลายของเดิม)
    user_id: id,
    name,
    profile_image: image,
    rating,
  };
};

// ประกอบ response ผู้ใช้: { success: true, user: {...}, ...{...} }
const userResponse = (user) => {
  const normalizedUser = normalizeUser(user);
  return { success: true, user: normalizedUser, ...(normalizedUser || {}) };
};

// ตรวจว่า id เป็นจำนวนเต็มบวก (กัน id = 'undefined' / NaN)
const parseUserId = (val) => {
  const n = Number.parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

module.exports = { normalizeUser, userResponse, parseUserId };
