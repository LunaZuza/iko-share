// ทำให้ user object ที่ได้จาก API สม่ำเสมอ (รองรับทั้ง nested `user` และ flattened)
// คืน null ถ้าไม่มี id ที่ใช้ได้ เพื่อกันการไปสร้าง `/profile/undefined`
export const normalizeUser = (raw) => {
  const u = raw?.user || raw;
  if (!u || typeof u !== 'object') return null;
  const id = u.id || u.user_id || u._id;
  if (id === undefined || id === null || id === 'undefined') return null;

  const name = u.full_name || u.name || 'ผู้ใช้งาน';
  const image = u.avatar_url || u.profile_image || u.avatar || null;

  return {
    ...u,
    id,
    user_id: id,
    name,
    full_name: name,
    email: u.email || '',
    avatar_url: image,
    profile_image: image,
    bio: u.bio || '',
    phone: u.phone || '',
    role: u.role || 'user',
    is_admin: !!u.is_admin,
  };
};
