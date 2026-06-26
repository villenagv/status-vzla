import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ContadoresEntrada from '@/components/svzla/ContadoresEntrada';
import DirectorioPersonasEntrada from '@/components/svzla/DirectorioPersonasEntrada';
import BloqueSeguridadEdificios from '@/components/svzla/BloqueSeguridadEdificios';
import AdvertenciaSeguridadEdificio from '@/components/svzla/AdvertenciaSeguridadEdificio';

const TELS = [
  { num: '171', op: 'CANTV' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

export default function Entrada() {
  const { lang, toggle: toggleLang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(u => setUser(u)).catch(() => setUser(null)); }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar ligera */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Status<span className="text-amber-600">Vzla</span>
            </span>
            <span className="hidden sm:inline ml-2 text-xs text-gray-400 font-medium tracking-widest uppercase">StatusVenezuela.com</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/mi-perfil" className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold no-underline">
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white no-underline hover:bg-red-700 cursor-pointer">{es ? 'Entrar' : 'Login'}</Link>
                <Link to="/register" className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer no-underline">{es ? 'Registro' : 'Sign up'}</Link>
              </>
            )}
            <button onClick={toggleLang} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">{es ? 'EN' : 'ES'}</button>
          </div>
        </div>
      </header>

      <div className="md:hidden bg-red-600 text-white px-4 py-2.5 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full bg-white ${!lowBw ? 'animate-pulse' : ''} flex-shrink-0`} />
        <p className="text-xs font-semibold">{es ? 'Terremoto activo · La Guaira, Caracas, Yaracuy' : 'Active earthquake · La Guaira, Caracas, Yaracuy'}</p>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* 📊 Contadores */}
        <ContadoresEntrada />

        {/* ============================= */}
        {/* BLOQUE 1: EMERGENCIA (Prioridad máxima) */}
        {/* ============================= */}
        <section>
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full bg-red-500 ${!lowBw ? 'animate-pulse' : ''}`} />
            🆘 {es ? 'NECESITO AYUDA' : 'I NEED HELP'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/zona-afectada" className="flex items-center gap-4 bg-red-700 rounded-2xl p-5 text-white no-underline hover:opacity-90 active:scale-[0.99] transition-all">
              <span className="text-4xl flex-shrink-0">🆘</span>
              <div>
                <p className="text-base font-black leading-tight">{es ? 'Estoy en zona afectada' : 'I am in the affected area'}</p>
                <p className="text-sm mt-1 opacity-70">{es ? 'Reporta tu estado, busca a tu familia y pide ayuda' : 'Report your status, find family and ask for help'}</p>
              </div>
            </Link>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone size={13} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{es ? 'Llama ahora' : 'Call now'}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {TELS.map(({ num, op }) => (
                  <a key={num} href={`tel:${num}`} className="flex flex-col items-center bg-red-600 hover:bg-red-700 rounded-lg py-2.5 px-1 no-underline transition-colors">
                    <span className="text-sm font-bold text-white">{num}</span>
                    <span className="text-[9px] text-red-200 mt-0.5">{op}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">{es ? 'Alerta de seguridad' : 'Security alert'}</p>
                <p className="text-xs text-amber-700 leading-relaxed">{es ? 'Nunca envíes dinero a cambio de información. Es una estafa.' : 'Never send money in exchange for information. It is a scam.'}</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex gap-3">
              <span className="text-base flex-shrink-0 mt-0.5">🤝</span>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{es ? 'Ayuda y voluntarios' : 'Help & volunteers'}</p>
                <Link to="/institucional" className="text-xs text-blue-700 hover:underline font-semibold">{es ? 'Institución o punto de ayuda' : 'Institution or help point'} →</Link>
                <br />
                <Link to="/voluntario" className="text-xs text-blue-700 hover:underline font-semibold">{es ? 'Soy voluntario' : 'I am a volunteer'} →</Link>
                <br />
                <Link to="/centros-apoyo" className="text-xs text-blue-700 hover:underline font-semibold">{es ? 'Centros de apoyo activos' : 'Active support centers'} →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================= */}
        {/* BLOQUE 2: EDIFICIOS (Seguridad / Riesgo) */}
        {/* ============================= */}
        <section>
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2 mb-3">
            🏗️ {es ? '¿ES SEGURO ESTE EDIFICIO?' : 'IS THIS BUILDING SAFE?'}
          </span>
          <AdvertenciaSeguridadEdificio compact />
          <div className="flex flex-wrap gap-2 mb-3">
            <Link to="/edificios" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 bg-white no-underline cursor-pointer">
              🔍 {es ? 'Consultar edificios' : 'Check buildings'}
            </Link>
            <Link to="/reportar-dano" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-900 text-white bg-gray-900 no-underline cursor-pointer hover:bg-gray-800">
              + {es ? 'Reportar daños' : 'Report damage'}
            </Link>
            <Link to="/solicitar-info-edificio" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 bg-white no-underline cursor-pointer">
              📋 {es ? 'Solicitar información' : 'Request info'}
            </Link>
          </div>
          <BloqueSeguridadEdificios />
        </section>

        {/* ============================= */}
        {/* BLOQUE 3: PERSONAS (Búsqueda y reporte) */}
        {/* ============================= */}
        <section>
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2 mb-3">
            👤 {es ? 'PERSONAS' : 'PEOPLE'}
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            <Link to="/personas" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 bg-white no-underline cursor-pointer">
              🔍 {es ? 'Ver búsquedas activas' : 'Active searches'}
            </Link>
            <Link to="/buscar-persona" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-900 text-white bg-gray-900 no-underline cursor-pointer hover:bg-gray-800">
              + {es ? 'Buscar a alguien' : 'Search someone'}
            </Link>
            <Link to="/reportar-encontrado" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 bg-white no-underline cursor-pointer">
              🙋 {es ? 'Vi o encontré a alguien' : 'I found someone'}
            </Link>
            <Link to="/directorio-encontrados" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 bg-white no-underline cursor-pointer">
              ✅ {es ? 'Encontrados' : 'Found'}
            </Link>
          </div>
          <DirectorioPersonasEntrada standalone />
        </section>
      </main>

      {/* Footer simplificado */}
      <footer className="border-t border-gray-100 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-300">
            <span className="font-semibold text-gray-400">Status Venezuela</span> · {es ? 'No partidista · Sin fines de lucro · Ordenado por prioridad' : 'Non-partisan · Non-profit · Sorted by priority'}
          </p>
          <div className="flex items-center gap-4">
            {!user && <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 underline">{es ? 'Entrar' : 'Login'}</Link>}
            {!user && <Link to="/register" className="text-xs text-gray-400 hover:text-gray-600 underline">{es ? 'Registrarme' : 'Sign up'}</Link>}
            {user?.role === 'admin' && (
              <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 underline">{es ? 'Dashboard' : 'Dashboard'}</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}