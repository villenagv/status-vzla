import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Loader2, RefreshCw, ShieldAlert, UserRound, HeartHandshake, Bell, FileText, Building2, Search, AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import AdminDataPanel from '@/components/admin/AdminDataPanel';

const SUPER_ADMIN_EMAIL = 'villenagv@gmail.com';

function StatCard({ icon: Icon, label, value, tone }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[tone] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} />
        <p className="text-[10px] font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyState({ icon, text, action }) {
  return (
    <div className="text-center py-8 bg-white border border-[#EDEBE8] rounded-xl">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-sm text-gray-500 mb-3">{text}</p>
      {action}
    </div>
  );
}

function RecordList({ items, es, kind }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.slice(0, 8).map(item => (
        <div key={item.id} className="bg-white border border-[#EDEBE8] rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1A1F2E] truncate">
                {item.nombre_completo || item.nombre_o_descripcion || item.nombre_lugar || item.tipo_reporte || item.tipo_estructura || (es ? 'Registro' : 'Record')}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                📍 {[item.ciudad, item.estado_region].filter(Boolean).join(', ') || (es ? 'Sin ubicación' : 'No location')}
              </p>
              {item.created_date && <p className="text-[10px] text-gray-400 mt-1">{new Date(item.created_date).toLocaleDateString(es ? 'es-VE' : 'en-US')}</p>}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
              {kind}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('usuario');
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    busquedas: [], encontrados: [], subs: [], notificaciones: [],
    registrosInst: [], listasInstitucionales: [], reportesSos: [], edificios: [],
  });

  useEffect(() => { init(); }, []);

  const safe = async (promise) => {
    try { return await promise; } catch { return []; }
  };

  const init = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      setUser(u);
      await cargarDatos(u);
    } catch {
      setUser(null);
    }
    setLoading(false);
  };

  const cargarDatos = async (u = user) => {
    if (!u) return;
    setRefreshing(true);
    const [busquedas, encontrados, subs, notificaciones, registrosInst, listasInstitucionales, reportesSos, edificios] = await Promise.all([
      safe(base44.entities.PersonasBuscadas.filter({ created_by_id: u.id }, '-created_date', 50)),
      safe(base44.entities.PersonasEncontradas.filter({ created_by_id: u.id }, '-created_date', 50)),
      safe(base44.entities.Suscripciones.filter({ user_id: u.id, activa: true }, '-created_date', 50)),
      safe(base44.entities.NotificacionesUsuario.filter({ user_id: u.id }, '-created_date', 50)),
      safe(base44.entities.PersonaRegistrada.filter({ created_by_id: u.id }, '-created_date', 50)),
      safe(base44.entities.RegistroInstitucional.filter({ responsable_user_id: u.id }, '-created_date', 50)),
      safe(base44.entities.InfraestructuraSos.filter({ created_by_id: u.id }, '-created_date', 50)),
      safe(base44.entities.ReportesDano.filter({ created_by_id: u.id }, '-created_date', 50)),
    ]);
    setData({ busquedas, encontrados, subs, notificaciones, registrosInst, listasInstitucionales, reportesSos, edificios });
    setRefreshing(false);
  };

  const esSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const esVoluntario = user?.role === 'voluntario' || user?.role === 'admin' || esSuperAdmin;
  const noLeidas = data.notificaciones.filter(n => !n.leida).length;

  if (loading) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={30} /></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-5"><ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}</Link>
        <div className="bg-white border border-[#EDEBE8] rounded-2xl p-5 text-center">
          <UserRound size={34} className="mx-auto text-gray-400 mb-3" />
          <h1 className="text-xl font-black text-[#1A1F2E] mb-2">{es ? 'Tu dashboard' : 'Your dashboard'}</h1>
          <p className="text-sm text-gray-500 mb-4">{es ? 'Inicia sesión para ver tus reportes, seguimientos y herramientas de voluntario.' : 'Log in to view your reports, follow-ups and volunteer tools.'}</p>
          <Link to="/login" className="block bg-[#1A1F2E] text-white font-bold py-3 rounded-xl text-sm no-underline">{es ? 'Entrar' : 'Login'}</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  const tabs = [
    { key: 'usuario', icon: UserRound, label: es ? 'Usuario' : 'User' },
    { key: 'voluntario', icon: HeartHandshake, label: es ? 'Voluntario' : 'Volunteer' },
    ...(esSuperAdmin ? [{ key: 'superadmin', icon: ShieldAlert, label: 'Super Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1A1F2E]"><ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}</Link>
          <button onClick={() => cargarDatos()} disabled={refreshing} className="flex items-center gap-1.5 text-xs font-bold bg-white border border-[#EDEBE8] rounded-xl px-3 py-2 text-gray-600 disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> {es ? 'Actualizar' : 'Refresh'}
          </button>
        </div>

        <section className="bg-[#1A1F2E] rounded-2xl p-4 mb-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-lg font-black">{user.full_name?.[0]?.toUpperCase() || '?'}</div>
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-lg truncate">{user.full_name || (es ? 'Usuario CRIS' : 'CRIS user')}</h1>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
              <p className="text-[10px] text-white/50 mt-1">{esVoluntario ? (es ? 'Puede operar herramientas de apoyo y voluntariado.' : 'Can operate support and volunteer tools.') : (es ? 'Dashboard ciudadano.' : 'Citizen dashboard.')}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <StatCard icon={Search} label={es ? 'Búsquedas' : 'Searches'} value={data.busquedas.length} tone="amber" />
          <StatCard icon={Bell} label={es ? 'Seguimientos' : 'Following'} value={data.subs.length} tone="green" />
          <StatCard icon={FileText} label={es ? 'Fichas' : 'Records'} value={data.registrosInst.length + data.encontrados.length} tone="blue" />
          <StatCard icon={AlertTriangle} label={es ? 'Alertas' : 'Alerts'} value={noLeidas} tone="red" />
        </div>

        <div className="flex rounded-xl overflow-hidden border border-[#EDEBE8] bg-white mb-5">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold ${tab === t.key ? 'bg-[#1A1F2E] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'usuario' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="space-y-3">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black text-[#1A1F2E]">{es ? 'Mis búsquedas' : 'My searches'}</h2><Link to="/buscar-persona" className="text-xs font-bold text-[#D48C2E]">+ {es ? 'Nueva' : 'New'}</Link></div>
              {data.busquedas.length ? <RecordList items={data.busquedas} es={es} kind={es ? 'Búsqueda' : 'Search'} /> : <EmptyState icon="🔎" text={es ? 'No tienes búsquedas registradas.' : 'No searches yet.'} action={<Link to="/buscar-persona" className="text-sm font-bold text-[#D48C2E]">{es ? 'Publicar búsqueda' : 'Post search'}</Link>} />}
            </section>
            <section className="space-y-3">
              <div className="flex items-center justify-between"><h2 className="text-sm font-black text-[#1A1F2E]">{es ? 'Mis reportes y seguimientos' : 'My reports and follow-ups'}</h2><Link to="/suscripciones" className="text-xs font-bold text-[#1A1F2E]">{es ? 'Ver grupos' : 'View groups'}</Link></div>
              {(data.encontrados.length + data.reportesSos.length + data.edificios.length) ? (
                <>
                  <RecordList items={data.encontrados} es={es} kind={es ? 'Encontrado' : 'Found'} />
                  <RecordList items={data.reportesSos} es={es} kind="SOS" />
                  <RecordList items={data.edificios} es={es} kind={es ? 'Edificio' : 'Building'} />
                </>
              ) : <EmptyState icon="📋" text={es ? 'Tus reportes aparecerán aquí.' : 'Your reports will appear here.'} action={<Link to="/reportar" className="text-sm font-bold text-[#B83A52]">{es ? 'Crear reporte' : 'Create report'}</Link>} />}
            </section>
          </div>
        )}

        {tab === 'voluntario' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h2 className="text-sm font-black text-green-900 mb-1">🤝 {es ? 'Herramientas de voluntario' : 'Volunteer tools'}</h2>
              <p className="text-xs text-green-800 leading-relaxed">{es ? 'Puedes ayudar subiendo listas institucionales, reportando personas encontradas y actualizando información útil. Tus datos quedan como responsable privado si estás logeado.' : 'You can help by uploading institutional lists, reporting found people and updating useful information. Your data stays as the private responsible contact when logged in.'}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link to="/registro-institucional" className="bg-[#0F766E] text-white rounded-xl p-3 text-center no-underline text-xs font-bold"><span className="block text-xl mb-1">📋</span>{es ? 'Subir listado' : 'Upload list'}</Link>
              <Link to="/reportar-encontrado" className="bg-[#6C3483] text-white rounded-xl p-3 text-center no-underline text-xs font-bold"><span className="block text-xl mb-1">🙋</span>{es ? 'Reportar encontrado' : 'Report found'}</Link>
              <Link to="/reportar-dano" className="bg-[#B83A52] text-white rounded-xl p-3 text-center no-underline text-xs font-bold"><span className="block text-xl mb-1">🏗️</span>{es ? 'Edificio dañado' : 'Damaged building'}</Link>
              <Link to="/portal-voluntario" className="bg-[#1A1F2E] text-white rounded-xl p-3 text-center no-underline text-xs font-bold"><span className="block text-xl mb-1">⚙️</span>{es ? 'Portal completo' : 'Full portal'}</Link>
            </div>
            <section>
              <h2 className="text-sm font-black text-[#1A1F2E] mb-3">{es ? 'Listas y fichas que ayudaste a cargar' : 'Lists and records you helped upload'}</h2>
              {(data.registrosInst.length + data.listasInstitucionales.length) ? (
                <>
                  <RecordList items={data.listasInstitucionales} es={es} kind={es ? 'Lista' : 'List'} />
                  <RecordList items={data.registrosInst} es={es} kind={es ? 'Ficha' : 'Record'} />
                </>
              ) : <EmptyState icon="🤝" text={es ? 'Todavía no has cargado listas o fichas como voluntario.' : 'No volunteer lists or records uploaded yet.'} action={<Link to="/registro-institucional" className="text-sm font-bold text-[#0F766E]">{es ? 'Empezar a ayudar' : 'Start helping'}</Link>} />}
            </section>
          </div>
        )}

        {tab === 'superadmin' && esSuperAdmin && (
          <section className="bg-white border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <ShieldAlert className="text-red-600 flex-shrink-0" size={22} />
              <div>
                <h2 className="text-lg font-black text-red-900">Super Admin</h2>
                <p className="text-xs text-red-700 leading-relaxed">Solo {SUPER_ADMIN_EMAIL}. Permite borrar registros y quitar fotos visibles de personas, edificios, puntos de ayuda y reportes.</p>
              </div>
            </div>
            <AdminDataPanel es={es} />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}