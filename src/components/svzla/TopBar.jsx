import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Zap, ZapOff, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function TopBar() {
  const { t, toggle: toggleLang } = useLang();
  const { lowBw, toggle: toggleLowBw } = useLowBw();
  const [user, setUser] = useState(null);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      const nots = await base44.entities.NotificacionesUsuario.filter({ user_id: u.id, leida: false });
      setNoLeidas(nots.length);
    }).catch(() => {});
  }, []);

  return (
    <header className="bg-[#1A1F2E] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex flex-col leading-tight">
        <span className="font-black text-lg tracking-tight text-white">STATUSVZLA<span className="text-[#D48C2E]">.com</span></span>
        <span className="text-[10px] text-gray-400 hidden sm:block">{t.tagline}</span>
      </Link>
      <div className="flex items-center gap-2">
        {user ? (
          <Link
            to={user.role === 'admin' || user.role === 'user' ? '/mi-perfil' : '/mi-perfil'}
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#D48C2E] text-white text-xs font-bold flex-shrink-0"
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
          <Link to="/login" className="text-xs px-3 py-1.5 rounded-full border border-gray-600 text-gray-300 hover:border-gray-400 transition-colors">
            {t.lang_toggle === 'English' ? 'Entrar' : 'Log in'}
          </Link>
        )}
        <button
          onClick={toggleLowBw}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            lowBw
              ? 'bg-[#D48C2E] border-[#D48C2E] text-white font-bold'
              : 'border-gray-600 text-gray-300 hover:border-gray-400'
          }`}
          title={lowBw ? t.low_bw_active : t.low_bw}
        >
          {lowBw ? <ZapOff size={12} /> : <Zap size={12} />}
          <span className="hidden sm:inline">{lowBw ? t.low_bw_active : t.low_bw}</span>
        </button>
        <button
          onClick={toggleLang}
          className="text-xs px-3 py-1.5 rounded-full border border-gray-600 text-gray-300 hover:border-gray-400 transition-colors"
        >
          {t.lang_toggle}
        </button>
      </div>
    </header>
  );
}