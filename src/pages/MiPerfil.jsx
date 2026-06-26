import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, Edit3, Save, X, Bell, BellOff, Trash2, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';

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

function PersonaCard({ persona: p, es, onUnsub, subActiva }) {
  const st = ESTADO_LABEL[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso, color: 'bg-gray-100 text-gray-600' };
  return (
    <div className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1A1F2E] truncate">{p.nombre_completo}</p>
          <p className="text-xs text-gray-500 mt-0.5">{p.ultima_ubicacion_conocida} · {p.ciudad}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
            {es ? st.es : st.en}
          </span>
          {subActiva && onUnsub && (
            <button onClick={() => onUnsub(p.id)} title={es ? 'Dejar de seguir' : 'Unfollow'} className="text-gray-300 hover:text-[#B83A52] transition-colors">
              <BellOff size={14} />
            </button>
          )}
        </div>
      </div>
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
  const [notificaciones, setNotificaciones] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [subs, setSubs] = useState([]);
  const [personasSub, setPersonasSub] = useState([]);
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
        const [nots, mySubs, allPersonas, allReportes] = await Promise.all([
          base44.entities.NotificacionesUsuario.filter({ user_id: u.id }),
          base44.entities.Suscripciones.filter({ user_id: u.id }),
          base44.entities.PersonasBuscadas.filter({ created_by_id: u.id }),
          base44.entities.InfraestructuraSos.filter({ created_by_id: u.id }),
        ]);
        setNotificaciones(nots.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setSubs(mySubs);
        setBusquedas(allPersonas);
        setReportes(allReportes);

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
              <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
                {user?.role === 'admin' ? (es ? 'Administrador' : 'Admin') : (es ? 'Ciudadano' : 'Citizen')}
              </span>
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
            { n: busquedas.length, label: es ? 'Búsquedas' : 'Searches', color: 'text-[#D48C2E]' },
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
            { key: 'busquedas', icon: '🔎', es: 'Búsquedas', en: 'Searches' },
            { key: 'reportes', icon: '🚨', es: 'Reportes', en: 'Reports' },
            { key: 'suscripciones', icon: '⭐', es: 'Seguidos', en: 'Following' },
            { key: 'notificaciones', icon: '🔔', es: noLeidas > 0 ? `Avisos (${noLeidas})` : 'Avisos', en: noLeidas > 0 ? `Alerts (${noLeidas})` : 'Alerts' },
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
            {busquedas.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes búsquedas registradas.' : 'No searches registered.'}</p>
            ) : (
              busquedas.map(p => <PersonaCard key={p.id} persona={p} es={es} />)
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
      </div>
    </div>
  );
}