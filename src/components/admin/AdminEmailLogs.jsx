import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Mail, Search, RefreshCw, ChevronDown, ChevronUp, Building2, User, Home, Settings } from 'lucide-react';

// ── Clasificación de tipos (matchea entidad LogNotificaciones) ──
const TIPO_CONFIG = {
  edificio: { label: 'Edificio', icon: Building2, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  persona:  { label: 'Persona',  icon: User,      color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  refugio:  { label: 'Refugio',  icon: Home,      color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  sistema:  { label: 'Sistema',  icon: Settings,  color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
};

// ── Etiquetas legibles para cada acción / condición de envío ──
const ACCION_LABELS = {
  email_apoyo_familiar:       '🆘 Apoyo a familiar',
  actualizacion:              '🔄 Actualización de edificio',
  tengo_actualizacion:        '🔄 Nueva actualización',
  confirmo_mismo_estado:      '✅ Estado confirmado',
  informacion_incorrecta:     '⚠️ Info incorrecta',
  reportar_urgencia:          '🚨 Urgencia reportada',
  nuevo_nivel_dano:           '📍 Nivel de daño actualizado',
  personas_atrapadas:         '🆘 Personas atrapadas',
  persona_herida_recuperada:  '🩹 Herido recuperado',
  persona_fallecida_recuperada:'⚫ Fallecido recuperado',
  riesgo_marcado:             '💨 Riesgo marcado',
  estado_cambiado:            '📋 Estado cambiado',
  verificado:                 '🏛️ Verificado',
  email_aviso_familiar:       '📱 Aviso a familiar',
  notificacion_duplicado:     '🔗 Registro unificado',
  notificacion_coincidencia:  '🔍 Posible coincidencia',
};

function accionLabel(a) {
  return ACCION_LABELS[a] || (a ? `📧 ${a.replace(/_/g, ' ')}` : '📧 Email');
}

function fechaCorta(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function LogCard({ log }) {
  const [open, setOpen] = useState(false);
  const tipoCfg = TIPO_CONFIG[log.tipo] || TIPO_CONFIG.sistema;
  const Icon = tipoCfg.icon;

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background: tipoCfg.bg, border: `1px solid ${tipoCfg.border}` }}>
          <Icon size={16} style={{ color: tipoCfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">{accionLabel(log.accion)}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: tipoCfg.bg, color: tipoCfg.color, border: `1px solid ${tipoCfg.border}` }}>
              {tipoCfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {log.entidad_nombre || 'Sin nombre'} · {log.emails_enviados || 0} email{(log.emails_enviados || 0) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-gray-400">{fechaCorta(log.created_date)}</span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-400">Tipo:</span> <strong className="text-gray-700">{tipoCfg.label}</strong></div>
            <div><span className="text-gray-400">Acción:</span> <strong className="text-gray-700">{log.accion || '—'}</strong></div>
            <div><span className="text-gray-400">Emails enviados:</span> <strong className="text-gray-700">{log.emails_enviados ?? 0}</strong></div>
            <div><span className="text-gray-400">Entidad ID:</span> <strong className="text-gray-700 break-all">{log.entidad_id || '—'}</strong></div>
          </div>
          {log.entidad_nombre && (
            <p className="text-xs"><span className="text-gray-400">Nombre del sitio/persona:</span> <strong className="text-gray-700">{log.entidad_nombre}</strong></p>
          )}
          {log.detalles && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Detalles</p>
              <p className="text-xs text-gray-700 leading-relaxed break-words">{log.detalles}</p>
            </div>
          )}
          {log.entidad_id && log.tipo === 'edificio' && (
            <a href={`/edificio?id=${log.entidad_id}`} target="_blank" rel="noopener noreferrer"
              className="inline-block text-xs font-bold text-blue-600 hover:underline">Ver ficha del edificio →</a>
          )}
          {log.entidad_id && log.tipo === 'persona' && (
            <a href={`/persona?id=${log.entidad_id}`} target="_blank" rel="noopener noreferrer"
              className="inline-block text-xs font-bold text-purple-600 hover:underline">Ver ficha de la persona →</a>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroAccion, setFiltroAccion] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [limite, setLimite] = useState(100);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.LogNotificaciones.list('-created_date', limite);
      setLogs(data || []);
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [limite]);

  // Acciones únicas presentes en los datos
  const accionesDisponibles = [...new Set(logs.map(l => l.accion).filter(Boolean))];

  const filtrados = logs.filter(l => {
    if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
    if (filtroAccion !== 'todas' && l.accion !== filtroAccion) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const hay = [l.entidad_nombre, l.detalles, l.accion, l.entidad_id].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Métricas
  const totalEmails = logs.reduce((acc, l) => acc + (l.emails_enviados || 0), 0);
  const porTipo = Object.keys(TIPO_CONFIG).map(t => ({
    tipo: t,
    count: logs.filter(l => l.tipo === t).length,
    emails: logs.filter(l => l.tipo === t).reduce((a, l) => a + (l.emails_enviados || 0), 0),
  }));

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Mail size={18} className="text-blue-600" /> Emails enviados — Registro completo
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Todos los correos enviados por la plataforma, clasificados por tipo y condición de envío.</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-gray-900">{totalEmails}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Emails totales</p>
        </div>
        {porTipo.map(p => {
          const cfg = TIPO_CONFIG[p.tipo];
          return (
            <div key={p.tipo} className="rounded-xl p-3 text-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <p className="text-2xl font-black" style={{ color: cfg.color }}>{p.emails}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email, detalle, ID..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
        </div>
        {/* Filtro por tipo */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clasificar por tipo</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setFiltroTipo('todos')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${filtroTipo === 'todos' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              Todos ({logs.length})
            </button>
            {Object.entries(TIPO_CONFIG).map(([t, cfg]) => {
              const count = logs.filter(l => l.tipo === t).length;
              return (
                <button key={t} onClick={() => setFiltroTipo(t)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${filtroTipo === t ? 'text-white border-transparent' : 'bg-white hover:border-gray-400'}`}
                  style={filtroTipo === t ? { background: cfg.color } : { color: cfg.color, borderColor: cfg.border }}>
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
        {/* Filtro por acción / condición */}
        {accionesDisponibles.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clasificar por condición de envío</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFiltroAccion('todas')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filtroAccion === 'todas' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                Todas
              </button>
              {accionesDisponibles.map(a => (
                <button key={a} onClick={() => setFiltroAccion(a)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filtroAccion === a ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                  {accionLabel(a)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-sm text-gray-500">No hay emails que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">{filtrados.length} registro{filtrados.length === 1 ? '' : 's'}</p>
          {filtrados.map(log => <LogCard key={log.id} log={log} />)}
          {logs.length >= limite && (
            <button onClick={() => setLimite(l => l + 100)}
              className="w-full bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors mt-2">
              Ver más resultados
            </button>
          )}
        </div>
      )}
    </div>
  );
}