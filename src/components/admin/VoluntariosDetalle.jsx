import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Mail, Phone, CheckCircle, XCircle, Clock, Search, RefreshCw } from 'lucide-react';

const TIPO_COLOR = {
  ingeniero:  'bg-purple-100 text-purple-800',
  arquitecto: 'bg-indigo-100 text-indigo-800',
  voluntario: 'bg-teal-100 text-teal-800',
};

const ESTADO_COLOR = {
  aprobado:  'bg-green-100 text-green-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  rechazado: 'bg-red-100 text-red-800',
};

function VoluntarioCard({ sol, perfil, es, onApprobar, onRechazar }) {
  const [expanded, setExpanded] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const aprobar = async () => {
    setProcesando(true);
    try {
      await base44.functions.invoke('gestionarVoluntario', { solicitudId: sol.id, accion: 'aprobar' });
      onApprobar(sol.id);
    } catch {}
    setProcesando(false);
  };

  const rechazar = async () => {
    const motivo = prompt(es ? 'Motivo del rechazo (opcional):' : 'Rejection reason (optional):') || '';
    setProcesando(true);
    try {
      await base44.functions.invoke('gestionarVoluntario', { solicitudId: sol.id, accion: 'rechazar', motivo });
      onRechazar(sol.id);
    } catch {}
    setProcesando(false);
  };

  const estadoIcon = sol.estado === 'aprobado' ? <CheckCircle size={12} className="text-green-600" /> : sol.estado === 'rechazado' ? <XCircle size={12} className="text-red-500" /> : <Clock size={12} className="text-yellow-500" />;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-teal-600">
          {(sol.user_nombre?.[0] || sol.user_email?.[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{sol.user_nombre || '—'}</p>
          <p className="text-xs text-gray-400 truncate">{sol.user_email}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {perfil && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR[perfil.tipo_perfil] || 'bg-gray-100 text-gray-600'}`}>
              {perfil.tipo_perfil}
            </span>
          )}
          <div className="flex items-center gap-1">
            {estadoIcon}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLOR[sol.estado] || 'bg-gray-100 text-gray-600'}`}>
              {es ? (sol.estado === 'aprobado' ? 'Aprobado' : sol.estado === 'rechazado' ? 'Rechazado' : 'Pendiente')
                   : (sol.estado === 'aprobado' ? 'Approved' : sol.estado === 'rechazado' ? 'Rejected' : 'Pending')}
            </span>
          </div>
          <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50">
          {/* Datos de contacto */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              🔒 {es ? 'Datos de contacto (privados)' : 'Contact data (private)'}
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Mail size={11} className="text-gray-400 flex-shrink-0" />
                <a href={`mailto:${sol.user_email}`} className="hover:underline truncate">{sol.user_email}</a>
              </div>
              {sol.institucion_nombre && (
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 text-[10px] flex-shrink-0">🏢</span>
                  <span className="truncate">{sol.institucion_nombre} {sol.institucion_tipo ? `· ${sol.institucion_tipo}` : ''}</span>
                </div>
              )}
              {perfil?.especialidad && (
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 text-[10px] flex-shrink-0">⚙️</span>
                  <span className="truncate">{perfil.especialidad}</span>
                </div>
              )}
              {perfil?.numero_colegio && (
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 text-[10px] flex-shrink-0">🪪</span>
                  <span>Nº {perfil.numero_colegio}</span>
                </div>
              )}
            </div>
          </div>

          {/* Foto ID */}
          {sol.foto_id_url && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                {es ? 'Documento de identidad' : 'Identity document'}
              </p>
              <img src={sol.foto_id_url} alt="ID" className="w-28 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer"
                onClick={() => window.open(sol.foto_id_url, '_blank')} />
            </div>
          )}

          {/* Notas admin */}
          {sol.notas_admin && (
            <p className="text-xs text-gray-500 italic">{sol.notas_admin}</p>
          )}
          {sol.motivo_rechazo && (
            <p className="text-xs text-red-500">⚠️ {sol.motivo_rechazo}</p>
          )}

          {/* Acciones */}
          {sol.estado === 'pendiente' && (
            <div className="flex gap-2 pt-1">
              <button onClick={aprobar} disabled={procesando}
                className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer hover:bg-green-700">
                {procesando ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                {es ? 'Aprobar' : 'Approve'}
              </button>
              <button onClick={rechazar} disabled={procesando}
                className="flex-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer hover:bg-red-100">
                {procesando ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                {es ? 'Rechazar' : 'Reject'}
              </button>
            </div>
          )}

          <p className="text-[10px] text-gray-400">{es ? 'Solicitud:' : 'Request:'} {new Date(sol.created_date).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

export default function VoluntariosDetalle({ es = true }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtro, setFiltro] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const [sols, profs] = await Promise.all([
        base44.entities.SolicitudVoluntario.list('-created_date', 300),
        base44.entities.PerfilProfesional.list('-created_date', 500),
      ]);
      setSolicitudes(sols || []);
      const map = {};
      (profs || []).forEach(p => { map[p.user_id] = p; });
      setPerfiles(map);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const aprobados  = solicitudes.filter(s => s.estado === 'aprobado').length;
  const rechazados = solicitudes.filter(s => s.estado === 'rechazado').length;

  const filtradas = solicitudes.filter(s => {
    const matchEstado = filtroEstado === 'todos' || s.estado === filtroEstado;
    const q = filtro.toLowerCase();
    const matchQ = !q || (s.user_nombre || '').toLowerCase().includes(q) || (s.user_email || '').toLowerCase().includes(q) || (s.institucion_nombre || '').toLowerCase().includes(q);
    return matchEstado && matchQ;
  });

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center cursor-pointer" onClick={() => setFiltroEstado('pendiente')}>
          <p className="text-2xl font-black text-yellow-700">{pendientes}</p>
          <p className="text-[10px] text-yellow-600">{es ? 'Pendientes' : 'Pending'}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center cursor-pointer" onClick={() => setFiltroEstado('aprobado')}>
          <p className="text-2xl font-black text-green-700">{aprobados}</p>
          <p className="text-[10px] text-green-600">{es ? 'Aprobados' : 'Approved'}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center cursor-pointer" onClick={() => setFiltroEstado('rechazado')}>
          <p className="text-2xl font-black text-red-600">{rechazados}</p>
          <p className="text-[10px] text-red-500">{es ? 'Rechazados' : 'Rejected'}</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder={es ? 'Buscar voluntario...' : 'Search volunteer...'}
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400" />
        </div>
        <button onClick={cargar} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer">
          <RefreshCw size={13} className={cargando ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { key: 'pendiente', es: `⏳ Pendientes (${pendientes})`, en: `⏳ Pending (${pendientes})` },
          { key: 'aprobado',  es: `✅ Aprobados (${aprobados})`,  en: `✅ Approved (${aprobados})`  },
          { key: 'rechazado', es: `❌ Rechazados (${rechazados})`, en: `❌ Rejected (${rechazados})` },
          { key: 'todos',     es: `Todos (${solicitudes.length})`, en: `All (${solicitudes.length})`  },
        ].map(chip => (
          <button key={chip.key} onClick={() => setFiltroEstado(chip.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filtroEstado === chip.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {es ? chip.es : chip.en}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">{es ? 'Sin voluntarios en este filtro.' : 'No volunteers for this filter.'}</div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(s => (
            <VoluntarioCard key={s.id} sol={s} perfil={perfiles[s.user_id]} es={es}
              onApprobar={id => setSolicitudes(prev => prev.map(x => x.id === id ? { ...x, estado: 'aprobado' } : x))}
              onRechazar={id => setSolicitudes(prev => prev.map(x => x.id === id ? { ...x, estado: 'rechazado' } : x))}
            />
          ))}
        </div>
      )}
    </div>
  );
}