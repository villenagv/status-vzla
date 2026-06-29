import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle, XCircle, Copy, Check, Trash2, Plus, Link as LinkIcon } from 'lucide-react';

const ESTADO_BADGE = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  aprobado:  'bg-green-100 text-green-800 border-green-200',
  rechazado: 'bg-red-100 text-red-800 border-red-200',
};

function SolicitudCard({ sol, es, onAprobar, onRechazar, procesando }) {
  const [motivo, setMotivo] = useState('');
  const [rechazando, setRechazando] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">{sol.user_nombre || sol.user_email}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[sol.estado] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {sol.estado === 'pendiente' ? (es ? '⏳ Pendiente' : '⏳ Pending')
               : sol.estado === 'aprobado' ? (es ? '✅ Aprobado' : '✅ Approved')
               : (es ? '❌ Rechazado' : '❌ Rejected')}
            </span>
            {sol.pre_aprobado && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                🔗 {es ? 'Pre-aprobado' : 'Pre-approved'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{sol.user_email}</p>
          {sol.institucion_nombre && (
            <p className="text-xs text-gray-500 mt-0.5">🏢 {sol.institucion_nombre}</p>
          )}
          {sol.telefono_contacto && (
            <p className="text-xs text-gray-500 mt-0.5">📞 {sol.telefono_contacto}</p>
          )}
          {sol.rol_solicitado && sol.rol_solicitado !== 'voluntario' && (
            <p className="text-xs font-semibold mt-0.5" style={{ color: sol.rol_solicitado === 'ingeniero' ? '#1d4ed8' : '#7c3aed' }}>
              {sol.rol_solicitado === 'ingeniero' ? '⚙️ Ingeniero' : '📐 Arquitecto'}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(sol.created_date).toLocaleDateString()}</p>
        </div>

        {sol.foto_id_url && (
          <a href={sol.foto_id_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
            <img src={sol.foto_id_url} alt="ID" className="w-14 h-14 object-cover rounded-lg border border-gray-200 hover:opacity-80" />
          </a>
        )}
      </div>

      {sol.estado === 'pendiente' && (
        <>
          {rechazando ? (
            <div className="space-y-2">
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={2}
                placeholder={es ? 'Motivo del rechazo (opcional)...' : 'Reason for rejection (optional)...'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-400 placeholder-gray-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onRechazar(sol.id, motivo)}
                  disabled={procesando}
                  className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-lg disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  {procesando ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  {es ? 'Confirmar rechazo' : 'Confirm rejection'}
                </button>
                <button onClick={() => setRechazando(false)} className="text-xs text-gray-400 underline px-2">
                  {es ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onAprobar(sol.id)}
                disabled={procesando}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-lg disabled:opacity-40 flex items-center justify-center gap-1 transition-colors"
              >
                {procesando ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                {es ? 'Aprobar' : 'Approve'}
              </button>
              <button
                onClick={() => setRechazando(true)}
                disabled={procesando}
                className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold py-2.5 rounded-lg disabled:opacity-40 flex items-center justify-center gap-1 transition-colors"
              >
                <XCircle size={12} />
                {es ? 'Rechazar' : 'Reject'}
              </button>
            </div>
          )}
        </>
      )}

      {sol.motivo_rechazo && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {es ? 'Motivo:' : 'Reason:'} {sol.motivo_rechazo}
        </p>
      )}
    </div>
  );
}

function TokenCard({ inv, es, onDesactivar }) {
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}/voluntario?token=${inv.token}`;

  const copiar = () => {
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const expirado = inv.expira_en && new Date(inv.expira_en) < new Date();
  const agotado = inv.usos_actuales >= inv.max_usos;

  return (
    <div className={`bg-white border rounded-xl p-4 space-y-2 ${!inv.activo || expirado || agotado ? 'opacity-60' : 'border-blue-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{inv.institucion_nombre}</p>
          {inv.institucion_tipo && <p className="text-xs text-gray-400">{inv.institucion_tipo}</p>}
          {inv.dominio_email && <p className="text-xs text-blue-600">@{inv.dominio_email}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold text-gray-700">{inv.usos_actuales}/{inv.max_usos} {es ? 'usos' : 'uses'}</p>
          {expirado && <p className="text-[10px] text-red-500">{es ? 'Expirado' : 'Expired'}</p>}
          {agotado && !expirado && <p className="text-[10px] text-orange-500">{es ? 'Agotado' : 'Exhausted'}</p>}
          {!expirado && !agotado && inv.activo && <p className="text-[10px] text-green-600">{es ? 'Activo' : 'Active'}</p>}
          {inv.expira_en && <p className="text-[10px] text-gray-400">{new Date(inv.expira_en).toLocaleDateString()}</p>}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
        <LinkIcon size={10} className="text-gray-400 flex-shrink-0" />
        <p className="text-[10px] text-gray-500 font-mono truncate flex-1">{link}</p>
        <button onClick={copiar} className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors">
          {copiado ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>

      {inv.activo && !expirado && !agotado && (
        <button onClick={() => onDesactivar(inv.id)} className="w-full text-xs text-gray-400 border border-gray-200 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-1">
          <Trash2 size={10} /> {es ? 'Desactivar' : 'Deactivate'}
        </button>
      )}
    </div>
  );
}

export default function GestionVoluntarios({ es }) {
  const [tab, setTab] = useState('solicitudes');
  const [solicitudes, setSolicitudes] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [filtroPendientes, setFiltroPendientes] = useState(true);

  // Nuevo token form
  const [showForm, setShowForm] = useState(false);
  const [nuevoToken, setNuevoToken] = useState({ institucion_nombre: '', institucion_tipo: '', dominio_email: '', max_usos: 100, notas: '' });
  const [creando, setCreando] = useState(false);
  const [tokenCreado, setTokenCreado] = useState(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const [sols, invs] = await Promise.all([
        base44.entities.SolicitudVoluntario.list('-created_date', 200),
        base44.entities.InvitacionInstitucional.list('-created_date', 100),
      ]);
      setSolicitudes(sols || []);
      setInvitaciones(invs || []);
    } catch {}
    setCargando(false);
  };

  const aprobar = async (solicitud_id) => {
    setProcesando(solicitud_id);
    try {
      await base44.functions.invoke('gestionarVoluntario', { accion: 'aprobar', solicitud_id });
      setSolicitudes(prev => prev.map(s => s.id === solicitud_id ? { ...s, estado: 'aprobado' } : s));
    } catch {}
    setProcesando(null);
  };

  const rechazar = async (solicitud_id, motivo) => {
    setProcesando(solicitud_id);
    try {
      await base44.functions.invoke('gestionarVoluntario', { accion: 'rechazar', solicitud_id, motivo_rechazo: motivo });
      setSolicitudes(prev => prev.map(s => s.id === solicitud_id ? { ...s, estado: 'rechazado', motivo_rechazo: motivo } : s));
    } catch {}
    setProcesando(null);
  };

  const crearToken = async () => {
    if (!nuevoToken.institucion_nombre.trim()) return;
    setCreando(true);
    try {
      const r = await base44.functions.invoke('gestionarVoluntario', { accion: 'crear_token', ...nuevoToken });
      setTokenCreado(r.data);
      setInvitaciones(prev => [r.data.invitacion, ...prev]);
      setNuevoToken({ institucion_nombre: '', institucion_tipo: '', dominio_email: '', max_usos: 100, notas: '' });
    } catch {}
    setCreando(false);
  };

  const desactivarToken = async (id) => {
    try {
      await base44.entities.InvitacionInstitucional.update(id, { activo: false });
      setInvitaciones(prev => prev.map(i => i.id === id ? { ...i, activo: false } : i));
    } catch {}
  };

  const solFiltradas = filtroPendientes ? solicitudes.filter(s => s.estado === 'pendiente') : solicitudes;
  const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length;

  if (cargando) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="animate-spin text-gray-400" size={24} />
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-4">
        {[
          { key: 'solicitudes', label: es ? `Solicitudes (${pendientesCount} pend.)` : `Requests (${pendientesCount} pend.)` },
          { key: 'tokens', label: es ? `Links Institucionales (${invitaciones.filter(i => i.activo).length})` : `Institutional Links (${invitaciones.filter(i => i.activo).length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${tab === t.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Solicitudes */}
      {tab === 'solicitudes' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setFiltroPendientes(v => !v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filtroPendientes ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {filtroPendientes ? (es ? 'Solo pendientes' : 'Pending only') : (es ? 'Todas' : 'All')}
            </button>
            <p className="text-xs text-gray-400">{solFiltradas.length} {es ? 'solicitudes' : 'requests'}</p>
          </div>

          {solFiltradas.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm">{es ? 'Sin solicitudes pendientes.' : 'No pending requests.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solFiltradas.map(sol => (
                <SolicitudCard key={sol.id} sol={sol} es={es} onAprobar={aprobar} onRechazar={rechazar} procesando={procesando === sol.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tokens */}
      {tab === 'tokens' && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm mb-4">
              <Plus size={16} /> {es ? 'Crear link de invitación institucional' : 'Create institutional invitation link'}
            </button>
          ) : (
            <div className="bg-white border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">{es ? 'Nuevo link institucional' : 'New institutional link'}</h3>
                <button onClick={() => { setShowForm(false); setTokenCreado(null); }} className="text-xs text-gray-400 underline">{es ? 'Cancelar' : 'Cancel'}</button>
              </div>

              {tokenCreado ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-green-700">✅ {es ? 'Link creado' : 'Link created'}</p>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-bold text-green-800">{es ? 'Envía este link a la institución:' : 'Send this link to the institution:'}</p>
                    <div className="bg-white border border-green-200 rounded-lg p-2 flex items-center gap-2">
                      <p className="text-[11px] font-mono text-gray-600 truncate flex-1">{tokenCreado.link}</p>
                      <button onClick={() => { navigator.clipboard.writeText(tokenCreado.link); }}
                        className="text-green-600 hover:text-green-800 flex-shrink-0">
                        <Copy size={13} />
                      </button>
                    </div>
                    <p className="text-[10px] text-green-600">{es ? 'Válido por 30 días · Al registrarse por este link, el acceso se activa automáticamente.' : 'Valid for 30 days · Users registering via this link get instant access.'}</p>
                  </div>
                  <button onClick={() => { setTokenCreado(null); setShowForm(false); }} className="w-full text-xs text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50">
                    {es ? 'Crear otro link' : 'Create another link'}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{es ? 'Nombre institución *' : 'Institution name *'}</label>
                    <input value={nuevoToken.institucion_nombre} onChange={e => setNuevoToken(p => ({ ...p, institucion_nombre: e.target.value }))}
                      placeholder={es ? 'Cruz Roja, ONG Rescate...' : 'Red Cross, NGO Rescue...'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{es ? 'Tipo (opcional)' : 'Type (optional)'}</label>
                    <input value={nuevoToken.institucion_tipo} onChange={e => setNuevoToken(p => ({ ...p, institucion_tipo: e.target.value }))}
                      placeholder={es ? 'Refugio, Hospital, ONG...' : 'Shelter, Hospital, NGO...'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {es ? 'Dominio de email (auto-aprueba al registrarse)' : 'Email domain (auto-approves on register)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <input value={nuevoToken.dominio_email} onChange={e => setNuevoToken(p => ({ ...p, dominio_email: e.target.value.replace('@', '') }))}
                        placeholder="cruzroja.org"
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{es ? 'Opcional. Si se configura, cualquier email de este dominio será pre-aprobado.' : 'Optional. If set, any email from this domain is pre-approved.'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{es ? 'Máx. de usos' : 'Max uses'}</label>
                    <input type="number" value={nuevoToken.max_usos} onChange={e => setNuevoToken(p => ({ ...p, max_usos: parseInt(e.target.value) || 100 }))}
                      min={1} max={1000}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <button onClick={crearToken} disabled={creando || !nuevoToken.institucion_nombre.trim()}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                    {creando ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                    {es ? 'Generar link institucional' : 'Generate institutional link'}
                  </button>
                </>
              )}
            </div>
          )}

          {invitaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p className="text-3xl mb-2">🔗</p>
              <p>{es ? 'No hay links institucionales creados.' : 'No institutional links created.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitaciones.map(inv => (
                <TokenCard key={inv.id} inv={inv} es={es} onDesactivar={desactivarToken} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}