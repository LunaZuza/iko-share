import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{ padding: '20px 40px 10px 40px' }}>
      <div
        className="neu-card nav-container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 28px',
          borderRadius: 24,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'Plus Jakarta Sans',
            }}
          >
            <span style={{ fontSize: 26 }}>🚗</span> Iko Share
          </Link>

          <div className="nav-links" style={{ display: 'flex', gap: 12, marginLeft: 16 }}>
            <Link
              to="/"
              className={isActive('/') ? 'neu-inset' : ''}
              style={{
                color: isActive('/') ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: 14,
                transition: 'all 0.2s ease',
              }}
            >
              ทริปทั้งหมด
            </Link>
            <Link
              to="/my-trips"
              className={isActive('/my-trips') ? 'neu-inset' : ''}
              style={{
                color: isActive('/my-trips') ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: 14,
                transition: 'all 0.2s ease',
              }}
            >
              ทริปของฉัน
            </Link>
            <Link
              to="/create-trip"
              className={isActive('/create-trip') ? 'neu-inset' : ''}
              style={{
                color: isActive('/create-trip') ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: 14,
                transition: 'all 0.2s ease',
              }}
            >
              + สร้างทริป
            </Link>
            {user?.is_admin && (
              <Link
                to="/admin"
                className={isActive('/admin') ? 'neu-inset' : ''}
                style={{
                  color: isActive('/admin') ? 'var(--accent)' : 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 800,
                  padding: '8px 16px',
                  borderRadius: 14,
                  transition: 'all 0.2s ease',
                  backgroundColor: 'rgba(108,99,255,0.08)',
                }}
              >
                👑 ระบบจัดการแอดมิน
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="neu-inset"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 8px', borderRadius: 999, cursor: 'pointer' }}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="neu-card"
                    style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                  >
                    {user.full_name?.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user.full_name}
                </span>
              </div>
            </Link>
          )}
          <button onClick={handleLogout} className="neu-btn" style={{ padding: '8px 18px', fontSize: 14 }}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
