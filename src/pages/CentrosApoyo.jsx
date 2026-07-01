import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Phone, MapPin, Clock, Users, ChevronDown, ChevronUp, Search, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const PAGE_SIZE = 12;

const TIPO_CONFIG = {
  hospital:         { emoji: '🏥', es: 'Hospital',          en: 'Hospital',         pt: 'Hospital',         color: 'bg-blue-100 text-blue-800' },
  clinica:          { emoji: '🏨', es: 'Clínica privada',   en: 'Private clinic',   pt: 'Clínica privada',  color: 'bg-indigo-100 text-indigo-700' },
  refugio:          { emoji: '🏕️', es: 'Refugio',           en: 'Shelter',          pt: 'Abrigo',           color: 'bg-teal-100 text-teal-800' },
  centro_acopio:    { emoji: '📦', es: 'Centro de acopio',  en: 'Supply center',    pt: 'Centro de acopio', color: 'bg-amber-100 text-amber-800' },
  bomberos:         { emoji: '🚒', es: 'Bomberos',          en: 'Firefighters',     pt: 'Bombeiros',        color: 'bg-red-100 text-red-700' },
  proteccion_civil: { emoji: '🛡️', es: 'Protección Civil',  en: 'Civil Protection', pt: 'Proteção Civil',   color: 'bg-orange-100 text-orange-700' },
  iglesia:          { emoji: '⛪', es: 'Iglesia / Templo',  en: 'Church / Temple',  pt: 'Igreja / Templo',  color: 'bg-purple-100 text-purple-700' },
  ong:              { emoji: '🤝', es: 'ONG / Humanitaria', en: 'NGO / Humanitarian',pt: 'ONG / Humanitária',color: 'bg-green-100 text-green-800' },
  comedor:          { emoji: '🍲', es: 'Comedor',           en: 'Food center',      pt: 'Refeitório',       color: 'bg-yellow-100 text-yellow-800' },
};

const ESTADO_CONFIG = {
  abierto:              { es: '✅ Abierto',               en: '✅ Open',            pt: '✅ Aberto',              color: 'bg-green-100 text-green-800',  urgencia: false },
  saturado:             { es: '⚠️ Saturado',              en: '⚠️ Saturated',      pt: '⚠️ Saturado',            color: 'bg-orange-100 text-orange-700',urgencia: true },
  cerrado:              { es: '🔒 Cerrado',               en: '🔒 Closed',          pt: '🔒 Fechado',             color: 'bg-gray-200 text-gray-700',    urgencia: false },
  recibe_personas:      { es: '🙋 Recibe personas',       en: '🙋 Accepting people',pt: '🙋 Aceita pessoas',      color: 'bg-teal-100 text-teal-800',    urgencia: false },
  recibe_heridos:       { es: '🚑 Recibe heridos',        en: '🚑 Accepting injured',pt: '🚑 Aceita feridos',     color: 'bg-blue-100 text-blue-800',    urgencia: false },
  necesita_suministros: { es: '📦 Necesita suministros',  en: '📦 Needs supplies',  pt: '📦 Precisa de suprimentos',color: 'bg-amber-100 text-amber-700', urgencia: true },
  necesita_voluntarios: { es: '🙋 Necesita voluntarios',  en: '🙋 Needs volunteers',pt: '🙋 Precisa voluntários', color: 'bg-purple-100 text-purple-700',urgencia: true },
  no_verificado:        { es: '❓ No verificado',         en: '❓ Not verified',    pt: '❓ Não verificado',      color: 'bg-gray-100 text-gray-500',    urgencia: false },
};

const FILTROS = [
  { val: 'todo',       es: '🔍 Todo',       en: '🔍 All',        pt: '🔍 Todos' },
  { val: 'emergencia', es: '🚨 Emergencia', en: '🚨 Emergency',  pt: '🚨 Emergência' },
  { val: 'hospital',   es: '🏥 Hospitales', en: '🏥 Hospitals',  pt: '🏥 Hospitais' },
  { val: 'refugio',    es: '🏕️ Refugios',   en: '🏕️ Shelters',  pt: '🏕️ Abrigos' },
  { val: 'acopio',     es: '📦 Acopio',     en: '📦 Supply',     pt: '📦 Acopio' },
  { val: 'ong',        es: '🤝 ONGs',       en: '🤝 NGOs',       pt: '🤝 ONGs' },
];

