import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Edit3, Save, X, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const CONDICION_LABELS = {
  a_salvo: { es: 'A salvo ✅', en: 'Safe ✅', color: 'bg-green-100 text-green-800' },
  herido_leve: { es: 'Herido leve', en: 'Minor injury', color: 'bg-yellow-100 text-yellow-800' },
  herido_grave: { es: 'Herido grave', en: 'Serious injury', color: 'bg-orange-100 text-orange-800' },
  fallecido_reportado: { es: 'Fallecido (rep.)', en: 'Death reported', color: 'bg-gray-200 text-gray-700' },
  no_identificado: { es: 'No identificado', en: 'Unidentified', color: 'bg-purple-100 text-purple-700' },
  no_sabe: { es: 'No se sabe', en: 'Unknown', color: 'bg-gray-100 text-gray-500' },
};

const CONDICIONES = ['a_salvo', 'herido_leve', 'herido_grave', 'fallecido_reportado', 'no_identificado', 'no_sabe'];

const ESTADO_LABEL = {
  buscando: { es: '🔴 Sin contacto', en: '🔴 Missing', color: 'bg-red-100 text-red-700' },
  informacion_recibida: { es: '🔵 Con pistas', en: '🔵 Has leads', color: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado: { es: '🟠 Visto sin confirmar', en: '🟠 Seen unconfirmed', color: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida: { es: '✅ Localizado', en: '✅ Located', color: 'bg-green-100 text-green-800' },
  en_hospital_refugio: { es: '🏥 Hospital/refugio', en: '🏥 Hospital/shelter', color: 'bg-teal-100 text-teal-800' },
  fallecido_reportado: { es: '⚫ Fallecido', en: '⚫ Deceased', color: 'bg-gray-200 text-gray-700' },
  caso_cerrado: { es: '🔒 Cerrado', en: '🔒 Closed', color: 'bg-gray-100 text-gray-500' },
  duplicado: { es: '🔗 Duplicado', en: '🔗 Duplicate', color: 'bg-purple-100 text-purple-700' },
};

function FichaPersonaRegistrada({ ficha, es, onActualizar }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ condicion: ficha.condicion, observaciones: ficha.observaciones || '' });
  const [guardando, setGuardando] = useState(false);
  const cl = CONDICION_LABELS[ficha.condicion] || CONDICION_LABELS.no_sabe;

  const guardar = async () => {
    setGuardando(true);
    try {
      await base44.entities.PersonaRegistrada.update(ficha.id, form);
      onActualizar(ficha.id, form);
      setEditando(false);
    } catch {}
    setGuardando(false);
  };

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1F2E] truncate">{ficha.nombre_completo}</p>
          {ficha.institucion_nombre && (
            <p className="text-xs text-gray-400 mt-0.5">🏥 {ficha.institucion_nombre}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cl.color}`}>
            {es ? cl.es : cl.en}
          </span>
          <button
            onClick={() => setEditando(v => !v)}
            className="text-gray-400 hover:text-[#1A1F2E] p-1"
            title={es ? 'Editar' : 'Edit'}
          >
            {editando ? <X size={13} /> : <Edit3 size={13} />}
          </button>
        </div>
      </div>

      {editando && (
        <div className="mt-3 space-y-2 border-t border-[#EDEBE8] pt-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
              {es ? 'Condición' : 'Condition'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CONDICIONES.map(c => {
                const lbl = CONDICION_LABELS[c];
                return (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, condicion: c }))}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${form.condicion === c ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}
                  >
                    {es ? lbl.es : lbl.en}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
              {es ? 'Observaciones' : 'Notes'}
            </label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              rows={2}
              className="w-full border border-[#EDEBE8] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1A1F2E] resize-none"
              placeholder={es ? 'Notas adicionales...' : 'Additional notes...'}
            />
          </div>
          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full bg-[#1A7A4A] text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {es ? 'Guardar cambios' : 'Save changes'}
          </button>
        </div>
      )}

      {!editando && ficha.observaciones && (
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{ficha.observaciones}</p>
      )}
      <p className="text-[10px] text-gray-400 mt-1.5">{new Date(ficha.created_date).toLocaleDateString()}</p>
    </div>
  );
}

function FichaPersonaBuscada({ persona, es, onUpdateEstado }) {
  const [cambiando, setCambiando] = useState(false);
  const [editEstado, setEditEstado] = useState(false);
  const st = ESTADO_LABEL[persona.estado_caso] || ESTADO_LABEL.buscando;

  const ESTADOS_OPCIONES = [
    { val: 'buscando', es: '🔴 Sin contacto', en: '🔴 Missing' },
    { val: 'informacion_recibida', es: '🔵 Con pistas', en: '🔵 Has leads' },
    { val: 'encontrado_con_vida', es: '✅ Localizado', en: '✅ Located' },
    { val: 'en_hospital_refugio', es: '🏥 Hospital/refugio', en: '🏥 Hospital/shelter' },
    { val: 'caso_cerrado', es: '🔒 Cerrado', en: '🔒 Closed' },
  ];

  const cambiarEstado = async (nuevoEstado) => {
    setCambiando(true);
    try {
      await base44.entities.PersonasBuscadas.update(persona.id, { estado_caso: nuevoEstado });
      onUpdateEstado(persona.id, nuevoEstado);
      setEditEstado(false);
    } catch {}
    setCambiando(false);
  };

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1F2E] truncate">{persona.nombre_completo}</p>
          <p className="text-xs text-gray-400 mt-0.5">📍 {persona.ultima_ubicacion_conocida || persona.ciudad}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setEditEstado(v => !v)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}
            title={es ? 'Cambiar estado' : 'Change status'}
          >
            {es ? st.es : st.en}
          </button>
          <Link to={`/persona?id=${persona.id}`} className="text-gray-400 hover:text-[#1A1F2E] p-1" title={es ? 'Ver ficha' : 'View record'}>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
      {editEstado && (
        <div className="mt-2 border-t border-[#EDEBE8] pt-2 flex flex-wrap gap-1.5">
          {ESTADOS_OPCIONES.map(op => (
            <button
              key={op.val}
              onClick={() => cambiarEstado(op.val)}
              disabled={cambiando || persona.estado_caso === op.val}
              className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors disabled:opacity-40 ${persona.estado_caso === op.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600 hover:border-[#1A1F2E]'}`}
            >
              {es ? op.es : op.en}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-1.5">{new Date(persona.created_date).toLocaleDateString()}</p>
    </div>
  );
}

