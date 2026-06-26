import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, Edit3, Save, X, Bell, BellOff, Trash2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const ESTADO_LABEL = {
  buscando: { es: 'Buscando', en: 'Searching', color: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida: { es: 'Info recibida', en: 'Info received', color: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado: { es: 'Visto – sin confirmar', en: 'Seen – unconfirmed', color: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida: { es: 'Encontrado ✅', en: 'Found alive ✅', color: 'bg-green-100 text-green-800' },
  en_hospital_refugio: { es: 'En hospital/refugio', en: 'In hospital/shelter', color: 'bg-teal-100 text-teal-800' },
  fallecido_reportado: { es: 'Fallecido reportado', en: 'Death reported', color: 'bg-gray-200 text-gray-700' },
  caso_cerrado: { es: 'Caso cerrado', en: 'Case closed', color: 'bg-gray-100 text-gray-500' },
};

const PRIORIDAD_COLOR = {
  critica: 'bg-red-100 text-red-700',
  alta: 'bg-orange-100 text-orange-700',
  normal: 'bg-gray-100 text-gray-600',
};

const CONDICION_LABEL = {
  a_salvo: { es: 'A salvo ✅', en: 'Safe ✅', color: 'bg-green-100 text-green-800' },
  herido_leve: { es: 'Herido leve', en: 'Minor injury', color: 'bg-yellow-100 text-yellow-800' },
  herido_grave: { es: 'Herido grave', en: 'Serious injury', color: 'bg-orange-100 text-orange-800' },
  fallecido_reportado: { es: 'Fallecido reportado', en: 'Death reported', color: 'bg-gray-200 text-gray-700' },
  no_identificado: { es: 'No identificado', en: 'Unidentified', color: 'bg-purple-100 text-purple-700' },
  no_sabe: { es: 'No se sabe', en: 'Unknown', color: 'bg-gray-100 text-gray-600' },
};

const ESTADOS_BUSQUEDA = Object.keys(ESTADO_LABEL);
const CONDICIONES_ENCONTRADA = ['a_salvo', 'herido_leve', 'herido_grave', 'fallecido_reportado', 'no_identificado'];
const CONDICIONES_REGISTRADA = [...CONDICIONES_ENCONTRADA, 'no_sabe'];

function PersonaCard({ persona: p, es, onUnsub, subActiva, editable, tipo = 'busqueda', onUpdateStatus }) {
  const [editando, setEditando] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const esEncontrada = tipo === 'encontrada' || tipo === 'registrada';
  const estadoActual = esEncontrada ? p.condicion : p.estado_caso;
  const st = esEncontrada
    ? (CONDICION_LABEL[estadoActual] || { es: estadoActual, en: estadoActual, color: 'bg-gray-100 text-gray-600' })
    : (ESTADO_LABEL[estadoActual] || { es: estadoActual, en: estadoActual, color: 'bg-gray-100 text-gray-600' });
  const opciones = tipo === 'registrada' ? CONDICIONES_REGISTRADA : esEncontrada ? CONDICIONES_ENCONTRADA : ESTADOS_BUSQUEDA;
  const labels = esEncontrada ? CONDICION_LABEL : ESTADO_LABEL;
  const titulo = p.nombre_completo || p.nombre_o_descripcion || (es ? 'Persona reportada' : 'Reported person');
  const ubicacion = esEncontrada ? [p.ubicacion_actual || p.nombre_lugar || p.institucion_nombre, p.ciudad].filter(Boolean).join(' · ') : [p.ultima_ubicacion_conocida, p.ciudad].filter(Boolean).join(' · ');

  const cambiarEstado = async (nuevoEstado) => {
    setCambiando(true);
    await onUpdateStatus(tipo, p.id, nuevoEstado);
    setCambiando(false);
    setEditando(false);
  };

  return (
    <div className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1F2E] truncate">{titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{ubicacion || (es ? 'Sin ubicación' : 'No location')}</p>
          {esEncontrada && <p className="text-[10px] text-green-700 font-bold mt-0.5">{tipo === 'registrada' ? (es ? 'Ficha de listado institucional' : 'Institutional list record') : (es ? 'Persona encontrada reportada' : 'Found person report')}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => editable && setEditando(v => !v)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
            {es ? st.es : st.en}
          </button>
          {subActiva && onUnsub && (
            <button onClick={() => onUnsub(p.id)} title={es ? 'Dejar de seguir' : 'Unfollow'} className="text-gray-300 hover:text-[#B83A52] transition-colors">
              <BellOff size={14} />
            </button>
          )}
        </div>
      </div>
      {editable && editando && (
        <div className="mt-3 pt-3 border-t border-[#EDEBE8] flex flex-wrap gap-1.5">
          {opciones.map(op => {
            const lbl = labels[op] || { es: op, en: op };
            return (
              <button key={op} onClick={() => cambiarEstado(op)} disabled={cambiando || estadoActual === op} className={`text-[10px] font-bold px-2 py-1 rounded-full border disabled:opacity-40 ${estadoActual === op ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
                {es ? lbl.es : lbl.en}
              </button>
            );
          })}
        </div>
      )}
      {p.contacto_telefono && (
        <p className="text-xs text-gray-400 mt-1">📞 {es ? 'Contacto:' : 'Contact:'} {p.contacto_telefono}</p>
      )}
    </div>
  );
}

export default function MiPerfil() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('busquedas');
  const [busquedas, setBusquedas] = useState([]);
  const [encontradas, setEncontradas] = useState([]);
  const [registradas, setRegistradas] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [subs, setSubs] = useState([]);
  const [personasSub, setPersonasSub] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [nombreEdit, setNombreEdit] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        setNombreEdit(u.full_name || '');
        const [nots, mySubs, allPersonas, personasEncontradas, personasRegistradas, allReportes, historialItems] = await Promise.all([
          base44.entities.NotificacionesUsuario.filter({ user_id: u.id }),
          base44.entities.Suscripciones.filter({ user_id: u.id }),
          base44.entities.PersonasBuscadas.filter({ created_by_id: u.id }),
          base44.entities.PersonasEncontradas.filter({ created_by_id: u.id }),
          base44.entities.PersonaRegistrada.filter({ created_by_id: u.id }),
          base44.entities.InfraestructuraSos.filter({ created_by_id: u.id }),
          base44.entities.HistorialUsuario.filter({ user_id: u.id }),
        ]);
        setNotificaciones(nots.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setSubs(mySubs);
        setBusquedas(allPersonas);
        setEncontradas(personasEncontradas);
        setRegistradas(personasRegistradas);
        setReportes(allReportes);
        setHistorial(historialItems.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));

        const personasIds = [...new Set(mySubs.map(s => s.persona_id))];
        if (personasIds.length > 0) {
          const todas = await base44.entities.PersonasBuscadas.list();
          setPersonasSub(todas.filter(p => personasIds.includes(p.id)));
        }
      } catch {
        window.location.href = '/login';
      } finally {
        setCargando(false);
      }
    };
    init();
  }, []);

  const marcarLeida = async (nId) => {
    await base44.entities.NotificacionesUsuario.update(nId, { leida: true });
    setNotificaciones(prev => prev.map(n => n.id === nId ? { ...n, leida: true } : n));
  };

  const marcarTodasLeidas = async () => {
    const noLeidas = notificaciones.filter(n => !n.leida);
    await Promise.all(noLeidas.map(n => base44.entities.NotificacionesUsuario.update(n.id, { leida: true })));
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const guardarPerfil = async () => {
    if (!nombreEdit.trim()) return;
    setGuardando(true);
    try {
      await base44.auth.updateMe({ full_name: nombreEdit.trim() });
      setUser(prev => ({ ...prev, full_name: nombreEdit.trim() }));
      setEditandoPerfil(false);
      showMsg(es ? 'Perfil actualizado.' : 'Profile updated.');
    } catch {
      showMsg(es ? 'Error al guardar.' : 'Error saving.');
    }
    setGuardando(false);
  };

  const dejarDeSeguir = async (personaId) => {
    const sub = subs.find(s => s.persona_id === personaId);
    if (!sub) return;
    await base44.entities.Suscripciones.update(sub.id, { activa: false });
    setSubs(prev => prev.filter(s => s.id !== sub.id));
    setPersonasSub(prev => prev.filter(p => p.id !== personaId));
    showMsg(es ? 'Dejaste de seguir esta búsqueda.' : 'You unfollowed this search.');
  };

  const actualizarEstadoPersona = async (tipo, personaId, nuevoEstado) => {
    if (tipo === 'registrada') {
      await base44.entities.PersonaRegistrada.update(personaId, { condicion: nuevoEstado });
      setRegistradas(prev => prev.map(p => p.id === personaId ? { ...p, condicion: nuevoEstado } : p));
    } else if (tipo === 'encontrada') {
      await base44.entities.PersonasEncontradas.update(personaId, { condicion: nuevoEstado });
      setEncontradas(prev => prev.map(p => p.id === personaId ? { ...p, condicion: nuevoEstado } : p));
    } else {
      await base44.entities.PersonasBuscadas.update(personaId, { estado_caso: nuevoEstado });
      setBusquedas(prev => prev.map(p => p.id === personaId ? { ...p, estado_caso: nuevoEstado } : p));
    }
    await base44.entities.HistorialUsuario.create({
      user_id: user.id,
      tipo_accion: 'actualizacion_realizada',
      entidad_id: personaId,
      entidad_nombre: tipo === 'registrada' ? (es ? 'Ficha institucional' : 'Institutional record') : tipo === 'encontrada' ? (es ? 'Persona encontrada' : 'Found person') : (es ? 'Búsqueda de persona' : 'Person search'),
      metadata: nuevoEstado,
    }).catch(() => {});
    showMsg(es ? 'Estado actualizado.' : 'Status updated.');
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  if (cargando) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        {msg && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 mb-3">{msg}</div>
        )}

        {/* User header */}
        <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1A1F2E] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              {editandoPerfil ? (
                <input
                  value={nombreEdit}
                  onChange={e => setNombreEdit(e.target.value)}
                  className="border border-[#EDEBE8] rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:border-[#1A1F2E] mb-1"
                  placeholder={es ? 'Tu nombre' : 'Your name'}
                  autoFocus
                />
              ) : (
                <p className="font-bold text-[#1A1F2E] truncate">{user?.full_name || (es ? 'Usuario' : 'User')}</p>
              )}
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : user?.role === 'voluntario' ? 'bg-[#D48C2E] text-white' : 'bg-blue-50 text-blue-600'}`}>
                {user?.role === 'admin' ? (es ? 'Administrador' : 'Admin') : user?.role === 'voluntario' ? (es ? 'Voluntario' : 'Volunteer') : (es ? 'Ciudadano' : 'Citizen')}
              </span>
              {(user?.role === 'voluntario' || user?.role === 'admin') && (
                <Link to="/portal-voluntario" className="block text-[10px] text-[#0F766E] font-semibold mt-1 underline underline-offset-2 no-underline hover:opacity-80">
                  🤝 {es ? 'Ver portal voluntario →' : 'View volunteer portal →'}
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {editandoPerfil ? (
                <>
                  <button onClick={guardarPerfil} disabled={guardando} className="text-green-600 hover:text-green-700 p-2">
                    <Save size={16} />
                  </button>
                  <button onClick={() => { setEditandoPerfil(false); setNombreEdit(user?.full_name || ''); }} className="text-gray-400 hover:text-gray-600 p-2">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditandoPerfil(true)} className="text-gray-400 hover:text-[#1A1F2E] p-2" title={es ? 'Editar nombre' : 'Edit name'}>
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => base44.auth.logout('/')} className="text-gray-400 hover:text-[#B83A52] p-2" title={es ? 'Cerrar sesión' : 'Sign out'}>
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { n: busquedas.length + encontradas.length + registradas.length, label: es ? 'Personas' : 'People', color: 'text-[#D48C2E]' },
            { n: reportes.length, label: es ? 'Reportes' : 'Reports', color: 'text-[#B83A52]' },
            { n: personasSub.length, label: es ? 'Seguidos' : 'Following', color: 'text-[#2E7D32]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#EDEBE8] px-3 py-3 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.n}</p>
              <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[#EDEBE8] mb-4 bg-white text-sm">
          {[
            { key: 'busquedas', icon: '🔎', es: 'Personas', en: 'People' },
            { key: 'reportes', icon: '🚨', es: 'Reportes', en: 'Reports' },
            { key: 'suscripciones', icon: '⭐', es: 'Seguidos', en: 'Following' },
            { key: 'notificaciones', icon: '🔔', es: noLeidas > 0 ? `Avisos (${noLeidas})` : 'Avisos', en: noLeidas > 0 ? `Alerts (${noLeidas})` : 'Alerts' },
            { key: 'historial', icon: '📜', es: 'Historial', en: 'History' },
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

        {/* Tab: Búsquedas */}
        {tab === 'busquedas' && (
          <div className="space-y-3">
            <Link to="/buscar-persona" className="flex items-center gap-2 justify-center w-full border-2 border-dashed border-[#EDEBE8] rounded-xl py-3 text-sm text-gray-400 hover:border-[#1A1F2E] hover:text-[#1A1F2E] transition-colors">
              + {es ? 'Nueva búsqueda' : 'New search'}
            </Link>
            <p className="text-xs text-gray-400 text-center">{es ? 'Toca el estado de una persona para actualizarlo.' : 'Tap a person status to update it.'}</p>
            {busquedas.length === 0 && encontradas.length === 0 && registradas.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes personas registradas.' : 'No people registered.'}</p>
            ) : (
              <>
                {busquedas.map(p => <PersonaCard key={p.id} persona={p} es={es} editable onUpdateStatus={actualizarEstadoPersona} />)}
                {encontradas.map(p => <PersonaCard key={p.id} persona={p} es={es} tipo="encontrada" editable onUpdateStatus={actualizarEstadoPersona} />)}
                {registradas.map(p => <PersonaCard key={p.id} persona={p} es={es} tipo="registrada" editable onUpdateStatus={actualizarEstadoPersona} />)}
              </>
            )}
          </div>
        )}

        {/* Tab: Reportes de daño */}
        {tab === 'reportes' && (
          <div className="space-y-3">
            <Link to="/reportar" className="flex items-center gap-2 justify-center w-full border-2 border-dashed border-[#EDEBE8] rounded-xl py-3 text-sm text-gray-400 hover:border-[#1A1F2E] hover:text-[#1A1F2E] transition-colors">
              + {es ? 'Nuevo reporte de emergencia' : 'New emergency report'}
            </Link>
            {reportes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes reportes registrados.' : 'No reports registered.'}</p>
            ) : (
              reportes.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-[#1A1F2E]">{r.tipo_reporte}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${PRIORIDAD_COLOR[r.prioridad] || PRIORIDAD_COLOR.normal}`}>
                      {r.prioridad === 'critica' ? (es ? 'CRÍTICA' : 'CRITICAL') : r.prioridad === 'alta' ? (es ? 'Alta' : 'High') : (es ? 'Normal' : 'Normal')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">📍 {r.direccion || r.ciudad}, {r.estado_region}</p>
                  {r.personas_atrapadas === 'si' && (
                    <span className="inline-block mt-1 text-[10px] font-bold bg-[#F4D5DD] text-[#B83A52] px-2 py-0.5 rounded-full">
                      ⚠️ {es ? 'Personas atrapadas' : 'Trapped people'}
                    </span>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1.5">{new Date(r.created_date).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Suscripciones */}
        {tab === 'suscripciones' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center py-1">
              {es ? 'Recibirás alertas por email cuando haya actualizaciones.' : 'You will receive email alerts when there are updates.'}
            </p>
            {personasSub.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-2">{es ? 'No sigues ninguna búsqueda todavía.' : 'You are not following any search yet.'}</p>
                <Link to="/buscar-persona" className="text-sm text-[#D48C2E] underline underline-offset-2">
                  {es ? 'Buscar personas' : 'Search people'}
                </Link>
              </div>
            ) : (
              personasSub.map(p => (
                <PersonaCard key={p.id} persona={p} es={es} subActiva onUnsub={dejarDeSeguir} />
              ))
            )}
          </div>
        )}

        {/* Tab: Notificaciones */}
        {tab === 'notificaciones' && (
          <div className="space-y-2">
            {notificaciones.length > 0 && noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="w-full text-xs text-gray-400 hover:text-[#1A1F2E] py-2 underline underline-offset-2">
                {es ? 'Marcar todas como leídas' : 'Mark all as read'}
              </button>
            )}
            {notificaciones.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes notificaciones.' : 'No notifications.'}</p>
            ) : (
              notificaciones.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.leida && marcarLeida(n.id)}
                  className={`bg-white rounded-xl border px-4 py-3 cursor-pointer transition-colors ${!n.leida ? 'border-[#D48C2E] bg-[#FFFBF5]' : 'border-[#EDEBE8]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1A1F2E]">{n.titulo}</p>
                    {!n.leida && <span className="w-2 h-2 rounded-full bg-[#D48C2E] flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-400">{new Date(n.created_date).toLocaleDateString()}</p>
                    {n.link_ref && (
                      <Link to={n.link_ref} onClick={e => e.stopPropagation()} className="text-[10px] text-[#D48C2E] flex items-center gap-0.5 hover:underline">
                        {es ? 'Ver' : 'View'} <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Historial */}
        {tab === 'historial' && (
          <div className="space-y-2">
            {historial.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-2">{es ? 'No tienes actividad registrada aún.' : 'No activity yet.'}</p>
                <p className="text-xs text-gray-300">{es ? 'Tus búsquedas y consultas aparecerán aquí.' : 'Your searches and queries will appear here.'}</p>
              </div>
            ) : (
              historial.slice(0, 30).map(h => {
                const types = {
                  busqueda_persona: { icon: '🔎', es: 'Buscó persona', en: 'Searched person' },
                  consulta_edificio: { icon: '🏗️', es: 'Consultó edificio', en: 'Consulted building' },
                  reporte_creado: { icon: '📋', es: 'Reporte creado', en: 'Report created' },
                  actualizacion_realizada: { icon: '🔄', es: 'Actualizó estado', en: 'Updated status' },
                  persona_encontrada: { icon: '✅', es: 'Encontró persona', en: 'Found person' },
                  suscripcion_agregada: { icon: '⭐', es: 'Agregó seguimiento', en: 'Added following' },
                };
                const t = types[h.tipo_accion] || { icon: '📄', es: h.tipo_accion, en: h.tipo_accion };
                return (
                  <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-base flex-shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{es ? t.es : t.en}</p>
                      {h.entidad_nombre && <p className="text-xs text-gray-500">{h.entidad_nombre}</p>}
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        📍 {h.ciudad || '—'} · {new Date(h.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {historial.length > 30 && (
              <p className="text-center text-xs text-gray-400 py-2">{es ? 'Mostrando los últimos 30' : 'Showing last 30'}</p>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/suscripciones" className="inline-flex items-center gap-2 bg-[#1A1F2E] text-white text-sm font-bold px-5 py-3 rounded-xl no-underline hover:opacity-90 transition-opacity">
            📢 {es ? 'Mis Grupos de Notificación' : 'My Notification Groups'}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}