import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const NAV = [
  { to: '/',              es: 'Inicio',    en: 'Home' },
  { to: '/consultar',     es: 'Consultar', en: 'Search' },
  { to: '/personas',      es: 'Personas',  en: 'People' },
  { to: '/edificios',     es: 'Edificios', en: 'Buildings' },
  { to: '/centros-apoyo', es: 'Centros',   en: 'Centers' },
];

export default function TopBar() {
  const { lang, toggle: toggleLang } = useLang();
  const { lowBw, toggle: toggleLowBw } = useLowBw();
  const location = useLocation();
  const es = lang === 'es';
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header style={{ background: '#111318', position: 'sticky', top: 0, zIndex: 50, borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Status<span style={{ color: '#c09a1a' }}> Venezuela</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
          {NAV.map(item => {
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} style={{
                fontSize: 12, fontWeight: active ? 500 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                padding: '5px 10px', borderRadius: 20, textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
              }}>
                {es ? item.es : item.en}
              </Link>
            );
          })}
        </nav>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={toggleLowBw} style={{
            fontSize: 10, fontWeight: 500, padding: '4px 8px', borderRadius: 20, cursor: 'pointer',
            border: `0.5px solid ${lowBw ? '#c09a1a' : 'rgba(255,255,255,0.18)'}`,
            color: lowBw ? '#c09a1a' : 'rgba(255,255,255,0.45)', background: 'transparent',
          }} title={es ? 'Modo bajo consumo' : 'Low-bandwidth mode'}>
            {lowBw ? '⚡ Low-BW' : '⚡'}
          </button>

          <button onClick={toggleLang} style={{
            fontSize: 10, fontWeight: 500, padding: '4px 8px', borderRadius: 20, cursor: 'pointer',
            border: '0.5px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.45)', background: 'transparent',
          }}>
            {es ? 'EN' : 'ES'}
          </button>

          {user?.role === 'voluntario' && (
            <Link to="/portal-voluntario" style={{
              fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 20,
              color: '#fff', background: '#0F766E', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              🤝 {es ? 'Mi portal' : 'My portal'}
            </Link>
          )}
          {user ? (
          <Link to="/mi-perfil" style={{
            width: 28, height: 28, borderRadius: '50%', background: '#2471A3', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 500, textDecoration: 'none', flexShrink: 0,
          }}>
            {user.full_name?.[0]?.toUpperCase() || '?'}
          </Link>
          ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link to="/login" style={{
              fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 20,
              color: '#fff', background: '#C0392B', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {es ? 'Entrar' : 'Login'}
            </Link>
            <Link to="/register" className="hidden sm:inline-block" style={{
              fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 20,
              color: 'rgba(255,255,255,0.75)', border: '0.5px solid rgba(255,255,255,0.25)',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {es ? 'Registro' : 'Sign up'}
            </Link>
            </div>
          )}

          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden" style={{
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '0.5px solid rgba(255,255,255,0.18)',
            borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 14,
          }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{ background: '#111318', borderTop: '0.5px solid rgba(255,255,255,0.08)', padding: '8px 16px 16px' }}>
          {!user && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#fff', background: '#C0392B', textDecoration: 'none' }}>
                {es ? 'Entrar' : 'Login'}
              </Link>
              <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', border: '0.5px solid rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                {es ? 'Registro' : 'Sign up'}
              </Link>
            </div>
          )}
          {NAV.map(item => {
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'block', padding: '11px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 14, fontWeight: active ? 500 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                textDecoration: 'none',
              }}>
                {es ? item.es : item.en}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link to="/dashboard" style={{ display: 'block', padding: '11px 12px', borderRadius: 8, fontSize: 14, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
              Dashboard
            </Link>
          )}
        </div>
      )}

      {location.pathname !== '/reportar-encontrado' && (
        <Link to="/reportar-encontrado" style={{
          position: 'fixed', right: 14, bottom: 14, zIndex: 80,
          background: '#15803D', color: '#fff', textDecoration: 'none',
          borderRadius: 999, padding: '12px 16px', fontSize: 13, fontWeight: 800,
          boxShadow: '0 8px 24px rgba(0,0,0,0.24)', border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
        }} aria-label={es ? 'Encontré a alguien' : 'I found someone'}>
          🙋 {es ? 'Encontré a alguien' : 'I found someone'}
        </Link>
      )}
    </header>
  );
}