const PRIORIDAD_SOS = {
  critica: { es: '🔴 Crítica', en: '🔴 Critical', color: 'bg-red-100 text-red-700' },
  alta: { es: '🟠 Alta', en: '🟠 High', color: 'bg-orange-100 text-orange-700' },
  normal: { es: '⚪ Normal', en: '⚪ Normal', color: 'bg-gray-100 text-gray-600' },
};

function FichaSolicitud({ reporte, es }) {
  const pr = PRIORIDAD_SOS[reporte.prioridad] || PRIORIDAD_SOS.normal;
  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1F2E] truncate">
            {reporte.tipo_reporte || reporte.categoria || (es ? 'Reporte' : 'Report')}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">📍 {reporte.direccion || reporte.ciudad}, {reporte.estado_region}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${pr.color}`}>
          {es ? pr.es : pr.en}
        </span>
      </div>
      {reporte.personas_atrapadas === 'si' && (
        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
          <AlertTriangle size={9} /> {es ? 'Personas atrapadas' : 'Trapped people'}
        </span>
      )}
      {reporte.descripcion && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{reporte.descripcion}</p>
      )}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-gray-400">{new Date(reporte.created_date).toLocaleDateString()}</p>
        <span className="text-[10px] text-gray-400 capitalize">{reporte.estado_reporte || reporte.nivel_verificacion || ''}</span>
      </div>
    </div>
  );
}

