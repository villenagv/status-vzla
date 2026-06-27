import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import { Phone, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ContadoresEntrada from '@/components/svzla/ContadoresEntrada';
import DirectorioPersonasEntrada from '@/components/svzla/DirectorioPersonasEntrada';
import DirectorioEdificiosEntrada from '@/components/svzla/DirectorioEdificiosEntrada';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const DANO_BADGE = {
  leve:       { es: '🟡 Daño leve',   en: '🟡 Minor',    cls: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' },
  moderado:   { es: '🟠 Moderado',    en: '🟠 Moderate', cls: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  grave:      { es: '🔴 GRAVE',       en: '🔴 SEVERE',   cls: 'bg-red-100 text-red-700',       border: 'border-red-300' },
  critico:    { es: '🔴 CRÍTICO',     en: '🔴 CRITICAL', cls: 'bg-red-200 text-red-900',       border: 'border-red-400' },
  colapsado:  { es: '💥 COLAPSADO',   en: '💥 COLLAPSED',cls: 'bg-gray-800 text-white',        border: 'border-gray-700' },
  no_evaluado:{ es: '⚪ Sin evaluar', en: '⚪ Uneval.',   cls: 'bg-gray-100 text-gray-600',     border: 'border-gray-200' },
};

const MODOS = [
  {
    to: '/zona-afectada', icon: '🆘', bg: '#B83A52',
    label: { es: 'EMERGENCIA', en: 'EMERGENCY' },
    titulo: { es: 'Estoy en zona afectada', en: 'I am in the affected area' },
    sub: { es: 'Reporta daños · Pide ayuda · Informa tu refugio', en: 'Report damage · Ask for help · Share your shelter' }
  },
  {
    to: '/consultar', icon: '🔍', bg: '#1A5276',
    label: { es: 'BUSCAR INFO', en: 'SEARCH INFO' },
    titulo: { es: 'Busco información de una zona', en: 'I need info about an area' },
    sub: { es: 'Edificios · Refugios activos · Zonas de riesgo', en: 'Buildings · Active shelters · Risk areas' }
  },
  {
    to: '/personas', icon: '👤', bg: '#6C3483',
    label: { es: 'PERSONAS', en: 'PEOPLE' },
    titulo: { es: 'Busco o reporto a una persona', en: 'I search or report a person' },
    sub: { es: 'Persona sin contacto · Alguien encontrado · Listas', en: 'Missing person · Someone found · Lists' }
  },
  {
    to: '/edificios', icon: '🏗️', bg: '#784212',
    label: { es: 'EDIFICIOS', en: 'BUILDINGS' },
    titulo: { es: '¿Es seguro este edificio?', en: 'Is this building safe?' },
    sub: { es: 'Consulta daños · Reporta estructuras · Estado actual', en: 'Check damage · Report structures · Current status' }
  },
  {
    to: '/institucional', icon: '🏛️', bg: '#1A5C3A',
    label: { es: 'INSTITUCIÓN', en: 'INSTITUTION' },
    titulo: { es: 'Soy institución o punto de ayuda', en: 'I am an institution or help point' },
    sub: { es: 'Refugio · Hospital · Comedor · Suministros', en: 'Shelter · Hospital · Food · Supplies' }
  },
  {
    to: '/voluntario', icon: '🤝', bg: '#7B3A9E',
    label: { es: 'VOLUNTARIO', en: 'VOLUNTEER' },
    titulo: { es: 'Soy voluntario o personal de apoyo', en: 'I am a volunteer or support staff' },
    sub: { es: 'Cargar listados · Centros · Coordinación', en: 'Upload lists · Centers · Coordination' }
  },
];

const TELS = [
  { num: '171', op: 'CANTV' },
  { num: '*1',  op: 'Movilnet' },
  { num: '112', op: 'Digitel' },
  { num: '911', op: 'Movistar' },
];

export default function Entrada() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [edificiosGrid, setEdificiosGrid] = useState([]);
  const [modoDir, setModoDir] = useState('personas');

  useEffect(() => {
    base44.entities.ReportesDano.list('-created_date', 15)
      .then(d => setEdificiosGrid(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />

      {/* Banner emergencia activa — solo móvil */}
      <div className="md:hidden bg-red-600 text-white px-4 py-2.5 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full bg-white ${!lowBw ? 'animate-pulse' : ''} flex-shrink-0`} />
        <p className="text-xs font-semibold leading-tight">
          {es
            ? '⚠️ Sismo activo · La Guaira, Caracas, Yaracuy · 24 jun 2026'
            : '⚠️ Active earthquake · La Guaira, Caracas, Yaracuy · Jun 24, 2026'}
        </p>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8">

        {/* Encabezado principal */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 leading-tight">
            {es ? '¿Cuál es tu situación?' : 'What is your situation?'}
          </h1>
          <p className="text-sm text-gray-500">
            {es
              ? 'Toca la opción que mejor te describe. Todo es gratuito y sin registro obligatorio.'
              : 'Tap the option that best describes you. Everything is free and no account required.'}
          </p>
        </div>

        {/* Contadores en vivo */}
        <ContadoresEntrada />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 space-y-4">

            {/* Acciones principales */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {es ? '¿Qué necesitas hacer?' : 'What do you need to do?'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MODOS.map((m) => (
                  <Link
                    key={m.to}
                    to={m.to}
                    style={{ background: m.bg }}
                    className="flex items-center gap-3 rounded-2xl p-4 text-white no-underline active:scale-[0.98] transition-transform"
                  >
                    <span className="text-2xl flex-shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-bold tracking-widest mb-0.5 opacity-60">
                        {es ? m.label.es : m.label.en}
                      </span>
                      <p className="text-sm font-bold leading-tight">
                        {es ? m.titulo.es : m.titulo.en}
                      </p>
                      {!lowBw && (
                        <p className="text-xs mt-0.5 opacity-60 leading-snug hidden sm:block">
                          {es ? m.sub.es : m.sub.en}
                        </p>
                      )}
                    </div>
                    <span className="text-lg opacity-30 flex-shrink-0">›</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Búsqueda cruzada */}
            <Link
              to="/busqueda-cruzada"
              className="flex items-center gap-3 bg-purple-700 hover:bg-purple-800 rounded-2xl p-4 text-white no-underline transition-colors"
            >
              <span className="text-2xl flex-shrink-0">🔗</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">
                  {es ? 'Regístrate para que te encuentren' : 'Register to be found'}
                </p>
                <p className="text-xs mt-0.5 opacity-70 leading-snug">
                  {es
                    ? 'Si te buscan o buscas a alguien — conecta los datos de forma privada.'
                    : "If someone is looking for you, or you're looking for someone — connect privately."}
                </p>
              </div>
              <span className="text-lg opacity-30 flex-shrink-0">›</span>
            </Link>

            {/* Panel de emergencias y alerta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Teléfonos */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={12} className="text-gray-400" />
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    {es ? 'Números de emergencia' : 'Emergency numbers'}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TELS.map(({ num, op }) => (
                    <a
                      key={num}
                      href={`tel:${num}`}
                      className="flex flex-col items-center bg-red-600 hover:bg-red-700 rounded-xl py-3 px-1 no-underline transition-colors"
                    >
                      <span className="text-sm font-black text-white">{num}</span>
                      <span className="text-[9px] text-red-200 mt-0.5 leading-tight text-center">{op}</span>
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  {es ? 'Toca para llamar directo' : 'Tap to call directly'}
                </p>
              </div>

              {/* Alerta anti-extorsión */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <span className="text-base flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900 mb-1">
                      {es ? 'Alerta de seguridad' : 'Security alert'}
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {es
                        ? 'Nunca envíes dinero a cambio de información. Si alguien te pide dinero para localizar a alguien, es una estafa. Repórtalo.'
                        : "Never send money in exchange for information. If someone asks for money to locate a person, it's a scam. Report it."}
                    </p>
                  </div>
                </div>
                <Link
                  to="/personas"
                  className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-lg px-3 py-1.5 text-center no-underline"
                >
                  {es ? '→ Buscar personas de forma gratuita' : '→ Search people for free'}
                </Link>
              </div>
            </div>

            {/* Qué no debe suceder */}
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex gap-3">
              <span className="text-base flex-shrink-0">🚫</span>
              <p className="text-xs text-red-800 leading-relaxed font-medium">
                {es
                  ? 'No entres a estructuras dañadas. Ante grietas graves, olor a gas, cables caídos o personas atrapadas: llama primero a Protección Civil (171) o Bomberos.'
                  : 'Do not enter damaged structures. If there are serious cracks, gas smell, fallen wires or trapped people: call Civil Protection (171) or Firefighters first.'}
              </p>
            </div>
          </div>

          {/* Panel lateral — directorio rápido */}
          <div className="lg:col-span-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {es ? 'Directorio rápido' : 'Quick directory'}
            </p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setModoDir('personas')}
                className={`flex-1 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${modoDir === 'personas' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                👤 {es ? 'Personas' : 'People'}
              </button>
              <button
                onClick={() => setModoDir('edificios')}
                className={`flex-1 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${modoDir === 'edificios' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                🏗️ {es ? 'Edificios' : 'Buildings'}
              </button>
            </div>
            {modoDir === 'personas' ? <DirectorioPersonasEntrada /> : <DirectorioEdificiosEntrada />}

            {/* Accesos rápidos extra */}
            <div className="mt-3 space-y-2">
              <Link to="/centros-apoyo" className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 no-underline">
                <span className="text-sm">🏥</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-teal-800">{es ? 'Centros de apoyo y refugios' : 'Support centers & shelters'}</p>
                  <p className="text-[10px] text-teal-600">{es ? 'Hospitales, acopios, ONGs activas' : 'Hospitals, supplies, active NGOs'}</p>
                </div>
                <span className="text-xs text-teal-400">›</span>
              </Link>
              <Link to="/buscar-persona" className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2.5 no-underline">
                <span className="text-sm">🔎</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-800">{es ? 'Reportar persona desaparecida' : 'Report a missing person'}</p>
                  <p className="text-[10px] text-purple-600">{es ? 'Registra búsqueda · Recibe alertas' : 'Register search · Get alerts'}</p>
                </div>
                <span className="text-xs text-purple-400">›</span>
              </Link>
              <Link to="/reportar-encontrado" className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 no-underline">
                <span className="text-sm">🙋</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-800">{es ? 'Encontré a alguien' : 'I found someone'}</p>
                  <p className="text-[10px] text-green-600">{es ? 'Reporta persona encontrada o a salvo' : 'Report someone found or safe'}</p>
                </div>
                <span className="text-xs text-green-400">›</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Grid de edificios */}
        {edificiosGrid.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  🏗️ {es ? 'Directorio de edificios' : 'Buildings directory'}
                </p>
                <h2 className="text-base font-bold text-gray-900">
                  {es ? 'Edificios reportados recientemente' : 'Recently reported buildings'}
                </h2>
              </div>
              <Link to="/edificios" className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg no-underline">
                {es ? 'Ver todos →' : 'View all →'}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {edificiosGrid.slice(0, 15).map(e => {
                const st = DANO_BADGE[e.nivel_dano] || DANO_BADGE.no_evaluado;
                const esCritico = ['grave', 'critico', 'colapsado'].includes(e.nivel_dano);
                return (
                  <Link
                    key={e.id}
                    to={`/edificio?id=${e.id}`}
                    className={`bg-white border rounded-xl p-3 no-underline hover:shadow-sm transition-shadow flex flex-col gap-1.5 ${esCritico ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 flex-1">
                        {e.nombre_lugar || e.tipo_estructura || (es ? 'Edificio' : 'Building')}
                      </p>
                      {esCritico && <span className="text-sm flex-shrink-0">🚫</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug line-clamp-1">
                      📍 {[e.direccion, e.ciudad].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <span className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${st.cls} ${st.border}`}>
                      {es ? st.es : st.en}
                    </span>
                    {e.personas_atrapadas === 'si' && (
                      <span className="text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full self-start">
                        🆘 {es ? 'Atrapados' : 'Trapped'}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <Link
              to="/reportar-dano"
              className="mt-3 flex items-center justify-center gap-2 w-full border border-dashed border-gray-300 rounded-xl py-2.5 text-xs font-semibold text-gray-500 no-underline hover:border-gray-500 transition-colors"
            >
              + {es ? 'Reportar edificio dañado' : 'Report damaged building'}
            </Link>
          </div>
        )}

        {/* Pie de página interno */}
        <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-300">
            <span className="font-semibold text-gray-400">Status Venezuela</span>
            {' · '}{es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}
          </p>
          <div className="flex gap-3">
            <Link to="/aliados" className="text-xs text-gray-400 hover:text-gray-600">
              {es ? 'Aliados' : 'Partners'}
            </Link>
            <Link to="/contactanos" className="text-xs text-gray-400 hover:text-gray-600">
              {es ? 'Contacto' : 'Contact'}
            </Link>
            <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">
              {es ? 'Entrar' : 'Login'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}