import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, BellOff, Plus, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';

export default function Suscripciones() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const todos = await base44.entities.GruposNotificacion.list('-created_date', 50);
        setGrupos(todos);
      } catch { window.location.href = '/login'; }
      setCargando(false);
    };
    init();
  }, []);

  const yaSuscrito = (g) => g.suscriptores?.includes(user?.email);

  const toggleSuscripcion = async (grupo) => {
    const ya = yaSuscrito(grupo);
    const emailsNuevos = ya
      ? (grupo.suscriptores || []).filter(e => e !== user?.email)
      : [...(grupo.suscriptores || []), user?.email].filter(Boolean);
    await base44.entities.GruposNotificacion.update(grupo.id, { suscriptores: emailsNuevos });
    setGrupos(prev => prev.map(g => g.id === grupo.id ? { ...g, suscriptores: emailsNuevos } : g));
    showMsg(es ? (ya ? 'Suscripción cancelada.' : '¡Suscrito al grupo!') : ya ? 'Unsubscribed.' : 'Subscribed to group!');
  };

  const crearGrupo = async () => {
    if (!nuevoGrupo.trim()) return;
    setCreando(true);
    try {
      const nuevo = await base44.entities.GruposNotificacion.create({
        nombre: nuevoGrupo.trim(),
        descripcion: '',
        entidad_ids: [],
        suscriptores: user?.email ? [user.email] : [],
      });
      setGrupos(prev => [nuevo, ...prev]);
      setNuevoGrupo('');
      showMsg(es ? 'Grupo creado.' : 'Group created.');
    } catch {}
    setCreando(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/mi-perfil" className="inline-flex items-center gap-1 text-sm text-gray-400 mb-4 hover:text-gray-700">
          <ChevronLeft size={15} /> {es ? 'Mi Perfil' : 'My Profile'}
        </Link>

        {msg && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 mb-3">{msg}</div>}

        <h1 className="text-xl font-bold text-gray-900 mb-1">{es ? '📢 Mis Grupos de Notificación' : '📢 My Notification Groups'}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {es
            ? 'Únete a grupos para recibir notificaciones sobre personas y edificios relacionados. Recibirás un email cada vez que alguien actualice un caso del grupo.'
            : 'Join groups to receive notifications about related people and buildings. You\'ll get an email every time someone updates a case in the group.'}
        </p>

        {/* Crear grupo */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex gap-2">
          <input value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)}
            placeholder={es ? 'Nombre del grupo (ej: Familiares Yaracuy)' : 'Group name (e.g: Yaracuy families)'}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400"
            onKeyDown={e => e.key === 'Enter' && crearGrupo()} />
          <button onClick={crearGrupo} disabled={creando || !nuevoGrupo.trim()}
            className="bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-40 hover:bg-blue-800 cursor-pointer">
            {creando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {es ? 'Crear' : 'Create'}
          </button>
        </div>

        {grupos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-2">{es ? 'No hay grupos disponibles.' : 'No groups available.'}</p>
            <p className="text-xs text-gray-300">{es ? 'Crea el primero con el campo de arriba.' : 'Create the first one above.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {grupos.map(g => (
              <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 text-left">{g.nombre}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    👥 {g.suscriptores?.length || 0} {es ? 'miembros' : 'members'}
                  </p>
                </div>
                <button onClick={() => toggleSuscripcion(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${yaSuscrito(g) ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                  {yaSuscrito(g) ? <BellOff size={12} /> : <Bell size={12} />}
                  {yaSuscrito(g) ? (es ? 'Salir' : 'Leave') : (es ? 'Unirse' : 'Join')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}