const TIPO_A_FILTRO = {
  bomberos: 'emergencia', proteccion_civil: 'emergencia',
  hospital: 'hospital', clinica: 'hospital',
  refugio: 'refugio', escuela: 'refugio',
  centro_acopio: 'acopio', iglesia: 'acopio', comedor: 'acopio',
  ong: 'ong',
};

// Form para actualizar estado de un centro
function ModalActualizarCentro({ centro, t, onClose, onSaved }) {
  const [estado, setEstado] = useState(centro.estado_operativo || 'no_verificado');
  const [nota, setNota] = useState('');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await base44.entities.PuntosAyuda.update(centro.id, { estado_operativo: estado, ultima_actualizacion: new Date().toISOString() });
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: centro.id, tipo_sitio: 'refugio',
        tipo_accion: 'estado_cambiado',
        descripcion: nota || t('Actualización de estado', 'Status update', 'Atualização de status'),
        reportante_nombre: nombre, fuente: 'ciudadano',
      }).catch(() => {});
      onSaved({ ...centro, estado_operativo: estado });
      setOk(true);
      setTimeout(onClose, 2000);
    } catch {}
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}>
        {ok ? (
          <div className="text-center py-4 space-y-2">
            <CheckCircle size={32} className="text-green-600 mx-auto" />
            <p className="font-black text-green-800">{t('¡Actualizado!', 'Updated!', 'Atualizado!')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900">{t('Actualizar estado del centro', 'Update center status', 'Atualizar status do centro')}</h2>
              <button onClick={onClose} className="text-gray-400 text-lg cursor-pointer">✕</button>
            </div>
            <p className="text-xs font-bold text-gray-600 truncate">📍 {centro.nombre_lugar}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                <button key={k} onClick={() => setEstado(k)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer text-left transition-colors ${estado === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  {t(v.es, v.en, v.pt)}
                </button>
              ))}
            </div>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white" />
            <textarea rows={2} value={nota} onChange={e => setNota(e.target.value)}
              placeholder={t('Notas adicionales (opcional)', 'Additional notes (optional)', 'Notas adicionais (opcional)')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none bg-white" />
            <button onClick={guardar} disabled={guardando}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
              {guardando ? <Loader2 size={14} className="animate-spin" /> : '💾'}
              {t('Guardar actualización', 'Save update', 'Salvar atualização')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CentrosApoyo() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  const [centros, setCentros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todo');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandidos, setExpandidos] = useState({});
  const [personasPorCentro, setPersonasPorCentro] = useState({});
  const [cargandoPersonas, setCargandoPersonas] = useState({});
  const [busquedasPersonas, setBusquedasPersonas] = useState({});
  const [centroActualizar, setCentroActualizar] = useState(null);

  useEffect(() => {
    base44.entities.PuntosAyuda.list('-updated_date', 200)
      .then(d => setCentros(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const togglePersonas = async (centroId, nombreCentro) => {
    const yaExpandido = expandidos[centroId];
    setExpandidos(prev => ({ ...prev, [centroId]: !yaExpandido }));
    if (!yaExpandido && !personasPorCentro[centroId]) {
      setCargandoPersonas(prev => ({ ...prev, [centroId]: true }));
      try {
        const [porCentro, porNombre, encontradas] = await Promise.all([
          base44.entities.PersonaRegistrada.filter({ institucion_id: centroId }, '-created_date', 100),
          base44.entities.PersonaRegistrada.filter({ institucion_nombre: nombreCentro }, '-created_date', 100),
          base44.entities.PersonasEncontradas.filter({ nombre_lugar: nombreCentro }, '-created_date', 100),
        ]);
        const map = {};
        [...porCentro, ...porNombre].forEach(p => { map[`reg-${p.id}`] = p; });
        encontradas.forEach(p => { map[`enc-${p.id}`] = { ...p, id: `enc-${p.id}`, nombre_completo: p.nombre_o_descripcion }; });
        setPersonasPorCentro(prev => ({ ...prev, [centroId]: Object.values(map) }));
      } catch { setPersonasPorCentro(prev => ({ ...prev, [centroId]: [] })); }
      setCargandoPersonas(prev => ({ ...prev, [centroId]: false }));
    }
  };

  const filtrados = centros.filter(c => {
    const matchFiltro = filtro === 'todo' || TIPO_A_FILTRO[c.tipo_lugar] === filtro;
    const q = query.toLowerCase();
    const matchQuery = !q || (c.nombre_lugar || '').toLowerCase().includes(q) || (c.ciudad || '').toLowerCase().includes(q);
    return matchFiltro && matchQuery;
  });

  const visibles = filtrados.slice(0, page * PAGE_SIZE);

  // Urgentes primero
  const urgentes = filtrados.filter(c => ESTADO_CONFIG[c.estado_operativo]?.urgencia).length;

  const buscarPersonasCentro = (centroId) => {
    const lista = personasPorCentro[centroId] || [];
    const q = (busquedasPersonas[centroId] || '').toLowerCase().trim();
    if (!q) return lista;
    return lista.filter(p => (p.nombre_completo || '').toLowerCase().includes(q) || (p.condicion || '').toLowerCase().includes(q));
  };

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-900">
          <ChevronLeft size={16} /> {t('Inicio', 'Home', 'Início')}
        </Link>

        {/* ── ENCABEZADO ── */}
        <h1 className="text-xl font-black text-[#1A1F2E] mb-1">
          🏥 {t('Centros de apoyo', 'Help centers', 'Centros de apoio')}
        </h1>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          {t(
            'Hospitales, refugios, acopios, comedores y ONGs. Verifica el estado antes de trasladarte.',
            'Hospitals, shelters, supply centers, food centers and NGOs. Verify status before traveling.',
            'Hospitais, abrigos, centros de acopio, restaurantes comunitários e ONGs.'
          )}
        </p>

        {/* ── ALERTA URGENCIA ── */}
        <div className="flex gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>{t('Antes de ir:', 'Before going:', 'Antes de ir:')}</strong>{' '}
            {t(
              'Llama primero para confirmar que están abiertos y con capacidad. Los estados cambian rápido.',
              'Call first to confirm they are open and have capacity. Statuses change quickly.',
              'Ligue primeiro para confirmar que estão abertos. Os status mudam rapidamente.'
            )}
          </p>
        </div>

        {/* ── ESTADÍSTICAS ── */}
        {!cargando && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { n: centros.filter(c => ['bomberos','proteccion_civil'].includes(c.tipo_lugar)).length, es: '24/7',       en: '24/7',       pt: '24/7',       color: 'bg-red-50 border-red-200 text-red-700' },
              { n: centros.filter(c => ['hospital','clinica'].includes(c.tipo_lugar)).length,          es: 'Hospitales', en: 'Hospitals',  pt: 'Hospitais',  color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { n: centros.filter(c => ['refugio'].includes(c.tipo_lugar)).length,                     es: 'Refugios',   en: 'Shelters',   pt: 'Abrigos',    color: 'bg-teal-50 border-teal-200 text-teal-700' },
              { n: urgentes,                                                                            es: 'Urgentes',   en: 'Urgent',     pt: 'Urgentes',   color: 'bg-orange-50 border-orange-200 text-orange-700' },
            ].map((s, i) => (
              <div key={i} className={`rounded-xl border px-2 py-2 text-center ${s.color}`}>
                <p className="text-xl font-black">{s.n}</p>
                <p className="text-[9px] font-bold uppercase">{t(s.es, s.en, s.pt)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── BÚSQUEDA ── */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={t('Buscar por nombre, ciudad...', 'Search by name, city...', 'Buscar por nome, cidade...')}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400" />
          </div>
          {query && <button onClick={() => setQuery('')} className="text-sm text-gray-400 px-2 cursor-pointer">✕</button>}
        </div>

        {/* ── FILTROS ── */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {FILTROS.map(f => (
            <button key={f.val} onClick={() => { setFiltro(f.val); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${filtro === f.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {t(f.es, f.en, f.pt)}
            </button>
          ))}
        </div>

        {cargando && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            {t('Cargando centros...', 'Loading centers...', 'Carregando centros...')}
          </div>
        )}

        {!cargando && filtrados.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <p className="text-3xl">🏕️</p>
            <p className="text-sm font-semibold text-gray-500">{t('No hay resultados.', 'No results.', 'Sem resultados.')}</p>
            <p className="text-xs text-gray-400">{t('¿Conoces un centro que falta? Agrégalo.', 'Know a missing center? Add it.', 'Conhece um centro que falta? Adicione.')}</p>
            <Link to="/institucional" className="inline-block bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl no-underline">
              + {t('Agregar centro', 'Add center', 'Adicionar centro')}
            </Link>
          </div>
        )}

        {/* ── LISTA ── */}
        <div className="flex flex-col gap-3">
          {visibles.map(c => {
            const tipoConf = TIPO_CONFIG[c.tipo_lugar] || { emoji: '📍', es: c.tipo_lugar, en: c.tipo_lugar, pt: c.tipo_lugar, color: 'bg-gray-100 text-gray-600' };
            const estadoConf = ESTADO_CONFIG[c.estado_operativo] || ESTADO_CONFIG.no_verificado;
            const esUrgente = estadoConf.urgencia;
            const personasLista = buscarPersonasCentro(c.id);

            return (
              <div key={c.id}
                className={`bg-white rounded-2xl border ${esUrgente ? 'border-orange-200' : 'border-gray-200'} overflow-hidden`}>

                {/* Alerta urgencia */}
                {esUrgente && (
                  <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
                    <AlertTriangle size={12} className="text-orange-600 flex-shrink-0" />
                    <p className="text-[11px] font-bold text-orange-800">
                      {t(estadoConf.es, estadoConf.en, estadoConf.pt)} — {t('Verificar antes de ir', 'Verify before going', 'Verificar antes de ir')}
                    </p>
                  </div>
                )}

                <div className="px-4 py-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0 leading-none mt-0.5">{tipoConf.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-[#1A1F2E] leading-tight">{c.nombre_lugar}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${tipoConf.color}`}>
                          {t(tipoConf.es, tipoConf.en, tipoConf.pt)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${estadoConf.color}`}>
                      {t(estadoConf.es, estadoConf.en, estadoConf.pt)}
                    </span>
                  </div>

                  {/* Ubicación */}
                  <p className="text-xs text-gray-500 flex items-start gap-1 mb-1">
                    <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                    {[c.direccion, c.ciudad, c.estado_region].filter(Boolean).join(' · ') || '—'}
                  </p>

                  {/* Horario */}
                  {c.nota_horario && !lowBw && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                      <Clock size={10} /> {c.nota_horario}
                    </p>
                  )}

                  {/* Capacidad */}
                  {c.personas_actuales > 0 && (
                    <p className="text-xs text-blue-700 font-semibold mb-2">
                      👥 {c.personas_actuales}{c.capacidad_maxima ? `/${c.capacidad_maxima}` : ''} {t('personas', 'people', 'pessoas')}
                      {c.espacio_disponible ? ` · ${c.espacio_disponible}` : ''}
                    </p>
                  )}

                  {/* Servicios */}
                  {!lowBw && c.servicios_disponibles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {c.servicios_disponibles.slice(0, 5).map(s => (
                        <span key={s} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                      {c.servicios_disponibles.length > 5 && <span className="text-[10px] text-gray-400">+{c.servicios_disponibles.length - 5}</span>}
                    </div>
                  )}

                  {/* Necesidades urgentes */}
                  {c.necesidades_urgentes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="text-[10px] text-red-600 font-bold self-center">{t('Necesita:', 'Needs:', 'Precisa:')}</span>
                      {c.necesidades_urgentes.slice(0, 4).map(n => (
                        <span key={n} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full font-semibold">🆘 {n}</span>
                      ))}
                    </div>
                  )}

                  {/* Contactos */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {c.telefono_publico && (
                      <a href={`tel:${c.telefono_publico.split('/')[0].trim()}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 no-underline">
                        <Phone size={11} /> {c.telefono_publico.split('/')[0].trim()}
                      </a>
                    )}
                    {c.whatsapp && (
                      <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg hover:bg-green-100 no-underline">
                        💬 WhatsApp
                      </a>
                    )}
                    {c.sitio_web && !lowBw && (
                      <a href={c.sitio_web} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg hover:bg-blue-100 no-underline">
                        🌐 {t('Sitio web', 'Website', 'Site')}
                      </a>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => togglePersonas(c.id, c.nombre_lugar)}
                      className="flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 py-2 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <Users size={11} />
                      {t('Ver personas', 'View people', 'Ver pessoas')}
                      {c.personas_actuales > 0 && (
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{c.personas_actuales}</span>
                      )}
                      {expandidos[c.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    <button onClick={() => setCentroActualizar(c)}
                      className="flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 py-2 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                      ✏️ {t('Actualizar estado', 'Update status', 'Atualizar status')}
                    </button>
                  </div>
                </div>

                {/* Panel personas expandido */}
                {expandidos[c.id] && (
                  <div className="border-t border-gray-100">
                    {cargandoPersonas[c.id] ? (
                      <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> {t('Cargando...', 'Loading...', 'Carregando...')}
                      </div>
                    ) : !personasPorCentro[c.id]?.length ? (
                      <div className="text-center py-4 text-xs text-gray-400 space-y-2">
                        <p>{t('Sin personas registradas aún.', 'No people registered yet.', 'Sem pessoas registradas ainda.')}</p>
                        <Link to="/registro-institucional" className="text-blue-600 underline">{t('+ Registrar listado', '+ Register list', '+ Registrar lista')}</Link>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-gray-600">
                            👤 {personasPorCentro[c.id].length} {t('personas registradas', 'registered people', 'pessoas registradas')}
                          </p>
                          <span className="text-[9px] text-gray-400">🔒 {t('Datos privados', 'Private data', 'Dados privados')}</span>
                        </div>
                        <div className="relative">
                          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input value={busquedasPersonas[c.id] || ''}
                            onChange={e => setBusquedasPersonas(prev => ({ ...prev, [c.id]: e.target.value }))}
                            placeholder={t('Buscar en este centro...', 'Search this center...', 'Buscar neste centro...')}
                            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-900 bg-white focus:outline-none" />
                        </div>
                        <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-xl">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                              <tr>
                                <th className="text-left px-3 py-2 text-gray-400 font-semibold">{t('Nombre', 'Name', 'Nome')}</th>
                                <th className="text-left px-3 py-2 text-gray-400 font-semibold">{t('Condición', 'Condition', 'Condição')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {personasLista.slice(0, 50).map(p => {
                                const COND_CLS = { a_salvo: 'bg-green-100 text-green-700', herido_leve: 'bg-yellow-100 text-yellow-700', herido_grave: 'bg-orange-100 text-orange-700', fallecido_reportado: 'bg-gray-200 text-gray-600', no_sabe: 'bg-gray-100 text-gray-500' };
                                const COND_LABEL = { a_salvo: { es: 'A salvo', en: 'Safe', pt: 'A salvo' }, herido_leve: { es: 'Herido leve', en: 'Minor injury', pt: 'Ferido leve' }, herido_grave: { es: 'Herido grave', en: 'Serious injury', pt: 'Ferido grave' }, fallecido_reportado: { es: 'Fallecido', en: 'Death rep.', pt: 'Falecido' }, no_sabe: { es: 'No se sabe', en: 'Unknown', pt: 'Desconhecido' } };
                                const cKey = p.condicion || 'no_sabe';
                                return (
                                  <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-800 truncate max-w-[140px]">{p.nombre_completo}</td>
                                    <td className="px-3 py-2">
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${COND_CLS[cKey] || COND_CLS.no_sabe}`}>
                                        {t(COND_LABEL[cKey]?.es || cKey, COND_LABEL[cKey]?.en || cKey, COND_LABEL[cKey]?.pt || cKey)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {personasLista.length > 50 && (
                                <tr><td colSpan={2} className="text-center py-2 text-[10px] text-gray-400">+{personasLista.length - 50} {t('más', 'more', 'mais')}</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtrados.length > visibles.length && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-2xl bg-white hover:bg-gray-50 cursor-pointer">
            {t(`Ver más (${filtrados.length - visibles.length} restantes)`, `Show more (${filtrados.length - visibles.length} remaining)`, `Ver mais (${filtrados.length - visibles.length} restantes)`)}
          </button>
        )}

        {/* ── CTA agregar ── */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-4 text-center">
          <p className="text-sm font-bold text-blue-900 mb-1">
            {t('¿Conoces un centro que no aparece?', "Know a center that's not listed?", 'Conhece um centro que não aparece?')}
          </p>
          <p className="text-xs text-blue-600 mb-3">
            {t('Agrégalo para que otros puedan encontrarlo en emergencia.', 'Add it so others can find it in an emergency.', 'Adicione para que outros possam encontrá-lo.')}
          </p>
          <Link to="/institucional" className="inline-block bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl no-underline">
            + {t('Registrar centro', 'Register center', 'Registrar centro')}
          </Link>
        </div>
      </div>

      {/* Modal actualizar */}
      {centroActualizar && (
        <ModalActualizarCentro
          centro={centroActualizar} t={t}
          onClose={() => setCentroActualizar(null)}
          onSaved={(actualizado) => {
            setCentros(prev => prev.map(c => c.id === actualizado.id ? actualizado : c));
            setCentroActualizar(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}