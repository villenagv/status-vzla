import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Edit3, Save, X, ExternalLink, RefreshCw, AlertTriangle, HardHat, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import SubidaMasivaModulo from '@/components/voluntario/SubidaMasivaModulo';
import CentroTriage from '@/components/portal/CentroTriage';
import GestionEdificios from '@/components/portal/GestionEdificios';

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
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{ficha.nombre_completo}</p>
          {ficha.institucion_nombre && <p className="text-xs text-gray-400 mt-0.5">🏥 {ficha.institucion_nombre}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cl.color}`}>{es ? cl.es : cl.en}</span>
          <button onClick={() => setEditando(v => !v)} className="text-gray-400 hover:text-gray-700 p-1">
            {editando ? <X size={13} /> : <Edit3 size={13} />}
          </button>
        </div>
      </div>
      {editando && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {CONDICIONES.map(c => {
              const lbl = CONDICION_LABELS[c];
              return (
                <button key={c} onClick={() => setForm(f => ({ ...f, condicion: c }))}
                  className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors ${form.condicion === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                  {es ? lbl.es : lbl.en}
                </button>
              );
            })}
          </div>
          <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none"
            placeholder={es ? 'Notas adicionales...' : 'Additional notes...'} />
          <button onClick={guardar} disabled={guardando}
            className="w-full bg-green-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {es ? 'Guardar' : 'Save'}
          </button>
        </div>
      )}
      {!editando && ficha.observaciones && <p className="text-xs text-gray-500 mt-1.5">{ficha.observaciones}</p>}
      <p className="text-[10px] text-gray-400 mt-1.5">{new Date(ficha.created_date).toLocaleDateString()}</p>
    </div>
  );
}

function FichaPersonaBuscada({ persona, es, onUpdateEstado }) {
  const [cambiando, setCambiando] = useState(false);
  const [editEstado, setEditEstado] = useState(false);
  const st = ESTADO_LABEL[persona.estado_caso] || ESTADO_LABEL.buscando;
  const ESTADOS = [
    { val: 'buscando', es: '🔴 Sin contacto', en: '🔴 Missing' },
    { val: 'informacion_recibida', es: '🔵 Con pistas', en: '🔵 Has leads' },
    { val: 'encontrado_con_vida', es: '✅ Localizado', en: '✅ Located' },
    { val: 'en_hospital_refugio', es: '🏥 Hospital/refugio', en: '🏥 Hospital/shelter' },
    { val: 'caso_cerrado', es: '🔒 Cerrado', en: '🔒 Closed' },
  ];
  const cambiarEstado = async (v) => {
    setCambiando(true);
    try { await base44.entities.PersonasBuscadas.update(persona.id, { estado_caso: v }); onUpdateEstado(persona.id, v); setEditEstado(false); } catch {}
    setCambiando(false);
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{persona.nombre_completo}</p>
          <p className="text-xs text-gray-400 mt-0.5">📍 {persona.ultima_ubicacion_conocida || persona.ciudad}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setEditEstado(v => !v)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
            {es ? st.es : st.en}
          </button>
          <Link to={`/persona?id=${persona.id}`} className="text-gray-400 hover:text-gray-700 p-1"><ExternalLink size={13} /></Link>
        </div>
      </div>
      {editEstado && (
        <div className="mt-2 border-t border-gray-100 pt-2 flex flex-wrap gap-1.5">
          {ESTADOS.map(op => (
            <button key={op.val} onClick={() => cambiarEstado(op.val)} disabled={cambiando || persona.estado_caso === op.val}
              className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors disabled:opacity-40 ${persona.estado_caso === op.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-900'}`}>
              {es ? op.es : op.en}
            </button>
          ))}
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-1.5">{new Date(persona.created_date).toLocaleDateString()}</p>
    </div>
  );
}