export default function PortalVoluntario() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('registradas');
  const [personasRegistradas, setPersonasRegistradas] = useState([]);
  const [personasBuscadas, setPersonasBuscadas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(u => { setUser(u); return u; })
      .catch(() => { window.location.href = '/login'; })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    setCargandoDatos(true);
    try {
      const [registradas, buscadas, reportesSos] = await Promise.all([
        base44.entities.PersonaRegistrada.filter({ created_by_id: user.id }, '-created_date', 100),
        base44.entities.PersonasBuscadas.filter({ created_by_id: user.id }, '-created_date', 100),
        base44.entities.InfraestructuraSos.filter({ created_by_id: user.id }, '-created_date', 100),
      ]);
      setPersonasRegistradas(registradas);
      setPersonasBuscadas(buscadas);
      setSolicitudes(reportesSos);
    } catch {}
    setCargandoDatos(false);
  };

  const actualizarFicha = (id, datos) => {
    setPersonasRegistradas(prev => prev.map(p => p.id === id ? { ...p, ...datos } : p));
  };

  const actualizarEstadoBusqueda = (id, nuevoEstado) => {
    setPersonasBuscadas(prev => prev.map(p => p.id === id ? { ...p, estado_caso: nuevoEstado } : p));
  };

  if (cargando) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    </div>
  );

  const esVoluntarioOAdmin = user?.role === 'voluntario' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        {/* Header */}
        <div className="bg-[#1A1F2E] rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#D48C2E] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              🤝
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{user?.full_name || (es ? 'Voluntario' : 'Volunteer')}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D48C2E] text-white">
                {user?.role === 'admin' ? (es ? 'Administrador' : 'Admin') : (es ? 'Voluntario' : 'Volunteer')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl border border-[#EDEBE8] px-3 py-3 text-center">
            <p className="text-2xl font-black text-[#0F766E]">{personasRegistradas.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">{es ? 'Fichas' : 'Records'}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#EDEBE8] px-3 py-3 text-center">
            <p className="text-2xl font-black text-[#D48C2E]">{personasBuscadas.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">{es ? 'Búsquedas' : 'Searches'}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#EDEBE8] px-3 py-3 text-center">
            <p className="text-2xl font-black text-[#B83A52]">{solicitudes.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">{es ? 'Reportes' : 'Reports'}</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Link to="/registro-institucional" className="flex flex-col items-center gap-1 bg-[#0F766E] text-white text-[10px] font-bold px-2 py-3 rounded-xl no-underline text-center">
            <span className="text-base">📋</span>
            {es ? 'Subir listado' : 'Upload list'}
          </Link>
          <Link to="/buscar-persona" className="flex flex-col items-center gap-1 bg-[#D48C2E] text-white text-[10px] font-bold px-2 py-3 rounded-xl no-underline text-center">
            <span className="text-base">🔎</span>
            {es ? 'Publicar búsqueda' : 'Post search'}
          </Link>
          <Link to="/reportar" className="flex flex-col items-center gap-1 bg-[#B83A52] text-white text-[10px] font-bold px-2 py-3 rounded-xl no-underline text-center">
            <span className="text-base">🚨</span>
            {es ? 'Nuevo reporte' : 'New report'}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[#EDEBE8] mb-4 bg-white text-sm">
          {[
            { key: 'registradas', icon: '📋', es: `Fichas (${personasRegistradas.length})`, en: `Records (${personasRegistradas.length})` },
            { key: 'buscadas', icon: '🔎', es: `Búsquedas (${personasBuscadas.length})`, en: `Searches (${personasBuscadas.length})` },
            { key: 'solicitudes', icon: '🚨', es: `Reportes (${solicitudes.length})`, en: `Reports (${solicitudes.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 font-medium transition-colors flex flex-col items-center gap-0.5 ${tab === t.key ? 'bg-[#1A1F2E] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <span>{t.icon}</span>
              <span className="text-[10px]">{es ? t.es : t.en}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">
            {tab === 'registradas'
              ? (es ? 'Personas que registraste en listas institucionales' : 'People you registered in institutional lists')
              : tab === 'buscadas'
              ? (es ? 'Búsquedas de personas que publicaste' : 'Person searches you published')
              : (es ? 'Reportes de emergencia que enviaste' : 'Emergency reports you submitted')}
          </p>
          <button
            onClick={cargarDatos}
            disabled={cargandoDatos}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1A1F2E]"
          >
            <RefreshCw size={11} className={cargandoDatos ? 'animate-spin' : ''} />
            {es ? 'Actualizar' : 'Refresh'}
          </button>
        </div>

        {cargandoDatos ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            {/* Tab: Fichas registradas (PersonaRegistrada) */}
            {tab === 'registradas' && (
              <div className="space-y-2">
                {personasRegistradas.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-3">📋</p>
                    <p className="text-sm text-gray-500 mb-2">{es ? 'No has subido fichas todavía.' : 'No records uploaded yet.'}</p>
                    <Link to="/registro-institucional" className="text-sm text-[#0F766E] font-semibold underline underline-offset-2">
                      {es ? 'Subir listado institucional →' : 'Upload institutional list →'}
                    </Link>
                  </div>
                ) : (
                  personasRegistradas.map(ficha => (
                    <FichaPersonaRegistrada
                      key={ficha.id}
                      ficha={ficha}
                      es={es}
                      onActualizar={actualizarFicha}
                    />
                  ))
                )}
              </div>
            )}

            {/* Tab: Personas buscadas */}
            {tab === 'buscadas' && (
              <div className="space-y-2">
                {personasBuscadas.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-3">🔎</p>
                    <p className="text-sm text-gray-500 mb-2">{es ? 'No has publicado búsquedas.' : 'No searches published yet.'}</p>
                    <Link to="/buscar-persona" className="text-sm text-[#D48C2E] font-semibold underline underline-offset-2">
                      {es ? 'Publicar una búsqueda →' : 'Publish a search →'}
                    </Link>
                  </div>
                ) : (
                  personasBuscadas.map(p => (
                    <FichaPersonaBuscada key={p.id} persona={p} es={es} onUpdateEstado={actualizarEstadoBusqueda} />
                  ))
                )}
              </div>
            )}

            {/* Tab: Solicitudes / reportes SOS */}
            {tab === 'solicitudes' && (
              <div className="space-y-2">
                {solicitudes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-3">🚨</p>
                    <p className="text-sm text-gray-500 mb-2">{es ? 'No has enviado reportes.' : 'No reports submitted yet.'}</p>
                    <Link to="/reportar" className="text-sm text-[#B83A52] font-semibold underline underline-offset-2">
                      {es ? 'Enviar un reporte →' : 'Submit a report →'}
                    </Link>
                  </div>
                ) : (
                  solicitudes.map(r => (
                    <FichaSolicitud key={r.id} reporte={r} es={es} />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}