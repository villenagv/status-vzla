import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ContadoresEntrada from '@/components/svzla/ContadoresEntrada';
import DirectorioPersonasEntrada from '@/components/svzla/DirectorioPersonasEntrada';
import DirectorioEdificiosEntrada from '@/components/svzla/DirectorioEdificiosEntrada';
import Footer from '@/components/svzla/Footer';

const MODOS = [
  { to: '/zona-afectada', icon: '🆘', bg: '#C0392B', label: { es: 'EMERGENCIA', en: 'EMERGENCY' }, titulo: { es: 'Estoy en zona afectada', en: 'I am in the affected area' }, sub: { es: 'Reporta daños · Pide ayuda · Informa refugio', en: 'Report damage · Ask for help · Shelter' } },
  { to: '/consultar', icon: '🔍', bg: '#1A5276', label: { es: 'CONSULTAR', en: 'SEARCH INFO' }, titulo: { es: 'Busco información de una zona', en: 'I need info about an area' }, sub: { es: 'Edificios · Refugios activos · Zonas', en: 'Buildings · Shelters · Areas' } },
  { to: '/personas', icon: '👤', bg: '#6C3483', label: { es: 'PERSONAS', en: 'PEOPLE' }, titulo: { es: 'Busco o reporto a una persona', en: 'I search or report a person' }, sub: { es: 'Persona sin contacto · Alguien encontrado', en: 'Missing person · Someone found' } },
  { to: '/edificios', icon: '🏗️', bg: '#784212', label: { es: 'EDIFICIOS', en: 'BUILDINGS' }, titulo: { es: '¿Es seguro este edificio?', en: 'Is this building safe?' }, sub: { es: 'Consulta daños · Reporta estructuras · Ver estado', en: 'Check damage · Report structures · View status' } },
  { to: '/institucional', icon: '🏛️', bg: '#1A5C3A', label: { es: 'INSTITUCIÓN', en: 'INSTITUTION' }, titulo: { es: 'Soy institución o punto de ayuda', en: 'I am an institution or help point' }, sub: { es: 'Refugio · Hospital · Comedor · Donaciones', en: 'Shelter · Hospital · Food · Donations' } },
  { to: '/voluntario', icon: '🤝', bg: '#7B3A9E', label: { es: 'VOLUNTARIO', en: 'VOLUNTEER' }, titulo: { es: 'Soy voluntario o personal de apoyo', en: 'I am a volunteer or support staff' }, sub: { es: 'Encontrados · Listados · Centros de apoyo', en: 'Found people · Lists · Support centers' } },
];

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

  const [modoDir, setModoDir] = useState('personas');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Status<span className="text-amber-600">Vzla</span>
            </span>
            <span className="hidden sm:inline ml-2 text-xs text-gray-400 font-medium tracking-widest uppercase">StatusVenezuela.com</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full bg-red-500 ${!lowBw ? 'animate-pulse' : ''} flex-shrink-0`} />
              <p className="text-xs font-semibold text-red-700">{es ? 'Terremoto activo · La Guaira, Caracas, Yaracuy' : 'Active earthquake · La Guaira, Caracas, Yaracuy'}</p>
            </div>
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
        <p className="text-xs font-semibold">{es ? 'Terremoto activo · La Guaira, Caracas, Yaracuy · 24 junio 2026' : 'Active earthquake · La Guaira, Caracas, Yaracuy · June 24, 2026'}</p>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{es ? '¿Cuál es tu situación?' : 'What is your situation?'}</h1>
          <p className="text-sm text-gray-500">{es ? 'Toca o haz clic en la opción que mejor te describe.' : 'Tap or click the option that best describes you.'}</p>
        </div>

        <ContadoresEntrada />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{es ? 'Acciones rápidas' : 'Quick actions'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {MODOS.map((m) => (
                <Link key={m.to} to={m.to} style={{ background: m.bg }} className="flex items-center gap-3 rounded-xl p-4 text-white no-underline hover:opacity-90 active:scale-[0.99] transition-all">
                  <span className="text-2xl flex-shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold tracking-widest mb-0.5 opacity-60">{es ? m.label.es : m.label.en}</span>
                    <p className="text-sm font-bold leading-tight">{es ? m.titulo.es : m.titulo.en}</p>
                    <p className="text-xs mt-0.5 opacity-60 leading-snug hidden sm:block">{es ? m.sub.es : m.sub.en}</p>
                  </div>
                  <span className="text-lg opacity-30 flex-shrink-0">›</span>
                </Link>
              ))}
            </div>

            <Link to="/busqueda-cruzada" className="flex items-center gap-3 bg-purple-700 hover:bg-purple-800 rounded-xl p-4 text-white no-underline mb-3 transition-colors">
              <span className="text-2xl flex-shrink-0">🔗</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{es ? 'Regístrate para que te encuentren' : 'Register to be found'}</p>
                <p className="text-xs mt-0.5 opacity-70 leading-snug">{es ? 'Búsqueda cruzada: te buscan o buscas a alguien — conéctense.' : 'Cross-search: looking for you or someone — get connected.'}</p>
              </div>
              <span className="text-lg opacity-30 flex-shrink-0">›</span>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><Phone size={13} className="text-gray-400" /><p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{es ? 'Emergencias' : 'Emergency'}</p></div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TELS.map(({ num, op }) => (
                    <a key={num} href={`tel:${num}`} className="flex flex-col items-center bg-red-600 hover:bg-red-700 rounded-lg py-2.5 px-1 no-underline transition-colors"><span className="text-sm font-bold text-white">{num}</span><span className="text-[9px] text-red-200 mt-0.5">{op}</span></a>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                <div><p className="text-xs font-bold text-amber-800 mb-1">{es ? 'Alerta de seguridad' : 'Security alert'}</p><p className="text-xs text-amber-700 leading-relaxed">{es ? 'Nunca envíes dinero a cambio de información. Es una estafa.' : 'Never send money in exchange for information. It is a scam.'}</p></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="flex gap-2 mb-3">
              <button onClick={() => setModoDir('personas')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${modoDir === 'personas' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                👤 {es ? 'Personas' : 'People'}
              </button>
              <button onClick={() => setModoDir('edificios')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${modoDir === 'edificios' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                🏗️ {es ? 'Edificios' : 'Buildings'}
              </button>
            </div>
            {modoDir === 'personas' ? <DirectorioPersonasEntrada /> : <DirectorioEdificiosEntrada />}
          </div>
        </div>

        {/* Nota: el directorio ya aparece en el panel lateral al seleccionar "Edificios" */}

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-300"><span className="font-semibold text-gray-400">Status Venezuela</span> · {es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}</p>
          <div className="flex gap-3">
            <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 underline">{es ? 'Entrar' : 'Login'}</Link>
            <Link to="/register" className="text-xs text-gray-400 hover:text-gray-600 underline">{es ? 'Registrarme' : 'Sign up'}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}