import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, Building2, FileText, MapPin, UserCheck, Bell, Mail, UserPlus, HeartHandshake, BellRing } from 'lucide-react';

const StatCard = ({ title, value, icon, loading, color = 'blue', subtitle }) => {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100'  },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100'},
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100'},
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100'},
    teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white border ${c.border} p-4 rounded-xl flex items-start gap-3`}>
      <div className={`p-2.5 rounded-xl ${c.bg} ${c.text} flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 leading-tight">{title}</p>
        {loading
          ? <Loader2 className="animate-spin text-gray-400 mt-1" size={18} />
          : <p className={`text-2xl font-black ${c.text} leading-tight mt-0.5`}>{(value || 0).toLocaleString()}</p>
        }
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{subtitle}</p>}
      </div>
    </div>
  );
};

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getAdminStats', {});
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const statItems = [
    { title: 'Usuarios registrados',     key: 'usuariosRegistrados',  icon: <UserPlus size={18}/>,      color: 'blue',   subtitle: 'Con cuenta activa' },
    { title: 'Voluntarios aprobados',    key: 'voluntariosActivos',   icon: <HeartHandshake size={18}/>, color: 'green',  subtitle: 'Estado: aprobado' },
    { title: 'Emails enviados',          key: 'emailsEnviados',       icon: <Mail size={18}/>,           color: 'purple', subtitle: 'Total histórico' },
    { title: 'Suscriptores edificios',   key: 'suscriptoresEdificios',icon: <BellRing size={18}/>,       color: 'teal',   subtitle: 'Siguen un edificio' },
    { title: 'Personas (CRIS)',          key: 'personas',             icon: <Users size={18}/>,          color: 'amber',  subtitle: 'En base CRIS' },
    { title: 'Reportes de daño',         key: 'reportesDano',         icon: <Building2 size={18}/>,      color: 'red',    subtitle: 'Edificios reportados' },
    { title: 'Puntos de ayuda',          key: 'puntosAyuda',          icon: <MapPin size={18}/>,         color: 'teal',   subtitle: 'Activos / verificados' },
    { title: 'Personas encontradas',     key: 'encontrados',          icon: <UserCheck size={18}/>,      color: 'green',  subtitle: 'Registros encontrados' },
    { title: 'Alertas familiares',       key: 'alertas',              icon: <Bell size={18}/>,           color: 'amber',  subtitle: 'Avisos enviados' },
    { title: 'Solicitudes info',         key: 'solicitudes',          icon: <FileText size={18}/>,       color: 'blue',   subtitle: 'Edificios solicitados' },
  ];

  const [normalizando, setNormalizando] = useState(false);
  const [normResult, setNormResult] = useState(null);

  const normalizarCiudades = async () => {
    setNormalizando(true);
    setNormResult(null);
    try {
      const res = await base44.functions.invoke('normalizarCiudades', {});
      setNormResult(res.data);
    } catch (e) {
      setNormResult({ error: e.message });
    }
    setNormalizando(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">📊 Estadísticas en tiempo real</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {lastUpdated && <span className="text-[10px] text-gray-400">Actualizado {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={normalizarCiudades} disabled={normalizando}
            className="text-xs text-teal-700 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 cursor-pointer hover:bg-teal-100">
            {normalizando ? <Loader2 size={12} className="animate-spin inline" /> : '🏙️'} Normalizar ciudades
          </button>
          {normResult && !normResult.error && (
            <span className="text-[10px] text-teal-700 font-semibold">✅ {normResult.total_normalizados} corregidos</span>
          )}
          {normResult?.error && (
            <span className="text-[10px] text-red-600 font-semibold">❌ {normResult.error}</span>
          )}
          <button onClick={fetchStats} disabled={loading}
            className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 cursor-pointer hover:bg-blue-100">
            {loading ? <Loader2 size={12} className="animate-spin inline" /> : '↻'} Actualizar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {statItems.map(item => (
          <StatCard
            key={item.key}
            title={item.title}
            value={stats?.[item.key]}
            icon={item.icon}
            loading={loading}
            color={item.color}
            subtitle={item.subtitle}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminStats;