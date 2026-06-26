import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, AlertTriangle, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const ENTITY_LABELS = {
  PersonaCRIS: 'Personas (CRIS)', PersonasBuscadas: 'Personas Buscadas',
  PersonasEncontradas: 'Personas Encontradas', ReportesDano: 'Reportes de Daño',
  PuntosAyuda: 'Puntos de Ayuda', Suscripciones: 'Suscripciones',
  SolicitudesInfoEdificio: 'Solicitudes Info Edificios',
  CruceBusqueda: 'Cruce de Búsqueda', Coincidencia: 'Coincidencias',
  Necesidades: 'Necesidades', OfertasAyuda: 'Ofertas de Ayuda',
  InfraestructuraSos: 'Reportes SOS',
};

export default function AdminDataPanel() {
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    base44.functions.invoke('adminDelete', { action: 'list_entities' })
      .then(r => setEntities(r.data?.entities || []))
      .catch(() => {});
  }, []);

  const loadRecords = async (entity, resetIds = true) => {
    if (!entity) return;
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const payload = searchTerm.trim()
        ? { action: 'filter_records', entity_name: entity, search_value: searchTerm.trim(), search_field: 'nombre', limit: 50 }
        : { action: 'list_records', entity_name: entity, limit: 50 };
      const res = await base44.functions.invoke('adminDelete', payload);
      setRecords(res.data?.records || []);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedEntity) loadRecords(selectedEntity);
  }, [selectedEntity, searchTerm]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectAllVisible = () => {
    if (selectedIds.size === records.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(records.map(r => r.id)));
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete === 'all') {
        const query = { nombre: searchTerm.trim() || { $exists: true } };
        await base44.functions.invoke('adminDelete', { action: 'delete_all_filtered', entity_name: selectedEntity, query });
      } else if (Array.isArray(confirmDelete)) {
        await base44.functions.invoke('adminDelete', { action: 'delete_many', entity_name: selectedEntity, ids: confirmDelete });
      } else {
        await base44.functions.invoke('adminDelete', { action: 'delete_single', entity_name: selectedEntity, record_id: confirmDelete });
      }
    } catch {}
    setConfirmDelete(null);
    setDeleting(false);
    loadRecords(selectedEntity, false);
  };

  const renderFields = (record) => {
    if (!record) return '—';
    const fields = ['nombre', 'nombre_completo', 'nombre_lugar', 'nombre_creador', 'email', 'telefono'];
    for (const f of fields) {
      if (record[f]) return String(record[f]).substring(0, 60);
    }
    const keys = Object.keys(record).filter(k => !['id', 'created_date', 'updated_date', 'created_by', 'created_by_id', 'entity_name', 'app_id'].includes(k));
    for (const k of keys.slice(0, 3)) {
      const v = record[k];
      if (v && typeof v === 'string' && v.length > 0) return v.substring(0, 60);
    }
    return '—';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de registro</label>
          <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Seleccionar...</option>
            {entities.map(e => <option key={e} value={e}>{ENTITY_LABELS[e] || e}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="Nombre..." />
          </div>
        </div>
      </div>

      {/* Actions bar */}
      {selectedEntity && records.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <button onClick={selectAllVisible}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer">
            {selectedIds.size === records.length ? 'Deseleccionar todo' : 'Seleccionar visibles'}
          </button>
          <span className="text-xs text-gray-400">{selectedIds.size} seleccionado(s) · {records.length} visibles</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => loadRecords(selectedEntity)} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer" disabled={loading}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Recargar
            </button>
            <button onClick={() => setConfirmDelete(Array.from(selectedIds))}
              disabled={selectedIds.size === 0 || deleting}
              className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer">
              <Trash2 size={12} /> Borrar seleccionados
            </button>
          </div>
        </div>
      )}

      {/* Records list */}
      {selectedEntity && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {loading && records.length === 0 && (
            <div className="p-8 text-center text-gray-400"><Loader2 className="animate-spin inline mb-2" size={24} /><p className="text-sm">Cargando registros...</p></div>
          )}
          {!loading && records.length === 0 && (
            <div className="p-8 text-center text-gray-400"><p className="text-sm">No hay registros visibles.</p></div>
          )}
          {records.map(r => (
            <div key={r.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
              <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)}
                className="mt-1.5 cursor-pointer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{renderFields(r)}</p>
                <p className="text-xs text-gray-400 truncate">ID: {r.id}</p>
                <p className="text-xs text-gray-400">{r.created_date ? new Date(r.created_date).toLocaleString('es-VE') : ''}</p>
              </div>
              <button onClick={() => setConfirmDelete(r.id)}
                className="text-xs text-red-600 hover:text-red-800 flex-shrink-0 p-1 cursor-pointer" title="Borrar">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <AlertTriangle size={44} className="text-red-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900">¿Borrar registro(s)?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Esta acción no se puede deshacer.
                {Array.isArray(confirmDelete) && confirmDelete.length > 1 && ` Se borrarán ${confirmDelete.length} registros.`}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm cursor-pointer hover:bg-gray-50">Cancelar</button>
              <button onClick={doDelete} disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium text-sm cursor-pointer flex items-center justify-center gap-2 hover:bg-red-700">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Borrando...' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}