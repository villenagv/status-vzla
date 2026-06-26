import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Zap, ZapOff, User, BarChart2, Menu, X, Search, AlertTriangle, Building2, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const NAV_ITEMS = [
  { to: '/',                icon: Home,          es: 'Inicio',          en: 'Home' },
  { to: '/consultar',       icon: Search,         es: 'Consultar',       en: 'Search' },
  { to: '/reportar',        icon: AlertTriangle,  es: 'Reportar daño',   en: 'Report' },
  { to: '/buscar-persona',  icon: User,           es: 'Buscar persona',  en: 'Find person' },
  { to: '/institucional',   icon: Building2,      es: 'Instituciones',   en: 'Institutions' },
];

export default function TopBar() {
  const { lang, toggle: toggleLang } = useLang();
  const { lowBw, toggle: toggleLowBw } = useLowBw();
  const location = useLocation();
  const es = lang === 'es';
  const [user, setUser] = useState(null);
  const [noLeidas, setNoLeidas] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const nots = await base44.entities.NotificacionesUsuario.filter({ user_id: u.id, leida: false });
      setNoLeidas(nots.length);
    }).catch(() => {});
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header className="bg-[#1A1F2E] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link to="/" className="flex flex-col leading-tight flex-shrink-0">
            <span className="font-black text-lg tracking-tight text-white">
              STATUS<span className="text-[#D48C2E]">VZLA</span>
              <span className="text-gray-500 font-normal">.com</span>
            </span>
            <span className="text-[9px] text-gray-500 hidden sm:block uppercase tracking-widest">
              {es ? 'Sistema de respuesta · Venezuela' : 'Emergency response · Venezuela'}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#D48C2E] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon size={12} />
                  {es ? item.es : item.en}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {user?.role === 'admin' && (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:border-[#D48C2E] hover:text-[#D48C2E] transition-colors"
                title="Dashboard"
              >
                <BarChart2 size={14} />
              </Link>
            )}

            <button
              onClick={toggleLowBw}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                lowBw
                  ? 'bg-[#D48C2E] border-[#D48C2E] text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
              title={es ? 'Modo bajo consumo' : 'Low-bandwidth mode'}
            >
              {lowBw ? <ZapOff size={12} /> : <Zap size={12} />}
              <span className="hidden lg:inline text-[11px]">
                {es ? 'Bajo consumo' : 'Low-BW'}
              </span>
            </button>

            <button
              onClick={toggleLang}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors font-medium"
            >
              {es ? 'EN' : 'ES'}
            </button>

            {user ? (
              <Link
                to="/mi-perfil"
                className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#D48C2E] text-white text-xs font-bold flex-shrink-0"
                title={user.full_name}
              >
                {user.full_name?.[0]?.toUpperCase() || <User size={14} />}
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B83A52] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-[#D48C2E] hover:text-[#D48C2E] transition-colors"
              >
                {es ? 'Entrar' : 'Log in'}
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-[#1A1F2E] px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(item => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#D48C2E] text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon size={16} />
                    {es ? item.es : item.en}
                  </Link>
                );
              })}
              {user?.role === 'admin' && (
                <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white">
                  <BarChart2 size={16} />
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}