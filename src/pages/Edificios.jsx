import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, CheckCircle, ChevronLeft, MapPin, Loader2, ShieldAlert, Camera, X, Image } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import GaleriaFotos from '@/components/svzla/GaleriaFotos';
import { VistaToggler } from '@/components/svzla/VistaToggler';

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
function similitud(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wA = na.split(' '), wB = nb.split(' ');
  return wA.filter(w => w.length > 3 && wB.includes(w)).length / Math.max(wA.length, wB.length);
}

const DANO_CONFIG = {
  leve:       { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', label: { es: 'Daño leve',     en: 'Minor damage' },    icon: '🟡', acceso: { es: 'Entrada con precaución', en: 'Enter with caution' } },
  moderado:   { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠', acceso: { es: 'Entrada limitada',       en: 'Limited entry' } },
  grave:      { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', label: { es: 'Daño grave',     en: 'Severe damage' },   icon: '🔴', acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER' } },
  critico:    { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', label: { es: 'CRÍTICO',         en: 'CRITICAL' },        icon: '🚨', acceso: { es: 'NO ENTRAR — PELIGRO EXTREMO', en: 'DO NOT ENTER — EXTREME DANGER' } },
  no_evaluado:{ color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin evaluar',    en: 'Not evaluated' },   icon: '⚪', acceso: { es: 'Precaución — sin verificar', en: 'Caution — unverified' } },
  no_sabe:    { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin datos',      en: 'No data' },         icon: '⚪', acceso: { es: 'Sin información',         en: 'No information' } },
  colapsado:  { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', label: { es: 'COLABSADO',      en: 'COLLAPSED' },       icon: '💥', acceso: { es: 'NO ENTRAR — COLABSADO',     en: 'DO NOT ENTER — COLLAPSED' } },
};

const TIPO_OPTS = [
  { val: 'edificio_residencial', es: '🏠 Edificio residencial',  en: '🏠 Residential building' },
  { val: 'hospital',             es: '🏥 Hospital / CDI',         en: '🏥 Hospital / Clinic' },
  { val: 'escuela',              es: '🏫 Escuela / Liceo',        en: '🏫 School' },
  { val: 'iglesia',              es: '⛪ Iglesia',                en: '⛪ Church' },
  { val: 'comercio',             es: '🏪 Comercio',              en: '🏪 Business' },
  { val: 'calle_via',            es: '🛣️ Calle / Vía',           en: '🛣️ Street / Road' },
  { val: 'puente',               es: '🌉 Puente',                 en: '🌉 Bridge' },
  { val: 'servicio_publico',     es: '🔌 Servicio público',      en: '🔌 Public utility' },
  { val: 'otro',                 es: '📋 Otro',                  en: '📋 Other' },
];
const NIVEL_OPTS = [
  { val: 'leve',     es: 'Leve — grietas pequeñas, estructura firme',    en: 'Minor — small cracks, structure firm' },
  { val: 'moderado', es: 'Moderado — paredes o piso dañados',            en: 'Moderate — walls or floor damaged' },
  { val: 'grave',    es: 'Grave — parte colapsó o riesgo alto',          en: 'Severe — partial collapse or high risk' },
  { val: 'critico',  es: 'Crítico — colapso total o personas atrapadas', en: 'Critical — total collapse or trapped' },
  { val: 'no_sabe',  es: 'No sé / No pude evaluar',                      en: "Don't know / Can't evaluate" },
  { val: 'colapsado',es: '💥 Colapsado — estructura derrumbada',            en: '💥 Collapsed — structure down' },
];
const ATRAPADOS_OPTS = [
  { val: 'si',        es: '🚨 Sí, confirmado',                    en: '🚨 Yes, confirmed' },
  { val: 'voces',     es: '👂 Se escuchan voces o golpes',         en: '👂 Voices or knocking heard' },
  { val: 'familiares',es: '👨‍👩‍👧 Familiares dicen que hay alguien',  en: '👨‍👩‍👧 Family says someone is inside' },
  { val: 'no',        es: '✅ No',                                 en: '✅ No' },
  { val: 'no_sabe',   es: '❓ No se sabe',                        en: '❓ Unknown' },
];

const PERSONA_ESTADO = {
  buscando:             { es: 'Buscando',          en: 'Searching',        cls: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida: { es: 'Info recibida',     en: 'Info received',    cls: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado:  { es: 'Visto s/confirm.',  en: 'Seen – unconf.',   cls: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida:  { es: 'Encontrado ✅',     en: 'Found alive ✅',   cls: 'bg-green-100 text-green-800' },
  en_hospital_refugio:  { es: 'Hospital/Refugio',  en: 'Hospital/Shelter', cls: 'bg-teal-100 text-teal-800' },
  fallecido_reportado:  { es: 'Fall. reportado',   en: 'Death reported',   cls: 'bg-gray-200 text-gray-700' },
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 placeholder-gray-400";
const MAX_FOTOS = 5;

export default function Edificios() {
  const { lang } = useLang();
  const es = lang === 'es';
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || params.get('modo') === 'request' ? 'solicitar' : 'directorio';
  const [tab, setTab] = useState(initialTab); // 'directorio' | 'consultar' | 'reportar' | 'solicitar'

  // ── DIRECTORIO ──
  const [todos, setTodos] = useState([]);
  const [cargandoDir, setCargandoDir] = useState(true);
  const [filtroDir, setFiltroDir] = useState('');
  const [pageDir, setPageDir] = useState(8);
  const [vistaDir, setVistaDir] = useState('tabla');

  // ── PERSONAS ──
  const [personas, setPersonas] = useState([]);
  const [encontrados, setEncontrados] = useState([]);
  const [cargandoPer, setCargandoPer] = useState(true);
  const [filtroPer, setFiltroPer] = useState('');
  const [pagePer, setPagePer] = useState(8);

  useEffect(() => {
    base44.entities.ReportesDano.list('-created_date', 200)
      .then(d => setTodos(d))
      .catch(() => {})
      .finally(() => setCargandoDir(false));
    Promise.all([
      base44.entities.PersonasBuscadas.list('-created_date', 100),
      base44.entities.PersonasEncontradas.list('-created_date', 50),
    ]).then(([b, e]) => {
      setPersonas(b.filter(p => p.estado_caso !== 'caso_cerrado'));
      setEncontrados(e);
    }).catch(() => {}).finally(() => setCargandoPer(false));
  }, []);

  // ── CONSULTAR ──
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // ── SUSCRIPCIÓN ──
  const [subEmail, setSubEmail] = useState('');
  const [subPara, setSubPara] = useState(null); // { id, nombre }
  const [subEnviando, setSubEnviando] = useState(false);
  const [subOk, setSubOk] = useState(false);

  const suscribirse = async (reporteId, nombre) => {
    if (!subEmail.trim()) return;
    setSubEnviando(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({
        reporte_id: reporteId,
        tipo_reporte: 'dano',
        telefono_whatsapp: subEmail.trim(),
        activo: true,
      });
      setSubOk(true);
      setTimeout(() => setSubOk(false), 3000);
    } catch {}
    setSubEnviando(false);
    setSubEmail('');
    setSubPara(null);
  };

  const buscarEdificio = async () => {
    if (!query.trim()) return;
    setBuscando(true); setBuscado(false);
    try {
      const q = normalizar(query);
      const enc = todos.filter(r => {
        const dir = normalizar(r.direccion || '');
        const ciudad = normalizar(r.ciudad || '');
        const nombre = normalizar(r.nombre_lugar || '');
        return similitud(q, dir) > 0.4 || similitud(q, ciudad) > 0.6 || similitud(q, nombre) > 0.5 || dir.includes(q) || ciudad.includes(q) || nombre.includes(q);
      }).sort((a, b) => ({ critico: 0, grave: 1, moderado: 2, leve: 3, no_evaluado: 4 }[a.nivel_dano] ?? 4) - ({ critico: 0, grave: 1, moderado: 2, leve: 3, no_evaluado: 4 }[b.nivel_dano] ?? 4));
      setResultados(enc);
    } catch {}
    setBuscando(false); setBuscado(true);
  };

  // ── REPORTAR ──
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
  const [fotos, setFotos] = useState([]); // [{url, uploading, error}]

  const [posiblesDups, setPosiblesDups] = useState([]);
  const [checkDup, setCheckDup] = useState(false);
  const [buscandoDup, setBuscandoDup] = useState(false);
  const [decisionDup, setDecisionDup] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(null);

  const esCritico = nivel === 'critico' || nivel === 'grave' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces';

  const buscarDuplicados = async () => {
    if (!direccion.trim() && !nombreLugar.trim()) return;
    setBuscandoDup(true);
    try {
      const queryStr = normalizar(direccion || nombreLugar);
      const dups = todos.filter(r => similitud(queryStr, normalizar(r.direccion || '')) > 0.55 || similitud(queryStr, normalizar(r.nombre_lugar || '')) > 0.55);
      setPosiblesDups(dups);
    } catch {}
    setBuscandoDup(false); setCheckDup(true);
  };

  const subirFoto = async (file) => {
    if (fotos.length >= MAX_FOTOS) return;
    const id = Date.now();
    setFotos(prev => [...prev, { id, url: null, uploading: true, error: false, preview: URL.createObjectURL(file) }]);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFotos(prev => prev.map(f => f.id === id ? { ...f, url: file_url, uploading: false } : f));
    } catch {
      setFotos(prev => prev.map(f => f.id === id ? { ...f, uploading: false, error: true } : f));
    }
  };

  const handleFotoInput = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_FOTOS - fotos.length);
    files.forEach(subirFoto);
    e.target.value = '';
  };

  const quitarFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));

  const resetForm = () => {
    setTipo(''); setNombreLugar(''); setNivel(''); setAtrapados('');
    setRiesgoGas(false); setRiesgoElec(false); setRiesgoIncendio(false);
    setDireccion(''); setCiudad(''); setEstado(''); setDescripcion(''); setContacto('');
    setFotos([]); setCheckDup(false); setDecisionDup(null); setPosiblesDups([]);
  };

  const handleSubmit = async () => {
    setEnviando(true);
    try {
      const prioridad = (nivel === 'critico' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces') ? 'critica' : nivel === 'grave' ? 'alta' : 'normal';
      const foto_urls = fotos.filter(f => f.url).map(f => f.url);
      const nuevo = await base44.entities.ReportesDano.create({
        tipo_estructura: tipo || 'otro', nombre_lugar: nombreLugar,
        nivel_dano: nivel || 'no_evaluado', personas_atrapadas: atrapados || 'no_sabe',
        riesgo_gas: riesgoGas, riesgo_electrico: riesgoElec, riesgo_incendio: riesgoIncendio,
        direccion, ciudad, estado_region: estado, descripcion,
        foto_urls, prioridad,
        estado_verificacion: 'recibido', nivel_verificacion: 'sin_verificar', fuente: 'ciudadano',
      });
      setTodos(prev => [nuevo, ...prev]);
      setExito(true);
    } catch { setExito(false); }
    setEnviando(false);
  };

  const cfg = (d) => DANO_CONFIG[d] || DANO_CONFIG.no_evaluado;

  // Filtros
  const dirFiltrados = todos.filter(r => {
    if (!filtroDir.trim()) return true;
    const q = filtroDir.toLowerCase();
    return (r.direccion || '').toLowerCase().includes(q) || (r.ciudad || '').toLowerCase().includes(q) || (r.nombre_lugar || '').toLowerCase().includes(q);
  });
  const perFiltradas = [...personas, ...encontrados].filter(p => {
    if (!filtroPer.trim()) return true;
    const q = filtroPer.toLowerCase();
    return (p.nombre_completo || p.nombre_o_descripcion || '').toLowerCase().includes(q) || (p.ciudad || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-2">
            <ChevronLeft size={15} /> {es ? 'Inicio' : 'Home'}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">🏗️ {es ? 'Edificios y Estructuras' : 'Buildings & Structures'}</h1>
          <p className="text-sm text-gray-500 mt-1">{es ? 'Directorio de edificios reportados · Consulta y reporta daños.' : 'Directory of reported buildings · Check and report damage.'}</p>
        </div>

        {/* Alerta */}
        <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 font-medium leading-relaxed">
            {es ? 'No entres a estructuras dañadas. Si hay grietas graves, gas, cables o atrapados — llama a Protección Civil (171) o Bomberos.' : 'Do not enter damaged structures. If there are cracks, gas, wires or trapped people — call Civil Protection (171) or Firefighters.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {[
            { key: 'directorio', label: { es: '📋 Directorio',       en: '📋 Directory' } },
            { key: 'consultar',  label: { es: '🔍 Buscar edificio',   en: '🔍 Search building' } },
            { key: 'reportar',   label: { es: '🚨 Reportar daño',     en: '🚨 Report damage' } },
            { key: 'solicitar',  label: { es: '📋 Solicitar info',    en: '📋 Request info' } },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {es ? t.label.es : t.label.en}
            </button>
          ))}
        </div>

        {/* ── DIRECTORIO ── */}
        {tab === 'directorio' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
              <input value={filtroDir} onChange={e => { setFiltroDir(e.target.value); setPageDir(8); }}
                placeholder={es ? 'Filtrar por nombre, dirección, ciudad...' : 'Filter by name, address, city...'}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 placeholder-gray-400" />
              <div className="flex items-center gap-2">
                <VistaToggler vista={vistaDir} setVista={setVistaDir} es={es} />
                <button onClick={() => setTab('reportar')} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap">
                  + {es ? 'Reportar daño' : 'Report damage'}
                </button>
              </div>
            </div>

            {cargandoDir ? (
              <div className="text-center py-10 text-gray-400 text-sm">{es ? 'Cargando...' : 'Loading...'}</div>
            ) : dirFiltrados.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <p>{es ? 'Sin reportes aún.' : 'No reports yet.'}</p>
                <button onClick={() => setTab('reportar')} className="text-blue-600 underline text-sm mt-2 cursor-pointer">{es ? 'Ser el primero en reportar →' : 'Be the first to report →'}</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-3">{dirFiltrados.length} {es ? 'edificio(s) reportado(s)' : 'reported building(s)'}</p>

                {/* Vista Lista */}
                {vistaDir === 'lista' && (
                  <div className="mb-4 divide-y divide-gray-100 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {dirFiltrados.slice(0, pageDir).map(r => {
                      const c = cfg(r.nivel_dano);
                      const noEntrar = ['grave', 'critico'].includes(r.nivel_dano);
                      const esCritico = noEntrar || r.prioridad === 'critica';
                      return (
                        <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-2 hover:bg-gray-50">
                          <Link to={`/edificio?id=${r.id}`} className="flex-1 min-w-0 no-underline">
                            <p className="text-sm font-semibold text-gray-900 truncate">{r.nombre_lugar || r.tipo_estructura || '—'}</p>
                            <p className="text-xs text-gray-400 truncate">📍 {r.direccion || ''}{r.direccion && r.ciudad ? ' · ' : ''}{r.ciudad || ''}{r.estado_region ? `, ${r.estado_region}` : ''}</p>
                          </Link>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {esCritico && <span className="text-[9px] font-black text-red-600">🚫</span>}
                            <span className="text-xs font-semibold" style={{ color: c.color }}>{c.icon}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Vista Tabla */}
                {vistaDir === 'tabla' && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                    <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Lugar' : 'Place'}</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Ubicación' : 'Location'}</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Daño' : 'Damage'}</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Riesgos' : 'Hazards'}</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Acceso' : 'Access'}</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">📷 {es ? 'Fotos' : 'Photos'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dirFiltrados.slice(0, pageDir).map(r => {
                        const c = cfg(r.nivel_dano);
                        const noEntrar = ['grave', 'critico'].includes(r.nivel_dano);
                        return (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <Link to={`/edificio?id=${r.id}`} className="font-semibold text-blue-900 hover:text-blue-700 text-xs no-underline hover:underline">{r.nombre_lugar || r.tipo_estructura || '—'}</Link>
                              <p className="text-[10px] text-gray-400">{r.tipo_estructura}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              <p>{r.direccion}</p>
                              <p className="text-gray-400">{r.ciudad}, {r.estado_region}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{c.icon}</span>
                              <span className="text-xs font-semibold ml-1" style={{ color: c.color }}>{es ? c.label.es : c.label.en}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {r.personas_atrapadas === 'si' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">🚨</span>}
                                {r.riesgo_gas && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">💨</span>}
                                {r.riesgo_electrico && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">⚡</span>}
                                {r.riesgo_incendio && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">🔥</span>}
                                {!r.personas_atrapadas && !r.riesgo_gas && !r.riesgo_electrico && !r.riesgo_incendio && <span className="text-[10px] text-gray-300">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {noEntrar
                                ? <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded">{es ? 'NO ENTRAR' : 'DO NOT ENTER'}</span>
                                : <span className="text-[10px] font-medium" style={{ color: c.color }}>{es ? c.acceso.es : c.acceso.en}</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <GaleriaFotos urls={r.foto_urls} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                )}

                {/* Vista Grid (cards con fotos) */}
                {vistaDir === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {dirFiltrados.slice(0, pageDir).map(r => {
                      const c = cfg(r.nivel_dano);
                      const noEntrar = ['grave', 'critico'].includes(r.nivel_dano);
                      const esCritico = noEntrar || r.prioridad === 'critica';
                      const tieneFotos = r.foto_urls?.length > 0;
                      return (
                        <Link key={r.id} to={`/edificio?id=${r.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden no-underline hover:shadow-md transition-shadow">
                          {tieneFotos ? (
                            <img src={r.foto_urls[0]} alt="" className="w-full h-36 object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                              <Image size={36} className="text-gray-300" />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{r.nombre_lugar || r.tipo_estructura}</p>
                              {esCritico && <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded flex-shrink-0">🚫</span>}
                            </div>
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><MapPin size={9} /> {r.direccion || ''} · {r.ciudad || ''}</p>
                            <div className="flex flex-wrap gap-1.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border`} style={{ color: c.color, borderColor: c.border, background: c.bg }}>
                                {c.icon} {es ? c.label.es : c.label.en}
                              </span>
                              {r.riesgo_gas && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full border border-orange-200">💨</span>}
                              {r.riesgo_electrico && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">⚡</span>}
                              {r.personas_atrapadas === 'si' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full border border-red-200">🆘</span>}
                            </div>
                            {r.foto_urls?.length > 1 && (
                              <p className="text-[10px] text-gray-400 mt-2">+{r.foto_urls.length - 1} {es ? 'fotos más' : 'more photos'}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {dirFiltrados.length > pageDir && (
                  <button onClick={() => setPageDir(v => v + 8)} className="w-full py-2.5 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
                    {es ? `Ver ${Math.min(8, dirFiltrados.length - pageDir)} más` : `Load ${Math.min(8, dirFiltrados.length - pageDir)} more`}
                  </button>
                )}
              </>
            )}

            {/* ── TABLA DE PERSONAS — siempre visible ── */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h2 className="text-base font-bold text-gray-800">👤 {es ? 'Personas buscadas y encontradas' : 'Missing & Found people'}</h2>
                    <input value={filtroPer} onChange={e => { setFiltroPer(e.target.value); setPagePer(8); }}
                      placeholder={es ? 'Filtrar por nombre, ciudad...' : 'Filter by name, city...'}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 placeholder-gray-400 w-full sm:w-64" />
                  </div>

                  {cargandoPer ? (
                    <div className="text-center py-6 text-gray-400 text-sm">{es ? 'Cargando...' : 'Loading...'}</div>
                  ) : (
                    <>
                      {/* Tabla desktop */}
                      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Nombre' : 'Name'}</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Edad' : 'Age'}</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Última ubicación' : 'Last location'}</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Estado' : 'Status'}</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{es ? 'Tipo' : 'Type'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {perFiltradas.slice(0, pagePer).map(p => {
                              const esBuscada = !!p.nombre_completo;
                              const nombre = p.nombre_completo || p.nombre_o_descripcion || '—';
                              const estado_caso = p.estado_caso || p.condicion;
                              const st = PERSONA_ESTADO[estado_caso] || { es: estado_caso || '—', en: estado_caso || '—', cls: 'bg-gray-100 text-gray-600' };
                              return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-gray-900 text-xs">{nombre}</p>
                                    {p.sexo && <p className="text-[10px] text-gray-400">{p.sexo}</p>}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-600">{p.edad_aprox || '—'}</td>
                                  <td className="px-4 py-3 text-xs text-gray-600">
                                    <p>{p.ultima_ubicacion_conocida || p.ubicacion_actual || '—'}</p>
                                    <p className="text-gray-400">{p.ciudad}{p.estado_region ? `, ${p.estado_region}` : ''}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{es ? st.es : st.en}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${esBuscada ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                      {esBuscada ? (es ? 'Buscada' : 'Missing') : (es ? 'Encontrada' : 'Found')}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Cards mobile */}
                      <div className="sm:hidden space-y-2 mb-4">
                        {perFiltradas.slice(0, pagePer).map(p => {
                          const esBuscada = !!p.nombre_completo;
                          const nombre = p.nombre_completo || p.nombre_o_descripcion || '—';
                          const estado_caso = p.estado_caso || p.condicion;
                          const st = PERSONA_ESTADO[estado_caso] || { es: estado_caso || '—', en: estado_caso || '—', cls: 'bg-gray-100 text-gray-600' };
                          return (
                            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                                <p className="text-xs text-gray-400 truncate">📍 {p.ultima_ubicacion_conocida || p.ubicacion_actual || '—'} · {p.ciudad}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{es ? st.es : st.en}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${esBuscada ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                  {esBuscada ? (es ? 'Buscada' : 'Missing') : (es ? 'Encontrada' : 'Found')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {perFiltradas.length > pagePer && (
                        <button onClick={() => setPagePer(v => v + 8)} className="w-full py-2.5 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
                          {es ? `Ver ${Math.min(8, perFiltradas.length - pagePer)} más` : `Load ${Math.min(8, perFiltradas.length - pagePer)} more`}
                        </button>
                      )}

                      <div className="flex gap-3 mt-3 flex-wrap">
                        <Link to="/buscar-persona" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold no-underline hover:bg-amber-100">
                          + {es ? 'Reportar persona buscada' : 'Report missing person'}
                        </Link>
                        <Link to="/reportar-encontrado" className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg font-semibold no-underline hover:bg-green-100">
                          + {es ? 'Reportar persona encontrada' : 'Report found person'}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
          </div>
        )}

        {/* ── CONSULTAR ── */}
        {tab === 'consultar' && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">{es ? '¿Es seguro este edificio?' : 'Is this building safe?'}</h2>
              <p className="text-sm text-gray-500 mb-4">{es ? 'Escribe la dirección, nombre o zona para ver si hay reportes.' : 'Type the address, name or area to see if there are reports.'}</p>
              <div className="flex gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscarEdificio()}
                  placeholder={es ? 'Ej: Edif. Las Torres, Av. Principal, La Guaira...' : 'E.g: Las Torres building, Main Ave, La Guaira...'}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500" />
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
                <p className="font-semibold text-green-800 text-sm">{es ? 'Sin reportes de daño para esta búsqueda.' : 'No damage reports found for this search.'}</p>
                <p className="text-xs text-green-600 mt-1">{es ? 'Esto no garantiza que sea 100% seguro. Si ves daños, repórtalos.' : 'This does not guarantee 100% safety. If you see damage, report it.'}</p>
                <button onClick={() => setTab('reportar')} className="mt-3 text-sm text-blue-700 underline cursor-pointer">{es ? 'Reportar daño →' : 'Report damage →'}</button>
              </div>
            )}
            {resultados.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{resultados.length} {es ? 'reporte(s)' : 'report(s)'}</p>
                {resultados.map(r => {
                  const c = cfg(r.nivel_dano);
                  const noEntrar = ['grave', 'critico'].includes(r.nivel_dano);
                  return (
                    <div key={r.id} style={{ background: c.bg, borderColor: c.border }} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{c.icon}</span>
                            <span className="font-bold text-sm" style={{ color: c.color }}>{es ? c.label.es : c.label.en}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{r.nombre_lugar || r.tipo_estructura}</p>
                          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><MapPin size={10} />{r.direccion} · {r.ciudad}, {r.estado_region}</p>
                        </div>
                        {noEntrar && <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0 text-center">{es ? 'NO\nENTRAR' : 'DO NOT\nENTER'}</div>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {r.personas_atrapadas === 'si' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🚨 {es ? 'Atrapados' : 'Trapped'}</span>}
                        {r.riesgo_gas && <span className="text-xs bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">💨 Gas</span>}
                        {r.riesgo_electrico && <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">⚡</span>}
                        {r.riesgo_incendio && <span className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">🔥</span>}
                      </div>
                      {r.foto_urls?.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {r.foto_urls.slice(0, 3).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                          ))}
                          {r.foto_urls.length > 3 && <span className="text-xs text-gray-400 self-center">+{r.foto_urls.length - 3}</span>}
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: c.border }}>
                        <p className="text-xs font-medium" style={{ color: c.color }}>🚪 {es ? c.acceso.es : c.acceso.en}</p>
                        {r.descripcion && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.descripcion}</p>}
                      </div>

                      {/* Suscripción */}
                      {subPara?.id === r.id && subEmail && (
                        <div className="mt-3 flex gap-2">
                          <input value={subEmail} onChange={e => setSubEmail(e.target.value)}
                            placeholder={es ? 'Tu email...' : 'Your email...'}
                            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:border-blue-400 placeholder-gray-400" />
                          <button onClick={() => suscribirse(r.id, r.nombre_lugar)} disabled={subEnviando}
                            className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-40 cursor-pointer">
                            {es ? 'Suscribir' : 'Subscribe'}
                          </button>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between items-center">
                        {subOk && subPara?.id === r.id && (
                          <span className="text-xs text-green-600 font-medium">✅ {es ? 'Suscrito. Te avisamos si cambia.' : 'Subscribed.'}</span>
                        )}
                        {(!subPara || subPara.id !== r.id) && (
                          <button onClick={() => setSubPara({ id: r.id, nombre: r.nombre_lugar })}
                            className="text-[11px] text-blue-600 underline cursor-pointer">
                            🔔 {es ? 'Avísame si cambia el estado' : 'Notify me of changes'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SOLICITAR ── */}
        {tab === 'solicitar' && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">{es ? '¿No encuentras un edificio en el directorio? Solicita que lo incluyamos con toda la información disponible.' : "Can't find a building in the directory? Request it and we'll add all available information."}</p>
            <Link to="/solicitar-info-edificio"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 rounded-xl text-sm no-underline transition-colors">
              📋 {es ? 'Solicitar información de un edificio' : 'Request building information'}
            </Link>
          </div>
        )}

        {/* ── REPORTAR ── */}
        {tab === 'reportar' && (
          <div className="max-w-2xl">
            {exito === true && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-4">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold text-green-800 text-lg mb-1">{es ? 'Reporte enviado.' : 'Report submitted.'}</h3>
                <p className="text-sm text-green-700 mb-3">{es ? 'Gracias. Tu reporte ayuda a que otras personas eviten el peligro.' : 'Thank you. Your report helps others avoid danger.'}</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { resetForm(); setExito(null); }} className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    {es ? 'Reportar otro' : 'Report another'}
                  </button>
                  <button onClick={() => setTab('directorio')} className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">
                    {es ? 'Ver directorio' : 'View directory'}
                  </button>
                </div>
              </div>
            )}

            {exito !== true && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{es ? 'Completa este formulario con lo que ves desde un lugar seguro. No entres a estructuras dañadas.' : 'Fill this form with what you see from a safe location. Do not enter damaged structures.'}</p>

                {/* 1. Tipo */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">1. {es ? '¿Qué tipo de estructura es?' : 'What type of structure?'} <span className="text-red-500">*</span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIPO_OPTS.map(t => (
                      <button key={t.val} onClick={() => setTipo(t.val)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-left cursor-pointer transition-colors ${tipo === t.val ? 'bg-blue-700 text-white border-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                        {es ? t.es : t.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Ubicación */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-800">2. {es ? '¿Dónde está?' : 'Where is it?'} <span className="text-red-500">*</span></h3>
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

                {/* Duplicados */}
                {checkDup && posiblesDups.length > 0 && decisionDup === null && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                    <div className="flex gap-2 items-start">
                      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">{es ? '¡Ya existe un reporte similar!' : 'A similar report already exists!'}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{es ? '¿Es el mismo lugar?' : 'Is it the same place?'}</p>
                      </div>
                    </div>
                    {posiblesDups.slice(0, 2).map(d => {
                      const c = cfg(d.nivel_dano);
                      return (
                        <div key={d.id} className="bg-white border border-amber-200 rounded-lg p-3 flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-gray-800">{d.nombre_lugar || d.tipo_estructura}</p>
                            <p className="text-xs text-gray-500">{d.direccion} · {d.ciudad}</p>
                            <span className="text-xs font-semibold" style={{ color: c.color }}>{c.icon} {es ? c.label.es : c.label.en}</span>
                          </div>
                          <button onClick={() => setDecisionDup('actualizar')} className="text-xs bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg font-semibold cursor-pointer">{es ? 'Es este ↗' : 'This one ↗'}</button>
                        </div>
                      );
                    })}
                    <button onClick={() => setDecisionDup('nuevo')} className="w-full text-sm text-gray-600 border border-gray-200 bg-white py-2.5 rounded-lg cursor-pointer hover:bg-gray-50">
                      {es ? 'No, es diferente — crear nuevo' : 'No, different place — create new'}
                    </button>
                  </div>
                )}
                {decisionDup === 'actualizar' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
                    <p className="text-sm font-semibold text-blue-800">{es ? 'Para actualizar, usa el Directorio.' : 'To update, use the Directory.'}</p>
                    <button onClick={() => setTab('directorio')} className="text-sm bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer">{es ? 'Ir al Directorio →' : 'Go to Directory →'}</button>
                    <button onClick={() => setDecisionDup('nuevo')} className="block w-full text-xs text-gray-400 mt-1 cursor-pointer">{es ? 'Crear nuevo de todas formas' : 'Create new anyway'}</button>
                  </div>
                )}

                {(decisionDup === 'nuevo' || posiblesDups.length === 0 || !checkDup) && (
                  <>
                    {/* 3. Nivel daño */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">3. {es ? 'Nivel de daño visible' : 'Visible damage level'} <span className="text-red-500">*</span></h3>
                      <div className="space-y-2">
                        {NIVEL_OPTS.map(n => (
                          <button key={n.val} onClick={() => setNivel(n.val)}
                            className={`w-full py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${nivel === n.val
                              ? n.val === 'critico' ? 'bg-red-700 text-white border-red-700'
                              : n.val === 'grave' ? 'bg-red-500 text-white border-red-500'
                              : n.val === 'moderado' ? 'bg-orange-500 text-white border-orange-500'
                              : n.val === 'leve' ? 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-gray-600 text-white border-gray-600'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                            {es ? n.es : n.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Atrapados */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">4. {es ? '¿Hay personas atrapadas?' : 'Are there trapped people?'} <span className="text-red-500">*</span></h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ATRAPADOS_OPTS.map(a => (
                          <button key={a.val} onClick={() => setAtrapados(a.val)}
                            className={`py-3 px-4 rounded-lg text-sm text-left border cursor-pointer transition-colors ${atrapados === a.val
                              ? (a.val === 'si' || a.val === 'voces') ? 'bg-red-600 text-white border-red-600' : 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                            {es ? a.es : a.en}
                          </button>
                        ))}
                      </div>
                      {(atrapados === 'si' || atrapados === 'voces') && (
                        <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-3">
                          <p className="text-sm font-bold text-red-700">🚨 {es ? 'Llama AHORA a Protección Civil (171) o Bomberos.' : 'Call NOW Civil Protection (171) or Firefighters.'}</p>
                        </div>
                      )}
                    </div>

                    {/* 5. Riesgos */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">5. {es ? 'Riesgos adicionales' : 'Additional hazards'}</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: riesgoGas, set: setRiesgoGas,         label: { es: '💨 Olor a gas',                  en: '💨 Gas smell' } },
                          { val: riesgoElec, set: setRiesgoElec,        label: { es: '⚡ Cables caídos / eléctrico',    en: '⚡ Fallen wires / electrical' } },
                          { val: riesgoIncendio, set: setRiesgoIncendio, label: { es: '🔥 Riesgo de incendio',          en: '🔥 Fire hazard' } },
                        ].map((r, i) => (
                          <button key={i} onClick={() => r.set(v => !v)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${r.val ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'}`}>
                            {es ? r.label.es : r.label.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 6. Fotos */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">6. {es ? 'Fotos del daño (máx. 5, opcional)' : 'Photos of damage (max 5, optional)'}</h3>
                      <p className="text-xs text-gray-400 mb-3">{es ? 'Solo desde un lugar seguro. No entres al edificio para tomar fotos.' : 'Only from a safe location. Do not enter the building to take photos.'}</p>

                      {fotos.length < MAX_FOTOS && (
                        <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors mb-3">
                          <Camera size={20} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{es ? 'Agregar fotos' : 'Add photos'}</p>
                            <p className="text-xs text-gray-400">{es ? `${MAX_FOTOS - fotos.length} espacio(s) restante(s)` : `${MAX_FOTOS - fotos.length} slot(s) remaining`}</p>
                          </div>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFotoInput} />
                        </label>
                      )}

                      {fotos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {fotos.map(f => (
                            <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              {f.preview && <img src={f.preview} alt="" className="w-full h-full object-cover" />}
                              {f.uploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <Loader2 size={16} className="animate-spin text-white" />
                                </div>
                              )}
                              {f.error && (
                                <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">!</span>
                                </div>
                              )}
                              {!f.uploading && (
                                <button onClick={() => quitarFoto(f.id)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer hover:bg-red-700">
                                  <X size={10} />
                                </button>
                              )}
                              {f.url && !f.uploading && (
                                <div className="absolute bottom-1 left-1 w-3 h-3 rounded-full bg-green-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 7. Descripción */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800">7. {es ? 'Descripción y tus datos' : 'Description and your info'}</h3>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{es ? 'Describe lo que ves (opcional)' : 'Describe what you see (optional)'}</label>
                        <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={200}
                          placeholder={es ? 'Ej: Fachada colapsada, cables caídos, se escuchan voces...' : 'E.g: Facade collapsed, wires on street, voices heard...'}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 resize-none placeholder-gray-400" />
                        <p className="text-right text-xs text-gray-400">{descripcion.length}/200</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">🔒 {es ? 'Tu contacto (privado, no se publica)' : 'Your contact (private, not published)'}</label>
                        <input value={contacto} onChange={e => setContacto(e.target.value)}
                          placeholder={es ? 'Teléfono, WhatsApp o email...' : 'Phone, WhatsApp or email...'}
                          className={inputCls} />
                      </div>
                    </div>

                    {esCritico && (
                      <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex gap-3">
                        <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-700">{es ? '⚠️ Este reporte será marcado como CRÍTICO. Llama primero a Protección Civil (171) o Bomberos.' : '⚠️ This report will be marked CRITICAL. Call Civil Protection (171) or Firefighters first.'}</p>
                      </div>
                    )}

                    <button onClick={handleSubmit}
                      disabled={enviando || !tipo || !nivel || !atrapados || !direccion || !ciudad || !estado || fotos.some(f => f.uploading)}
                      className={`w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-colors ${esCritico ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}>
                      {enviando ? <Loader2 size={18} className="animate-spin" /> : (esCritico ? '🚨' : '📋')}
                      {fotos.some(f => f.uploading) ? (es ? 'Subiendo fotos...' : 'Uploading photos...')
                        : esCritico ? (es ? 'Enviar alerta crítica' : 'Send critical alert')
                        : (es ? 'Enviar reporte de daño' : 'Submit damage report')}
                    </button>
                    {(!tipo || !nivel || !atrapados || !direccion || !ciudad || !estado) && (
                      <p className="text-center text-xs text-gray-400">{es ? 'Completa los campos obligatorios (*) para enviar.' : 'Fill in required fields (*) to submit.'}</p>
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