export default function PortalVoluntario() {
  const { lang } = useLang();
  const es = lang === 'es';
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('inicio');
  const [triageVistaInicial, setTriageVistaInicial] = useState('triage');
  const [personasRegistradas, setPersonasRegistradas] = useState([]);
  const [personasBuscadas, setPersonasBuscadas] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const t = (a, b) => es ? a : b;

  useEffect(() => {
    base44.auth.me()
      .then(async u => {
        if (!u) { window.location.href = '/login'; return; }
        setUser(u);

        // Verificar perfil profesional
        const perfiles = await base44.entities.PerfilProfesional.filter({ user_id: u.id }).catch(() => []);
        const p = perfiles?.[0];

        // Si no tiene perfil completado → identificación
        if (!p || !p.completado) {
          // Admins van directo (skip identificación)
          if (u.role !== 'admin') {
            navigate('/identificacion-profesional');
            return;
          }
        }

        // Si es especialista pendiente de aprobación, avisarle pero dejarlo entrar
        setPerfil(p || { tipo_perfil: 'voluntario', estado_aprobacion: 'aprobado' });

        // Verificar solicitud voluntario solo para no-admins sin perfil aprobado
        if (u.role !== 'admin' && p?.estado_aprobacion !== 'aprobado' && p?.tipo_perfil === 'voluntario') {
          const sols = await base44.entities.SolicitudVoluntario.filter({ user_id: u.id }).catch(() => []);
          const aprobada = sols?.find(s => s.estado === 'aprobado');
          if (!aprobada) { window.location.href = '/voluntario'; return; }
        }

        return u;
      })
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
      const [registradas, buscadas] = await Promise.all([
        base44.entities.PersonaRegistrada.filter({ created_by_id: user.id }, '-created_date', 100),
        base44.entities.PersonasBuscadas.filter({ created_by_id: user.id }, '-created_date', 100),
      ]);
      setPersonasRegistradas(registradas || []);
      setPersonasBuscadas(buscadas || []);
    } catch {}
    setCargandoDatos(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
    </div>
  );

  const esEspecialista = perfil && ['ingeniero', 'arquitecto'].includes(perfil.tipo_perfil);
  const especialistaAprobado = esEspecialista && perfil.estado_aprobacion === 'aprobado';
  const isAdmin = user?.role === 'admin';

  // Tabs disponibles
  const tabs = [
    { key: 'inicio',     icon: '🏠', es: 'Inicio',      en: 'Home'      },
    { key: 'edificios',  icon: '🏗️', es: 'Edificios',   en: 'Buildings' },
    { key: 'personas',   icon: '👤', es: 'Personas',     en: 'People'    },
    ...(esEspecialista || isAdmin ? [{ key: 'tareas', icon: '🏛️', es: 'Triaje técnico', en: 'Technical triage' }] : []),
    { key: 'carga',      icon: '📤', es: 'Carga datos',  en: 'Upload'    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-5 flex-1">

        {/* Header */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ background: esEspecialista ? '#1D4ED8' : '#0F766E' }}>
              {esEspecialista ? (perfil.tipo_perfil === 'arquitecto' ? '📐' : '⚙️') : '🤝'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{user?.full_name || (es ? 'Voluntario' : 'Volunteer')}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: esEspecialista ? '#1D4ED8' : '#0F766E', color: '#fff' }}>
                  {isAdmin ? t('Admin', 'Admin') : perfil ? t(perfil.tipo_perfil, perfil.tipo_perfil) : t('Voluntario', 'Volunteer')}
                </span>
                {esEspecialista && perfil.estado_aprobacion === 'pendiente' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-white">⏳ {t('Pendiente aprobación', 'Pending approval')}</span>
                )}
                {esEspecialista && perfil.estado_aprobacion === 'aprobado' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">✅ {t('Aprobado', 'Approved')}</span>
                )}
              </div>
            </div>
          </div>
          {/* Acceso directo al Dashboard de inspecciones (solo especialistas aprobados o admin) */}
          {(especialistaAprobado || isAdmin) && (
            <Link to="/inspecciones"
              className="mt-3 flex items-center justify-between gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-3 no-underline transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <p className="text-sm font-bold text-white">{t('Dashboard de inspecciones', 'Inspections dashboard')}</p>
                  <p className="text-[10px] text-blue-100">{t('Triaje y procesamiento técnico', 'Triage & technical processing')}</p>
                </div>
              </div>
              <span className="text-white text-lg">→</span>
            </Link>
          )}

          {/* Aviso especialista pendiente */}
          {esEspecialista && perfil.estado_aprobacion === 'pendiente' && (
            <div className="mt-3 bg-yellow-900/40 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-xs text-yellow-300 leading-relaxed">
                ⏳ {t('Tu perfil de especialista está pendiente de revisión. Puedes acceder al portal, pero las evaluaciones estructurales se activarán cuando el administrador apruebe tu perfil.',
                       'Your specialist profile is pending review. You can access the portal, but structural assessments will be activated when the admin approves your profile.')}
              </p>
            </div>
          )}
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center">
            <p className="text-2xl font-black text-teal-700">{personasRegistradas.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">{t('Fichas', 'Records')}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center">
            <p className="text-2xl font-black text-amber-600">{personasBuscadas.length}</p>
            <p className="text-[10px] text-gray-500 font-medium">{t('Búsquedas', 'Searches')}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center cursor-pointer" onClick={() => setTab('edificios')}>
            <p className="text-2xl font-black text-blue-700">🏗️</p>
            <p className="text-[10px] text-gray-500 font-medium">{t('Edificios', 'Buildings')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${tab === tb.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <span>{tb.icon}</span> {es ? tb.es : tb.en}
            </button>
          ))}
        </div>

        {/* ── TAB: INICIO ── */}
        {tab === 'inicio' && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700 mb-2">{t('Acciones rápidas', 'Quick actions')}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setTriageVistaInicial('campo'); setTab('tareas'); }} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-3 cursor-pointer hover:bg-red-100 text-left col-span-2">
                <span className="text-xl">📸</span>
                <div>
                  <p className="text-xs font-bold text-red-800">{t('Pedir inspección / Tomar fotos de daños', 'Request inspection / Take damage photos')}</p>
                  <p className="text-[10px] text-red-600 mt-0.5">{t('Funciona sin señal — se sube después', 'Works offline — uploads later')}</p>
                </div>
              </button>
              <Link to="/edificios?tab=reportar" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-3 no-underline hover:bg-red-100">
                <span className="text-xl">🚨</span>
                <div><p className="text-xs font-bold text-red-800">{t('Reportar daño', 'Report damage')}</p></div>
              </Link>
              <button onClick={() => setTab('edificios')} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-3 cursor-pointer hover:bg-blue-100 text-left">
                <span className="text-xl">🏗️</span>
                <div><p className="text-xs font-bold text-blue-800">{t('Gestionar edificios', 'Manage buildings')}</p></div>
              </button>
              <Link to="/buscar-persona" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 no-underline hover:bg-amber-100">
                <span className="text-xl">🔎</span>
                <div><p className="text-xs font-bold text-amber-800">{t('Buscar persona', 'Search person')}</p></div>
              </Link>
              <Link to="/reportar-encontrado" className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-3 py-3 no-underline hover:bg-green-100">
                <span className="text-xl">🙋</span>
                <div><p className="text-xs font-bold text-green-800">{t('Encontré alguien', 'I found someone')}</p></div>
              </Link>
              <Link to="/centros-apoyo" className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-3 py-3 no-underline hover:bg-teal-100">
                <span className="text-xl">🏥</span>
                <div><p className="text-xs font-bold text-teal-800">{t('Centros de apoyo', 'Help centers')}</p></div>
              </Link>
              {(esEspecialista || isAdmin) && (
                <button onClick={() => setTab('tareas')} className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-3 py-3 cursor-pointer hover:bg-purple-100 text-left">
                  <span className="text-xl">⚙️</span>
                  <div><p className="text-xs font-bold text-purple-800">{t('Evaluar estructuras', 'Assess structures')}</p></div>
                </button>
              )}
              {(especialistaAprobado || isAdmin) && (
                <Link to="/inspecciones" className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-3 no-underline hover:bg-blue-100 col-span-2">
                  <span className="text-xl">📋</span>
                  <div><p className="text-xs font-bold text-blue-800">{t('Dashboard de inspecciones', 'Inspections dashboard')}</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">{t('Solo ingenieros y arquitectos', 'Engineers & architects only')}</p></div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: EDIFICIOS ── */}
        {tab === 'edificios' && <GestionEdificios es={es} />}

        {/* ── TAB: PERSONAS ── */}
        {tab === 'personas' && (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[
                { key: 'registradas', es: `📋 Fichas (${personasRegistradas.length})`, en: `📋 Records (${personasRegistradas.length})` },
                { key: 'buscadas',    es: `🔎 Búsquedas (${personasBuscadas.length})`, en: `🔎 Searches (${personasBuscadas.length})` },
              ].map(st => (
                <button key={st.key} onClick={() => setSolicitudes(st.key)}
                  className="px-3 py-2 text-xs font-semibold border rounded-xl whitespace-nowrap cursor-pointer bg-white border-gray-200 text-gray-600 hover:border-gray-400">
                  {es ? st.es : st.en}
                </button>
              ))}
              <button onClick={cargarDatos} disabled={cargandoDatos} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2">
                <RefreshCw size={11} className={cargandoDatos ? 'animate-spin' : ''} /> {t('Refrescar', 'Refresh')}
              </button>
            </div>
            {cargandoDatos ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
            ) : (
              <div className="space-y-2">
                {personasRegistradas.map(f => (
                  <FichaPersonaRegistrada key={f.id} ficha={f} es={es} onActualizar={(id, d) => setPersonasRegistradas(prev => prev.map(p => p.id === id ? { ...p, ...d } : p))} />
                ))}
                {personasBuscadas.map(p => (
                  <FichaPersonaBuscada key={p.id} persona={p} es={es} onUpdateEstado={(id, v) => setPersonasBuscadas(prev => prev.map(x => x.id === id ? { ...x, estado_caso: v } : x))} />
                ))}
                {personasRegistradas.length === 0 && personasBuscadas.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-3">👤</p>
                    <p className="text-sm text-gray-500">{t('No has registrado personas todavía.', 'No people registered yet.')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TAREAS ESPECIALISTA ── */}
        {tab === 'tareas' && (
          <div>
            {(esEspecialista && perfil.estado_aprobacion === 'pendiente') ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                <p className="text-3xl mb-3">⏳</p>
                <p className="text-sm font-bold text-yellow-800">{t('Evaluaciones en espera de aprobación', 'Assessments pending approval')}</p>
                <p className="text-xs text-yellow-700 mt-2 leading-relaxed">
                  {t('El administrador debe aprobar tu perfil de especialista antes de que puedas registrar evaluaciones estructurales.',
                     'The admin must approve your specialist profile before you can register structural assessments.')}
                </p>
              </div>
            ) : (
              <CentroTriage perfil={perfil ? { ...perfil, user_id: perfil.user_id || user?.id } : { tipo_perfil: 'admin', user_id: user?.id, user_nombre: user?.full_name, user_email: user?.email }} es={es} vistaInicial={triageVistaInicial} />
            )}
          </div>
        )}

        {/* ── TAB: CARGA DE DATOS ── */}
        {tab === 'carga' && (
          <SubidaMasivaModulo es={es} />
        )}

      </div>
      <Footer />
    </div>
  );
}