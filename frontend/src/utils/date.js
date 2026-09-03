// แสดงเวลาออกเดินทางเป็นเวลา กรุงเทพ (UTC+7) โดยไม่ให้เกิดการบวกลบ offset ซ้ำ
// - ค่าจาก API เป็น ISO UTC (เช่น 2026-09-10T04:30:00.000Z ที่หมายถึง 11:30 น. กรุงเทพ)
//   -> แปลงเป็น Date แล้วแสดงด้วย timeZone 'Asia/Bangkok'
// - ถ้าเจอ string แบบ wall-clock (ไม่มี Z / offset) ให้ถือว่าเป็นเวลาไทยแล้วแสดงตรง ๆ
export const formatDepartureTime = (value) => {
  if (!value) return '';
  const s = String(value);

  const hasTz = /z$/i.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  if (!hasTz) {
    // ไม่มี timezone — ถือเป็น wall-clock ของไทย แล้วจัดรูปแบบตรง ๆ
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
    return s;
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
