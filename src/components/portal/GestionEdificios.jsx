import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Edit3, Save, X, Camera, Trash2, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NIVEL_OPTS = [
  { val: 'leve',      es: '🟡 Leve',       en: '🟡 Minor'     },
  { val: 'moderado',  es: '🟠 Moderado',    en: '🟠 Moderate'  },
  { val: 'grave',     es: '🔴 Grave',       en: '🔴 Severe'    },
  { val: 'critico',   es: '🚨 Crítico',     en: '🚨 Critical'  },
  { val: 'colapsado', es: '💥 Colapsado',   en: '💥 Collapsed' },
  { val: 'no_evaluado',es:'⚪ Sin evaluar', en: '⚪ Uneval.'   },
];

const DANO_COLOR = {
  leve: '#B7950B', moderado: '#CA6F1E', grave: '#C0392B',
  critico: '#922B21', colapsado: '#4A0E0E', no_evaluado: '#7F8C8D', no_sabe: '#7F8C8D',
};

function FilaEdificio({ reporte, es, onActualizado, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre_lugar: reporte.nombre_lugar || '', nivel_dano: reporte.nivel_dano, descripcion: reporte.descripcion || '' });
  const [guardando, setGuardando] = useState(false);
  const [nuevasFotos, setNuevasFotos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [enviandoNotif, setEnviandoNotif] = useState(false);
  const [notifOk, setNotifOk] = useState(false);
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const fotosYa = reporte.foto_urls || [];
      const fotosNuevas = nuevasFotos.filter(f => f.url).map(f => f.url);
      const foto_urls = [...fotosYa, ...fotosNuevas].slice(0, 5);
      const updated = await base44.entities.ReportesDano.update(reporte.id, { ...form, foto_urls });
      onActualizado(reporte.id, { ...form, foto_urls });
      setNuevasFotos([]);
      setEditando(false);
    } catch {}
    setGuardando(false);
  };

  const subirFoto = async (file) => {
    if ((reporte.foto_urls?.length || 0) + nuevasFotos.length >= 5) return;
    const fid = Date.now();
    setNuevasFotos(prev => [...prev, { id: fid, url: null, uploading: true, preview: URL.createObjectURL(file) }]);
    setSubiendo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNuevasFotos(p => p.map(f => f.id === fid ? { ...f, url: file_url, uploading: false } : f));
    } catch {
      setNuevasFotos(p => p.filter(f => f.id !== fid));
    }
    setSubiendo(false);
  };

  const eliminarFotoExistente = async (url) => {
    const nuevaLista = (reporte.foto_urls || []).filter(u => u !== url);
    await base44.entities.ReportesDano.update(reporte.id, { foto_urls: nuevaLista });
    onActualizado(reporte.id, { foto_urls: nuevaLista });
  };

  const enviarNotificacion = async () => {
    if (!notifMsg.trim()) return;
    setEnviandoNotif(true);
    try {
      await base44.functions.invoke('notificarSuscriptoresPublicacion', {
        edificio_id: reporte.id,
        mensaje: notifMsg,
        asunto: `Actualización: ${reporte.nombre_lugar || reporte.direccion}`,
      });
      setNotifOk(true);
      setNotifMsg('');
      setTimeout(() => { setNotifOk(false); setMostrarNotif(false); }, 3000);
    } catch {}
    setEnviandoNotif(false);
  };

  const eliminar = async () => {
    try {
      await base44.entities.ReportesDano.delete(reporte.id);
      onEliminar(reporte.id);
    } catch {}
    setConfirmEliminar(false);
  };

  const color = DANO_COLOR[reporte.nivel_dano] || '#7F8C8D';
  const totalFotos = (reporte.foto_urls?.length || 0) + nuevasFotos.filter(f => f.url).length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {reporte.nombre_lugar || reporte.tipo_estructura?.replace(/_/g, ' ') || (es ? 'Sin nombre' : 'Unnamed')}
            </p>
            <p className="text-xs text-gray-400 truncate">📍 {[reporte.direccion, reporte.ciudad].filter(Boolean).join(' · ')}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, background: color + '18', border: `1px solid ${color}44` }}>
                {reporte.nivel_dano?.replace(/_/g, ' ') || '—'}
              </span>
              {reporte.foto_urls?.length > 0 && (
                <span className="text-xs text-gray-400">📷 {reporte.foto_urls.length}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setMostrarNotif(v => !v)} title={es ? 'Notificar suscriptores' : 'Notify subscribers'}
              className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg">
              <Bell size={14} />
            </button>
            <button onClick={() => setEditando(v => !v)} title={es ? 'Editar' : 'Edit'}
              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg">
              {editando ? <X size={14} /> : <Edit3 size={14} />}
            </button>
            <button onClick={() => setConfirmEliminar(true)} title={es ? 'Eliminar' : 'Delete'}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Notificación a suscriptores */}
      {mostrarNotif && (
        <div className="border-t border-gray-100 px-4 py-3 bg-amber-50">
          <p className="text-xs font-bold text-amber-800 mb-2">📨 {es ? 'Notificar a suscriptores de este edificio' : 'Notify building subscribers'}</p>
          {notifOk ? (
            <p className="text-xs text-green-600 font-bold">✅ {es ? '¡Enviado!' : 'Sent!'}</p>
          ) : (
            <div className="flex gap-2">
              <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} rows={2}
                placeholder={es ? 'Escribe el mensaje...' : 'Write your message...'}
                className="flex-1 border border-amber-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none bg-white" />
              <button onClick={enviarNotificacion} disabled={!notifMsg.trim() || enviandoNotif}
                className="bg-amber-600 text-white text-xs font-bold px-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center gap-1">
                {enviandoNotif ? <Loader2 size={12} className="animate-spin" /> : '📨'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formulario edición */}
      {editando && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{es ? 'Nombre del lugar' : 'Place name'}</label>
            <input value={form.nombre_lugar} onChange={e => setForm(f => ({ ...f, nombre_lugar: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{es ? 'Nivel de daño' : 'Damage level'}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {NIVEL_OPTS.map(n => (
                <button key={n.val} onClick={() => setForm(f => ({ ...f, nivel_dano: n.val }))}
                  className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${form.nivel_dano === n.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {es ? n.es : n.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{es ? 'Descripción' : 'Description'}</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" />
          </div>

          {/* Fotos existentes */}
          {reporte.foto_urls?.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">{es ? 'Fotos actuales' : 'Current photos'}</label>
              <div className="flex flex-wrap gap-2">
                {reporte.foto_urls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    <button onClick={() => eliminarFotoExistente(url)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer">
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subir nuevas fotos */}
          {totalFotos < 5 && (
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">{es ? `Agregar fotos (máx. ${5 - totalFotos} más)` : `Add photos (max ${5 - totalFotos} more)`}</label>
              <div className="flex flex-wrap gap-2">
                {nuevasFotos.map(f => (
                  <div key={f.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    {f.preview && <img src={f.preview} alt="" className="w-full h-full object-cover" />}
                    {f.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={13} className="animate-spin text-white" /></div>}
                    {f.url && <button onClick={() => setNuevasFotos(p => p.filter(x => x.id !== f.id))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={7} /></button>}
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400">
                  <Camera size={16} className="text-gray-400" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => { Array.from(e.target.files || []).forEach(subirFoto); e.target.value = ''; }} />
                </label>
              </div>
            </div>
          )}

          <button onClick={guardar} disabled={guardando || subiendo}
            className="w-full bg-blue-700 text-white text-xs font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5">
            {guardando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {es ? 'Guardar cambios' : 'Save changes'}
          </button>
        </div>
      )}

      {/* Confirmar eliminación */}
      {confirmEliminar && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs font-bold text-red-700 mb-2">{es ? '¿Eliminar este reporte de edificio?' : 'Delete this building report?'}</p>
          <div className="flex gap-2">
            <button onClick={eliminar} className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-xl cursor-pointer">{es ? 'Sí, eliminar' : 'Yes, delete'}</button>
            <button onClick={() => setConfirmEliminar(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl cursor-pointer">{es ? 'Cancelar' : 'Cancel'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GestionEdificios({ es }) {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(15);

  useEffect(() => {
    base44.entities.ReportesDano.list('-created_date', 200)
      .then(d => setReportes(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const onActualizado = (id, datos) => setReportes(prev => prev.map(r => r.id === id ? { ...r, ...datos } : r));
  const onEliminar = (id) => setReportes(prev => prev.filter(r => r.id !== id));

  const filtrados = reportes.filter(r => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return (r.nombre_lugar || '').toLowerCase().includes(q) || (r.direccion || '').toLowerCase().includes(q) || (r.ciudad || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={filtro} onChange={e => { setFiltro(e.target.value); setPagina(15); }}
          placeholder={es ? 'Buscar por nombre, dirección, ciudad...' : 'Search by name, address, city...'}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
        <Link to="/edificios" className="bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl no-underline flex items-center whitespace-nowrap">
          + {es ? 'Nuevo' : 'New'}
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-3">{filtrados.length} {es ? 'edificio(s)' : 'building(s)'}</p>
      {cargando ? (
        <div className="text-center py-10"><Loader2 size={22} className="animate-spin text-gray-400 mx-auto" /></div>
      ) : (
        <>
          {filtrados.slice(0, pagina).map(r => (
            <FilaEdificio key={r.id} reporte={r} es={es} onActualizado={onActualizado} onEliminar={onEliminar} />
          ))}
          {filtrados.length > pagina && (
            <button onClick={() => setPagina(v => v + 15)}
              className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
              {es ? `Ver ${Math.min(15, filtrados.length - pagina)} más` : `Load ${Math.min(15, filtrados.length - pagina)} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}