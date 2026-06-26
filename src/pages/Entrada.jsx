import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import { Phone } from 'lucide-react';

const MODOS = [
  {
    to: '/zona-afectada',
    icon: '🆘',
    bg: '#C0392B',
    hoverBg: '#A93226',
    labelColor: '#FFCDD2',
    label: { es: 'EMERGENCIA', en: 'EMERGENCY' },
    titulo: { es: 'Estoy en zona afectada', en: 'I am in the affected area' },
    sub: { es: 'Reporta daños · Pide ayuda · Informa refugio', en: 'Report damage · Ask for help · Shelter' },
  },
  {
    to: '/consultar',
    icon: '🔍',
    bg: '#1A5276',
    hoverBg: '#154360',
    labelColor: '#BBDEFB',
    label: { es: 'CONSULTAR', en: 'SEARCH INFO' },
    titulo: { es: 'Busco información de una zona', en: 'I need info about an area' },
    sub: { es: 'Edificios · Refugios activos · Zonas', en: 'Buildings · Shelters · Areas' },
  },
  {
    to: '/personas',
    icon: '👤',
    bg: '#6C3483',
    hoverBg: '#5B2C6F',
    labelColor: '#E1BEE7',
    label: { es: 'PERSONAS', en: 'PEOPLE' },
    titulo: { es: 'Busco o reporto a una persona', en: 'I search or report a person' },
    sub: { es: 'Persona sin contacto · Alguien encontrado', en: 'Missing person · Someone found' },
  },
  {
    to: '/edificios',
    icon: '🏗️',
    bg: '#784212',
    hoverBg: '#633510',
    labelColor: '#FFE0B2',
    label: { es: 'EDIFICIOS', en: 'BUILDINGS' },
    titulo: { es: '¿Es seguro este edificio?', en: 'Is this building safe?' },
    sub: { es: 'Consulta daños · Reporta estructuras · Ver estado', en: 'Check damage · Report structures · View status' },
  },
  {
    to: '/institucional',
    icon: '🏛️',
    bg: '#1A5C3A',
    hoverBg: '#145A32',
    labelColor: '#C8E6C9',
    label: { es: 'INSTITUCIÓN', en: 'INSTITUTION' },
    titulo: { es: 'Soy institución o punto de ayuda', en: 'I am an institution or help point' },
    sub: { es: 'Refugio · Hospital · Comedor · Donaciones', en: 'Shelter · Hospital · Food · Donations' },
  },
];

const TELS = [
  { num: '171', op: 'CANTV' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

export default function Entrada() {
  const { lang, toggle: toggleLang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── TopBar blanca ── */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Status<span className="text-amber-600">Vzla</span>
            </span>
            <span className="hidden sm:inline ml-2 text-xs text-gray-400 font-medium tracking-widest uppercase">CRIS</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Alerta activa — compacta en header */}
            <div className="hidden md:flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <p className="text-xs font-semibold text-red-700">
                {es ? 'Terremoto activo · La Guaira, Caracas, Yaracuy' : 'Active earthquake · La Guaira, Caracas, Yaracuy'}
              </p>
            </div>

            <button onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">
              {es ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Banner alerta móvil ── */}
      <div className="md:hidden bg-red-600 text-white px-4 py-2.5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
        <p className="text-xs font-semibold">
          {es ? 'Terremoto activo · La Guaira, Caracas, Yaracuy · 24 junio 2026' : 'Active earthquake · La Guaira, Caracas, Yaracuy · June 24, 2026'}
        </p>
      </div>

      {/* ── Layout principal ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">

        {/* Headline */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {es ? '¿Cuál es tu situación?' : 'What is your situation?'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            {es ? 'Toca o haz clic en la opción que mejor te describe.' : 'Tap or click the option that best describes you.'}
          </p>
        </div>

        {/* Grid de modos — 1 col móvil / 2-3 col PC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {MODOS.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              style={{ background: m.bg }}
              className="group flex items-center gap-4 rounded-2xl p-5 text-white no-underline transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
            >
              <span className="text-3xl flex-shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold tracking-widest mb-1 opacity-70">
                  {es ? m.label.es : m.label.en}
                </span>
                <p className="text-base font-bold leading-tight">
                  {es ? m.titulo.es : m.titulo.en}
                </p>
                <p className="text-xs mt-1 opacity-70 leading-relaxed">
                  {es ? m.sub.es : m.sub.en}
                </p>
              </div>
              <span className="text-xl opacity-40 flex-shrink-0">›</span>
            </Link>
          ))}
        </div>

        {/* ── Sección inferior: teléfonos + advertencia ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Teléfonos de emergencia */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={14} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {es ? 'Líneas de emergencia' : 'Emergency lines'}
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TELS.map(({ num, op }) => (
                <a key={num} href={`tel:${num}`}
                  className="flex flex-col items-center bg-red-600 hover:bg-red-700 rounded-xl py-3 px-1 no-underline transition-colors">
                  <span className="text-sm font-bold text-white">{num}</span>
                  <span className="text-[9px] text-red-200 mt-0.5">{op}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Anti-extorsión */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-800 mb-1">
                {es ? 'Alerta de seguridad' : 'Security alert'}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {es
                  ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados. Si alguien pide dinero, es una estafa.'
                  : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees. If someone asks for money, it is a scam.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer discreto */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-300">
            <span className="font-semibold text-gray-400">StatusVzla</span> · CRIS · {es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}
          </p>
          <Link to="/login" className="text-xs text-gray-300 hover:text-gray-500 underline">
            {es ? 'Acceso institucional / Admin' : 'Institutional access / Admin'}
          </Link>
        </div>
      </main>
    </div>
  );
}