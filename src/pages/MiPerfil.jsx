import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, Search, AlertTriangle, LogOut, User, Loader2, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const [nots, mySubs] = await Promise.all([
          base44.entities.NotificacionesUsuario.filter({ user_id: u.id }),
          base44.entities.Suscripciones.filter({ user_id: u.id }),
        ]);
        setNotificaciones(nots.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setSubs(mySubs);

        // Load personas for subscriptions
        const personasIds = [...new Set(mySubs.map(s => s.persona_id))];
        if (personasIds.length > 0) {
          const todas = await base44.entities.PersonasBuscadas.list();
          setPersonasSub(todas.filter(p => personasIds.includes(p.id)));
        }

        // Load user's own reports and searches
        const [allPersonas, allReportes] = await Promise.all([
          base44.entities.PersonasBuscadas.filter({ created_by_id: u.id }),
          base44.entities.InfraestructuraSos.filter({ created_by_id: u.id }),
        ]);
        setBusquedas(allPersonas);
        setReportes(allReportes);
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

        {/* User header */}
        <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1A1F2E] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1A1F2E] truncate">{user?.full_name || (es ? 'Usuario' : 'User')}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
              {user?.role === 'admin' ? (es ? 'Administrador' : 'Admin') : (es ? 'Ciudadano' : 'Citizen')}
            </span>
          </div>
          <button
            onClick={() => base44.auth.logout('/')}
            className="text-gray-400 hover:text-[#B83A52] transition-colors p-2"
            title={es ? 'Cerrar sesión' : 'Sign out'}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[#EDEBE8] mb-4 bg-white text-sm">
          {[
            { key: 'busquedas', icon: '🔎', es: 'Búsquedas', en: 'Searches' },
            { key: 'reportes', icon: '🚨', es: 'Reportes', en: 'Reports' },
            { key: 'suscripciones', icon: '⭐', es: 'Seguidos', en: 'Following' },
            { key: 'notificaciones', icon: '🔔', es: `Avisos${noLeidas > 0 ? ` (${noLeidas})` : ''}`, en: `Alerts${noLeidas > 0 ? ` (${noLeidas})` : ''}` },
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
            {busquedas.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes búsquedas registradas.' : 'No searches registered.'}</p>
            )}
            {busquedas.map(p => (
              <PersonaCard key={p.id} persona={p} es={es} />
            ))}
          </div>
        )}

        {/* Tab: Reportes de daño */}
        {tab === 'reportes' && (
          <div className="space-y-3">
            <Link to="/reportar" className="flex items-center gap-2 justify-center w-full border-2 border-dashed border-[#EDEBE8] rounded-xl py-3 text-sm text-gray-400 hover:border-[#1A1F2E] hover:text-[#1A1F2E] transition-colors">
              + {es ? 'Nuevo reporte' : 'New report'}
            </Link>
            {reportes.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes reportes registrados.' : 'No reports registered.'}</p>
            )}
            {reportes.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                <p className="font-semibold text-sm text-[#1A1F2E]">{r.tipo_reporte}</p>
                <p className="text-xs text-gray-500">{r.direccion || r.ciudad}, {r.estado_region}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${r.prioridad === 'critica' ? 'bg-red-100 text-red-700' : r.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                  {r.prioridad || 'normal'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Suscripciones */}
        {tab === 'suscripciones' && (
          <div className="space-y-3">
            {personasSub.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No sigues ninguna búsqueda todavía.' : 'You are not following any search yet.'}</p>
            )}
            {personasSub.map(p => (
              <PersonaCard key={p.id} persona={p} es={es} />
            ))}
          </div>
        )}

        {/* Tab: Notificaciones */}
        {tab === 'notificaciones' && (
          <div className="space-y-2">
            {notificaciones.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">{es ? 'No tienes notificaciones.' : 'No notifications.'}</p>
            )}
            {notificaciones.map(n => (
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
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonaCard({ persona: p, es }) {
  const st = ESTADO_LABEL[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso, color: 'bg-gray-100 text-gray-600' };
  return (
    <div className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-[#1A1F2E]">{p.nombre_completo}</p>
          <p className="text-xs text-gray-500">{p.ultima_ubicacion_conocida} · {p.ciudad}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>
          {es ? st.es : st.en}
        </span>
      </div>
    </div>
  );
}