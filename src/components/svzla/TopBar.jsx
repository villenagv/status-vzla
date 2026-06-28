import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const NAV = [
  { to: '/consultar',     es: 'Buscar',      en: 'Search',    pt: 'Buscar' },
  { to: '/directorio',    es: 'Directorio',  en: 'Directory', pt: 'Diretório' },
  { to: '/personas',      es: 'Personas',    en: 'People',    pt: 'Pessoas' },
  { to: '/edificios',     es: 'Edificios',   en: 'Buildings', pt: 'Edifícios' },
  { to: '/centros-apoyo', es: 'Centros',     en: 'Centers',   pt: 'Centros' },
  { to: '/aliados',       es: 'Aliados',     en: 'Partners',  pt: 'Parceiros' },
  { to: '/voluntario',   es: 'Voluntarios', en: 'Volunteers',pt: 'Voluntários'},
];

export default function TopBar() {
  const { lang, setLanguage } = useLang();
  const { lowBw, toggle: toggleLowBw } = useLowBw();
  const location = useLocation();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);
  useEffect(() => { setMenuOpen(false); setLangOpen(false); }, [location.pathname]);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header style={{
        background: 'rgba(13,17,23,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>

          {/* Brand */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#0D2259', border: '2px solid #F5C518', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>📍</div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Status<span style={{ color: '#F5C518' }}> Vzla</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex" style={{ gap: 1, flex: 1, justifyContent: 'center' }}>
            {NAV.map(item => {
              const active = isActive(item.to);
              return (
                <Link key={item.to} to={item.to} style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  padding: '5px 9px', borderRadius: 8, textDecoration: 'none',
                  background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                  whiteSpace: 'nowrap',
                }}>
                  {pt ? item.pt : es ? item.es : item.en}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {/* Low-BW toggle */}
            <button onClick={toggleLowBw} title={es ? 'Modo bajo consumo' : 'Low-bandwidth mode'} style={{
              fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${lowBw ? 'rgba(234,179,8,0.5)' : 'rgba(255,255,255,0.13)'}`,
              color: lowBw ? '#FCD34D' : 'rgba(255,255,255,0.65)',
              background: lowBw ? 'rgba(234,179,8,0.10)' : 'transparent',
            }}>
              ⚡{lowBw ? ' BW' : ''}
            </button>

            {/* Language */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setLangOpen(v => !v)} style={{
                fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 20, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.80)', background: 'transparent',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {lang.toUpperCase()} ▾
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#161B22', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, overflow: 'hidden', zIndex: 100, minWidth: 90,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  {[{ code: 'es', label: 'Español' }, { code: 'en', label: 'English' }, { code: 'pt', label: 'Português' }].map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setLangOpen(false); }} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                      fontSize: 12, fontWeight: lang === l.code ? 700 : 400,
                      color: lang === l.code ? '#fff' : 'rgba(255,255,255,0.72)',
                      background: lang === l.code ? 'rgba(255,255,255,0.07)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                    }}>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Portal link */}
            {user && (
              <Link to="/voluntario" style={{
                fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
                color: '#fff', background: '#0F766E', textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                🤝 Portal
              </Link>
            )}

            {/* User avatar / auth */}
            {user ? (
              <Link to="/mi-perfil" title={user.full_name || user.email} style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2471A3, #1a5276)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0,
                border: '1.5px solid rgba(255,255,255,0.18)',
              }}>
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Link to="/login" style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 20,
                  color: '#fff', background: '#C0392B', textDecoration: 'none', whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  {pt ? 'Entrar' : es ? 'Entrar' : 'Login'}
                </Link>
                <Link to="/register" className="hidden sm:inline-flex" style={{
                  fontSize: 11, fontWeight: 500, padding: '5px 11px', borderRadius: 20,
                  color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.18)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                  {pt ? 'Cadastro' : es ? 'Registro' : 'Sign up'}
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: menuOpen ? 'rgba(255,255,255,0.09)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 15,
              }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: '#0A1628', borderTop: '1px solid rgba(245,197,24,0.15)', padding: '12px 16px 20px' }}>
            {!user && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff', background: '#C0392B', textDecoration: 'none' }}>
                  {pt ? 'Entrar' : es ? 'Entrar' : 'Login'}
                </Link>
                <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none' }}>
                  {pt ? 'Cadastro' : es ? 'Registro' : 'Sign up'}
                </Link>
              </div>
            )}
            {[...NAV,
              { to: '/guia-plataforma', es: '📖 Guía de uso',  en: '📖 User guide',   pt: '📖 Guia' },
              { to: '/contactanos',     es: '✉️ Contáctanos', en: '✉️ Contact us',   pt: '✉️ Contate-nos' },
            ].map(item => {
              const active = isActive(item.to);
              return (
                <Link key={item.to} to={item.to} style={{
                  display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 10, marginBottom: 2,
                  fontSize: 15, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.78)',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  textDecoration: 'none',
                }}>
                  {pt ? item.pt : es ? item.es : item.en}
                </Link>
              );
            })}
            {user && (
              <Link to="/voluntario" style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 10, marginBottom: 2,
                fontSize: 15, fontWeight: 600, color: '#5EEAD4',
                background: 'rgba(15,118,110,0.15)', textDecoration: 'none', marginTop: 4,
              }}>
                🤝 {pt ? 'Portal de Voluntários' : es ? 'Portal de Voluntarios' : 'Volunteer Portal'}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 10,
                fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginTop: 6,
              }}>
                ⚙️ Admin
              </Link>
            )}
            <button onClick={toggleLowBw} style={{
              marginTop: 10, width: '100%', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
              background: lowBw ? 'rgba(234,179,8,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lowBw ? 'rgba(234,179,8,0.35)' : 'rgba(255,255,255,0.10)'}`,
              color: lowBw ? '#FCD34D' : 'rgba(255,255,255,0.70)',
            }}>
              ⚡ {lowBw
                ? (es ? 'Modo bajo consumo: Activo' : 'Low-BW mode: On')
                : (es ? 'Activar modo bajo consumo' : 'Enable low-bandwidth mode')}
            </button>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div style={{ height: 54, flexShrink: 0 }} />

      {/* FAB */}
      {location.pathname !== '/reportar-encontrado' && (
        <Link to="/reportar-encontrado" style={{
          position: 'fixed', right: 14, bottom: 20, zIndex: 40,
          background: '#15803D', color: '#fff', textDecoration: 'none',
          borderRadius: 999, padding: '13px 18px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
        }} aria-label={es ? 'Encontré a alguien' : 'I found someone'}>
          🙋 {pt ? 'Encontrei alguém' : es ? 'Encontré a alguien' : 'I found someone'}
        </Link>
      )}
    </>
  );
}