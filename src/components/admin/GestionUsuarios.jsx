import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, ShieldOff, ChevronDown, ChevronUp, RefreshCw, Search } from 'lucide-react';

const ACTIVIDAD_LABELS = {
  busqueda_persona:        { es: 'Buscó persona',        en: 'Searched person'      },
  consulta_edificio:       { es: 'Consultó edificio',    en: 'Checked building'     },
  reporte_creado:          { es: 'Creó reporte',         en: 'Created report'       },
  actualizacion_realizada: { es: 'Actualizó registro',   en: 'Updated record'       },
  persona_encontrada:      { es: 'Reportó encontrado',   en: 'Reported found'       },
  suscripcion_agregada:    { es: 'Se suscribió',         en: 'Subscribed'           },
};

function ActividadModal({ userId, userName, es, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    base44.entities.HistorialUsuario.filter({ user_id: userId }, '-created_date', 50)
      .then(d => setHistorial(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">{es ? 'Actividad de' : 'Activity for'} {userName}</p>
            <p className="text-xs text-gray-400">{es ? 'Últimas 50 acciones' : 'Last 50 actions'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {cargando ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : historial.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">{es ? 'Sin actividad registrada.' : 'No activity recorded.'}</p>
          ) : historial.map(h => {
            const lbl = ACTIVIDAD_LABELS[h.tipo_accion] || { es: h.tipo_accion, en: h.tipo_accion };
            return (
              <div key={h.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{es ? lbl.es : lbl.en}</p>
                  {h.entidad_nombre && <p className="text-[10px] text-gray-500 truncate">{h.entidad_nombre}</p>}
                  {h.ciudad && <p className="text-[10px] text-gray-400">📍 {h.ciudad}</p>}
                </div>
                <p className="text-[10px] text-gray-400 flex-shrink-0">{new Date(h.created_date).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, perfil, es, onRoleChange }) {
  const [cambiando, setCambiando] = useState(false);
  const [verActividad, setVerActividad] = useState(false);
  const isAdmin = u.role === 'admin';

  const toggleRol = async () => {
    if (!confirm(es
      ? `¿${isAdmin ? 'Quitar admin de' : 'Dar admin a'} ${u.full_name || u.email}?`
      : `${isAdmin ? 'Remove admin from' : 'Make admin'} ${u.full_name || u.email}?`)) return;
    setCambiando(true);
    try {
      await base44.functions.invoke('actualizarRolUsuario', { targetUserId: u.id, nuevoRol: isAdmin ? 'user' : 'admin' });
      onRoleChange(u.id, isAdmin ? 'user' : 'admin');
    } catch {}
    setCambiando(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: isAdmin ? '#1D4ED8' : '#6B7280' }}>
          {(u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name || '—'}</p>
          <p className="text-xs text-gray-400 truncate">{u.email}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              {isAdmin ? (es ? 'Admin' : 'Admin') : (es ? 'Usuario' : 'User')}
            </span>
            {perfil && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${perfil.tipo_perfil === 'ingeniero' ? 'bg-purple-100 text-purple-800' : perfil.tipo_perfil === 'arquitecto' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}`}>
                {perfil.tipo_perfil}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setVerActividad(true)}
            className="text-[10px] font-semibold text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
            {es ? 'Actividad' : 'Activity'}
          </button>
          <button onClick={toggleRol} disabled={cambiando}
            title={isAdmin ? (es ? 'Quitar admin' : 'Remove admin') : (es ? 'Dar admin' : 'Make admin')}
            className={`p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 transition-colors ${isAdmin ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
            {cambiando ? <Loader2 size={13} className="animate-spin" /> : isAdmin ? <ShieldOff size={13} /> : <Shield size={13} />}
          </button>
        </div>
      </div>
      {verActividad && <ActividadModal userId={u.id} userName={u.full_name || u.email} es={es} onClose={() => setVerActividad(false)} />}
    </>
  );
}

export default function GestionUsuarios({ es = true }) {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [soloPerfil, setSoloPerfil] = useState('todos');

  const cargar = async () => {
    setCargando(true);
    try {
      const [users, profs] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.entities.PerfilProfesional.list('-created_date', 500),
      ]);
      setUsuarios(users || []);
      const map = {};
      (profs || []).forEach(p => { map[p.user_id] = p; });
      setPerfiles(map);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleRoleChange = (uid, nuevoRol) => {
    setUsuarios(prev => prev.map(u => u.id === uid ? { ...u, role: nuevoRol } : u));
  };

  const filtrados = usuarios.filter(u => {
    const q = filtro.toLowerCase();
    const matchQ = !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchPerfil = soloPerfil === 'todos'
      ? true
      : soloPerfil === 'admin' ? u.role === 'admin'
      : perfiles[u.id]?.tipo_perfil === soloPerfil;
    return matchQ && matchPerfil;
  });

  const admins = usuarios.filter(u => u.role === 'admin').length;

  return (
    <div>
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-gray-800">{usuarios.length}</p>
          <p className="text-[10px] text-gray-500">{es ? 'Total usuarios' : 'Total users'}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-700">{admins}</p>
          <p className="text-[10px] text-blue-600">{es ? 'Admins' : 'Admins'}</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-teal-700">{Object.keys(perfiles).length}</p>
          <p className="text-[10px] text-teal-600">{es ? 'Con perfil' : 'With profile'}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-0 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder={es ? 'Buscar por nombre o email...' : 'Search by name or email...'}
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 min-w-0" />
        </div>
        <button onClick={cargar} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer">
          <RefreshCw size={13} className={cargando ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Chips de filtro */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { key: 'todos', es: `Todos (${usuarios.length})`, en: `All (${usuarios.length})` },
          { key: 'admin', es: `Admins (${admins})`, en: `Admins (${admins})` },
          { key: 'voluntario', es: 'Voluntarios', en: 'Volunteers' },
          { key: 'ingeniero', es: 'Ingenieros', en: 'Engineers' },
          { key: 'arquitecto', es: 'Arquitectos', en: 'Architects' },
        ].map(chip => (
          <button key={chip.key} onClick={() => setSoloPerfil(chip.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${soloPerfil === chip.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {es ? chip.es : chip.en}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">{es ? 'Sin resultados.' : 'No results.'}</div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(u => (
            <UserRow key={u.id} u={u} perfil={perfiles[u.id]} es={es} onRoleChange={handleRoleChange} />
          ))}
        </div>
      )}
    </div>
  );
}