import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, CheckCircle, ChevronLeft, MapPin, Loader2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

// Normaliza texto para comparación anti-duplicados
function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similitud(a, b) {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  const common = wordsA.filter(w => w.length > 3 && wordsB.includes(w));
  return common.length / Math.max(wordsA.length, wordsB.length);
}

const DANO_CONFIG = {
  leve:      { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', label: { es: 'Daño leve',     en: 'Minor damage' },    icon: '🟡', acceso: { es: 'Entrada con precaución', en: 'Enter with caution' } },
  moderado:  { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠', acceso: { es: 'Entrada limitada',       en: 'Limited entry' } },
  grave:     { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', label: { es: 'Daño grave',     en: 'Severe damage' },   icon: '🔴', acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER' } },
  critico:   { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', label: { es: 'CRÍTICO',         en: 'CRITICAL' },        icon: '🚨', acceso: { es: 'NO ENTRAR — PELIGRO EXTREMO', en: 'DO NOT ENTER — EXTREME DANGER' } },
  no_evaluado:{ color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin evaluar',   en: 'Not evaluated' },   icon: '⚪', acceso: { es: 'Precaución — sin verificar', en: 'Caution — unverified' } },
  no_sabe:   { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin datos',      en: 'No data' },         icon: '⚪', acceso: { es: 'Sin información',         en: 'No information' } },
};

const TIPO_OPTS = [
  { val: 'edificio_residencial', es: '🏠 Edificio residencial',   en: '🏠 Residential building' },
  { val: 'hospital',             es: '🏥 Hospital / CDI',          en: '🏥 Hospital / Clinic' },
  { val: 'escuela',              es: '🏫 Escuela / Liceo',         en: '🏫 School' },
  { val: 'iglesia',              es: '⛪ Iglesia',                 en: '⛪ Church' },
  { val: 'comercio',             es: '🏪 Comercio',               en: '🏪 Business' },
  { val: 'calle_via',            es: '🛣️ Calle / Vía',            en: '🛣️ Street / Road' },
  { val: 'puente',               es: '🌉 Puente',                  en: '🌉 Bridge' },
  { val: 'servicio_publico',     es: '🔌 Servicio público',       en: '🔌 Public utility' },
  { val: 'otro',                 es: '📋 Otro',                   en: '📋 Other' },
];

const NIVEL_OPTS = [
  { val: 'leve',        es: 'Leve — grietas pequeñas, estructura firme',      en: 'Minor — small cracks, structure firm' },
  { val: 'moderado',    es: 'Moderado — paredes o piso dañados',              en: 'Moderate — walls or floor damaged' },
  { val: 'grave',       es: 'Grave — parte colapsó o riesgo alto',            en: 'Severe — partial collapse or high risk' },
  { val: 'critico',     es: 'Crítico — colapso total o personas atrapadas',   en: 'Critical — total collapse or trapped' },
  { val: 'no_sabe',     es: 'No sé / No pude evaluar',                        en: "Don't know / Can't evaluate" },
];

const ATRAPADOS_OPTS = [
  { val: 'si',          es: '🚨 Sí, confirmado',               en: '🚨 Yes, confirmed' },
  { val: 'voces',       es: '👂 Se escuchan voces o golpes',    en: '👂 Voices or knocking heard' },
  { val: 'familiares',  es: '👨‍👩‍👧 Familiares dicen que hay alguien', en: '👨‍👩‍👧 Family says someone is inside' },
  { val: 'no',          es: '✅ No',                            en: '✅ No' },
  { val: 'no_sabe',     es: '❓ No se sabe',                   en: '❓ Unknown' },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 placeholder-gray-400";

export default function Edificios() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [tab, setTab] = useState('consultar'); // 'consultar' | 'reportar'

  // --- CONSULTAR ---
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscarEdificio = async () => {
    if (!query.trim()) return;
    setBuscando(true);
    setBuscado(false);
    try {
      const todos = await base44.entities.ReportesDano.list();
      const q = normalizar(query);
      const encontrados = todos.filter(r => {
        const dir = normalizar(r.direccion || '');
        const ciudad = normalizar(r.ciudad || '');
        const nombre = normalizar(r.nombre_lugar || '');
        return similitud(q, dir) > 0.4 || similitud(q, ciudad) > 0.6
          || similitud(q, nombre) > 0.5 || dir.includes(q) || ciudad.includes(q) || nombre.includes(q);
      }).sort((a, b) => {
        const ord = { critico: 0, grave: 1, moderado: 2, leve: 3, no_evaluado: 4 };
        return (ord[a.nivel_dano] ?? 4) - (ord[b.nivel_dano] ?? 4);
      });
      setResultados(encontrados);
    } catch {}
    setBuscando(false);
    setBuscado(true);
  };

  // --- REPORTAR ---
  const [tipo, setTipo] = useState('');
  const [nombreLugar, setNombreLugar] = useState('');
  const [nivel, setNivel] = useState('');
  const [atrapados, setAtrapados] = useState('');
  const [riesgoGas, setRiesgoGas] = useState(false);
  const [riesgoElec, setRiesgoElec] = useState(false);
  const [riesgoIncendio, setRiesgoIncendio] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contacto, setContacto] = useState('');

  const [posiblesDups, setPosiblesDups] = useState([]);
  const [checkDup, setCheckDup] = useState(false);
  const [buscandoDup, setBuscandoDup] = useState(false);
  const [decisionDup, setDecisionDup] = useState(null); // null | 'nuevo' | 'actualizar'
  const [dupTarget, setDupTarget] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(null);

  const esCritico = nivel === 'critico' || nivel === 'grave' || atrapados === 'si' || atrapados === 'voces';

  const buscarDuplicados = async () => {
    if (!direccion.trim() && !nombreLugar.trim()) return;
    setBuscandoDup(true);
    try {
      const todos = await base44.entities.ReportesDano.list();
      const queryStr = normalizar(direccion || nombreLugar);
      const dups = todos.filter(r => {
        const dir = normalizar(r.direccion || '');
        const nom = normalizar(r.nombre_lugar || '');
        return similitud(queryStr, dir) > 0.55 || similitud(queryStr, nom) > 0.55;
      });
      setPosiblesDups(dups);
    } catch {}
    setBuscandoDup(false);
    setCheckDup(true);
  };

  const handleSubmit = async () => {
    setEnviando(true);
    try {
      const prioridad = (nivel === 'critico' || atrapados === 'si' || atrapados === 'voces') ? 'critica'
        : nivel === 'grave' ? 'alta' : 'normal';

      await base44.entities.ReportesDano.create({
        tipo_estructura: tipo || 'otro',
        nombre_lugar: nombreLugar,
        nivel_dano: nivel || 'no_evaluado',
        personas_atrapadas: atrapados || 'no_sabe',
        riesgo_gas: riesgoGas,
        riesgo_electrico: riesgoElec,
        riesgo_incendio: riesgoIncendio,
        direccion,
        ciudad,
        estado_region: estado,
        descripcion,
        prioridad,
        estado_verificacion: 'recibido',
        nivel_verificacion: 'sin_verificar',
        fuente: 'ciudadano',
      });
      setExito(true);
    } catch { setExito(false); }
    setEnviando(false);
  };

  const cfg = (d) => DANO_CONFIG[d] || DANO_CONFIG.no_evaluado;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3">
            <ChevronLeft size={15} /> {es ? 'Inicio' : 'Home'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            🏗️ {es ? 'Edificios y Estructuras' : 'Buildings & Structures'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {es
              ? 'Consulta si un edificio tiene daños o es seguro. Reporta daños que hayas visto.'
              : 'Check if a building is damaged or safe. Report damage you have seen.'}
          </p>
        </div>

        {/* Alerta de seguridad */}
        <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium leading-relaxed">
            {es
              ? 'No entres a estructuras dañadas. Si hay grietas graves, colapso, olor a gas, cables caídos o personas atrapadas — llama a Protección Civil (171) o Bomberos antes de actuar.'
              : 'Do not enter damaged structures. If there are major cracks, collapse, gas smell, fallen wires, or trapped people — call Civil Protection (171) or Firefighters first.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { key: 'consultar', label: { es: '🔍 Consultar edificio', en: '🔍 Check building' } },
            { key: 'reportar',  label: { es: '📋 Reportar daño',       en: '📋 Report damage' } },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {es ? t.label.es : t.label.en}
            </button>
          ))}
        </div>

        {/* ── TAB: CONSULTAR ── */}
        {tab === 'consultar' && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                {es ? '¿Es seguro este edificio?' : 'Is this building safe?'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {es
                  ? 'Escribe la dirección, nombre o zona para ver si hay reportes de daños.'
                  : 'Type the address, name or area to see if there are damage reports.'}
              </p>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarEdificio()}
                  placeholder={es ? 'Ej: Edif. Las Torres, Av. Principal, La Guaira...' : 'E.g: Las Torres building, Main Ave, La Guaira...'}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500"
                />
                <button onClick={buscarEdificio} disabled={buscando}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                  {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  {es ? 'Buscar' : 'Search'}
                </button>
              </div>
            </div>

            {buscado && !buscando && resultados.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800 text-sm">
                  {es ? 'Sin reportes de daño para esta búsqueda.' : 'No damage reports found for this search.'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {es ? 'Esto no garantiza que el edificio sea 100% seguro. Si ves daños, repórtalos.' : 'This does not guarantee the building is 100% safe. If you see damage, report it.'}
                </p>
                <button onClick={() => setTab('reportar')} className="mt-3 text-sm text-blue-700 underline cursor-pointer">
                  {es ? 'Reportar daño en este edificio →' : 'Report damage in this building →'}
                </button>
              </div>
            )}

            {resultados.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-medium">
                  {es ? `${resultados.length} reporte(s) encontrado(s)` : `${resultados.length} report(s) found`}
                </p>
                {resultados.map(r => {
                  const c = cfg(r.nivel_dano);
                  const noEntrar = ['grave', 'critico'].includes(r.nivel_dano);
                  return (
                    <div key={r.id} style={{ background: c.bg, borderColor: c.border }}
                      className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{c.icon}</span>
                            <span className="font-bold text-sm" style={{ color: c.color }}>
                              {es ? c.label.es : c.label.en}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {r.nombre_lugar || r.tipo_estructura}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {r.direccion} · {r.ciudad}, {r.estado_region}
                          </p>
                        </div>
                        {noEntrar && (
                          <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0 text-center leading-tight">
                            {es ? 'NO\nENTRAR' : 'DO NOT\nENTER'}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {r.personas_atrapadas === 'si' && (
                          <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                            🚨 {es ? 'Personas atrapadas' : 'Trapped people'}
                          </span>
                        )}
                        {r.riesgo_gas && <span className="text-xs bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">💨 {es ? 'Gas' : 'Gas'}</span>}
                        {r.riesgo_electrico && <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">⚡ {es ? 'Eléctrico' : 'Electrical'}</span>}
                        {r.riesgo_incendio && <span className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">🔥 {es ? 'Incendio' : 'Fire'}</span>}
                      </div>

                      <div className="mt-2 pt-2 border-t" style={{ borderColor: c.border }}>
                        <p className="text-xs font-medium" style={{ color: c.color }}>
                          🚪 {es ? c.acceso.es : c.acceso.en}
                        </p>
                        {r.descripcion && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {es ? 'Fuente:' : 'Source:'} {r.fuente || 'ciudadano'} · {es ? 'Estado:' : 'Status:'} {r.estado_verificacion || 'recibido'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: REPORTAR ── */}
        {tab === 'reportar' && (
          <div className="max-w-2xl">
            {exito === true && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-4">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold text-green-800 text-lg mb-1">{es ? 'Reporte enviado.' : 'Report submitted.'}</h3>
                <p className="text-sm text-green-700 mb-3">
                  {es ? 'Gracias. Tu reporte ayuda a que otras personas eviten el peligro.' : 'Thank you. Your report helps others avoid danger.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setExito(null); setTipo(''); setNivel(''); setAtrapados(''); setDireccion(''); setCiudad(''); setEstado(''); setDescripcion(''); setNombreLugar(''); setCheckDup(false); setDecisionDup(null); setPosiblesDups([]); }}
                    className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    {es ? 'Reportar otro' : 'Report another'}
                  </button>
                  <button onClick={() => setTab('consultar')} className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">
                    {es ? 'Ver reportes' : 'View reports'}
                  </button>
                </div>
              </div>
            )}

            {exito !== true && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {es
                    ? 'Completa este formulario con lo que puedes ver desde afuera o desde un lugar seguro. No entres a estructuras dañadas.'
                    : 'Fill this form with what you can see from outside or a safe location. Do not enter damaged structures.'}
                </p>

                {/* Tipo de estructura */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    1. {es ? '¿Qué tipo de estructura es?' : 'What type of structure?'} <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIPO_OPTS.map(t => (
                      <button key={t.val} onClick={() => setTipo(t.val)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${tipo === t.val ? 'bg-blue-700 text-white border-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                        {es ? t.es : t.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre y dirección */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    2. {es ? '¿Dónde está?' : 'Where is it?'} <span className="text-red-500">*</span>
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{es ? 'Nombre del lugar (si lo sabes)' : 'Place name (if known)'}</label>
                    <input value={nombreLugar} onChange={e => setNombreLugar(e.target.value)}
                      placeholder={es ? 'Ej: Edificio Las Torres, Hospital Central...' : 'E.g: Las Torres building, Central Hospital...'}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{es ? 'Dirección o referencia' : 'Address or reference'} <span className="text-red-500">*</span></label>
                    <input value={direccion} onChange={e => { setDireccion(e.target.value); setCheckDup(false); setDecisionDup(null); }}
                      onBlur={buscarDuplicados}
                      placeholder={es ? 'Ej: Av. Soublette, frente al mercado, La Guaira' : 'E.g: Soublette Ave, next to market, La Guaira'}
                      className={inputCls} />
                    {buscandoDup && <p className="text-xs text-gray-400 mt-1">⏳ {es ? 'Verificando duplicados...' : 'Checking for duplicates...'}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{es ? 'Ciudad' : 'City'} <span className="text-red-500">*</span></label>
                      <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="La Guaira" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{es ? 'Estado' : 'State'} <span className="text-red-500">*</span></label>
                      <input value={estado} onChange={e => setEstado(e.target.value)} placeholder="Vargas" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Panel de duplicados */}
                {checkDup && posiblesDups.length > 0 && decisionDup === null && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">{es ? '¡Ya existe un reporte similar!' : 'A similar report already exists!'}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{es ? '¿Es el mismo lugar? Puedes ver el existente o crear uno nuevo si es diferente.' : 'Is it the same place? You can view the existing one or create a new one if different.'}</p>
                      </div>
                    </div>
                    {posiblesDups.slice(0, 2).map(d => {
                      const c = cfg(d.nivel_dano);
                      return (
                        <div key={d.id} className="bg-white border border-amber-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-gray-800">{d.nombre_lugar || d.tipo_estructura}</p>
                              <p className="text-xs text-gray-500">{d.direccion} · {d.ciudad}</p>
                              <span className="text-xs font-semibold" style={{ color: c.color }}>{c.icon} {es ? c.label.es : c.label.en}</span>
                            </div>
                            <button onClick={() => { setDupTarget(d); setDecisionDup('actualizar'); }}
                              className="text-xs bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg font-semibold cursor-pointer hover:bg-amber-200">
                              {es ? 'Es este ↗' : 'This one ↗'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => setDecisionDup('nuevo')}
                      className="w-full text-sm text-gray-600 border border-gray-200 bg-white py-2.5 rounded-lg cursor-pointer hover:bg-gray-50">
                      {es ? 'No, es un lugar diferente — crear nuevo reporte' : 'No, different place — create new report'}
                    </button>
                  </div>
                )}

                {/* Mensaje si quiere actualizar existente */}
                {decisionDup === 'actualizar' && dupTarget && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
                    <p className="text-sm font-semibold text-blue-800">
                      {es ? 'Para actualizar ese reporte, usa la sección de Consultar.' : 'To update that report, use the Search section.'}
                    </p>
                    <button onClick={() => setTab('consultar')} className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">
                      {es ? 'Ir a Consultar →' : 'Go to Search →'}
                    </button>
                    <button onClick={() => setDecisionDup('nuevo')} className="block w-full text-xs text-gray-400 mt-1 cursor-pointer">
                      {es ? 'De todas formas crear nuevo reporte' : 'Create new report anyway'}
                    </button>
                  </div>
                )}

                {/* Nivel de daño */}
                {(decisionDup === 'nuevo' || posiblesDups.length === 0 || !checkDup) && (
                  <>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        3. {es ? 'Nivel de daño visible' : 'Visible damage level'} <span className="text-red-500">*</span>
                      </h3>
                      <div className="space-y-2">
                        {NIVEL_OPTS.map(n => (
                          <button key={n.val} onClick={() => setNivel(n.val)}
                            className={`w-full py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${nivel === n.val
                              ? n.val === 'critico' ? 'bg-red-700 text-white border-red-700'
                              : n.val === 'grave' ? 'bg-red-500 text-white border-red-500'
                              : n.val === 'moderado' ? 'bg-orange-500 text-white border-orange-500'
                              : n.val === 'leve' ? 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-gray-600 text-white border-gray-600'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}>
                            {es ? n.es : n.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        4. {es ? '¿Hay personas atrapadas?' : 'Are there trapped people?'} <span className="text-red-500">*</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ATRAPADOS_OPTS.map(a => (
                          <button key={a.val} onClick={() => setAtrapados(a.val)}
                            className={`py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${atrapados === a.val
                              ? (a.val === 'si' || a.val === 'voces') ? 'bg-red-600 text-white border-red-600' : 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}>
                            {es ? a.es : a.en}
                          </button>
                        ))}
                      </div>
                      {(atrapados === 'si' || atrapados === 'voces') && (
                        <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3">
                          <p className="text-sm font-bold text-red-700">
                            🚨 {es ? 'Llama AHORA a Protección Civil (171) o Bomberos. No intentes rescatar solo.' : 'Call NOW Civil Protection (171) or Firefighters. Do not attempt rescue alone.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Riesgos adicionales */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        5. {es ? 'Riesgos adicionales (marca todos los que apliquen)' : 'Additional hazards (check all that apply)'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: riesgoGas, set: setRiesgoGas,   label: { es: '💨 Olor a gas', en: '💨 Gas smell' } },
                          { val: riesgoElec, set: setRiesgoElec, label: { es: '⚡ Cables caídos / riesgo eléctrico', en: '⚡ Fallen wires / electrical hazard' } },
                          { val: riesgoIncendio, set: setRiesgoIncendio, label: { es: '🔥 Riesgo de incendio', en: '🔥 Fire hazard' } },
                        ].map((r, i) => (
                          <button key={i} onClick={() => r.set(v => !v)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${r.val ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'}`}>
                            {es ? r.label.es : r.label.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Descripción y contacto */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800">
                        6. {es ? 'Descripción y tus datos' : 'Description and your info'}
                      </h3>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {es ? 'Describe brevemente lo que ves (opcional)' : 'Briefly describe what you see (optional)'}
                        </label>
                        <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={200}
                          placeholder={es ? 'Ej: Fachada colapsada, cables caídos en la calle, se escuchan voces...' : 'E.g: Facade collapsed, wires on street, voices heard...'}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 resize-none placeholder-gray-400" />
                        <p className="text-right text-xs text-gray-400">{descripcion.length}/200</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          🔒 {es ? 'Tu contacto (privado, no se publica)' : 'Your contact (private, not published)'}
                        </label>
                        <input value={contacto} onChange={e => setContacto(e.target.value)}
                          placeholder={es ? 'Teléfono, WhatsApp o email...' : 'Phone, WhatsApp or email...'}
                          className={inputCls} />
                      </div>
                    </div>

                    {/* Alerta crítica */}
                    {esCritico && (
                      <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3">
                        <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-700">
                          {es
                            ? '⚠️ Este reporte será marcado como CRÍTICO. Llama primero a Protección Civil (171) o Bomberos si hay peligro inmediato.'
                            : '⚠️ This report will be marked CRITICAL. Call Civil Protection (171) or Firefighters first if there is immediate danger.'}
                        </p>
                      </div>
                    )}

                    {/* Botón enviar */}
                    <button
                      onClick={handleSubmit}
                      disabled={enviando || !tipo || !nivel || !atrapados || !direccion || !ciudad || !estado}
                      className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors ${esCritico ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
                      {enviando ? <Loader2 size={18} className="animate-spin" /> : (esCritico ? '🚨' : '📋')}
                      {esCritico
                        ? (es ? 'Enviar alerta crítica' : 'Send critical alert')
                        : (es ? 'Enviar reporte de daño' : 'Submit damage report')}
                    </button>

                    {(!tipo || !nivel || !atrapados || !direccion || !ciudad || !estado) && (
                      <p className="text-center text-xs text-gray-400">
                        {es ? 'Completa los campos obligatorios (*) para enviar.' : 'Fill in required fields (*) to submit.'}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}