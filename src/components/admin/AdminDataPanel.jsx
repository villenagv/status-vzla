import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, AlertTriangle, Search, RefreshCw, ImageOff } from 'lucide-react';

const ENTITY_LABELS = {
  PersonaCRIS: 'Personas CRIS',
  PersonasBuscadas: 'Personas buscadas',
  PersonasEncontradas: 'Personas encontradas',
  PersonaRegistrada: 'Personas institucionales',
  RegistroInstitucional: 'Registros institucionales',
  ReportesDano: 'Edificios / daños',
  InfraestructuraSos: 'Reportes SOS',
  PuntosAyuda: 'Refugios / hospitales / puntos',
  EstadoOperativoEdificio: 'Estado operativo edificios',
  ActualizacionesSitios: 'Actualizaciones de sitios',
  PistasPersonas: 'Pistas de personas',
  SolicitudesInfoEdificio: 'Solicitudes edificios',
  CruceBusqueda: 'Cruces de búsqueda',
  Coincidencia: 'Coincidencias',
  Necesidades: 'Necesidades',
  OfertasAyuda: 'Ofertas de ayuda',
  Suscripciones: 'Suscripciones',
  NotificacionesUsuario: 'Notificaciones',
};

const PHOTO_FIELDS = ['foto_url', 'foto_url_2', 'foto_principal_url', 'foto_urls', 'foto_adicional_url', 'fotos_adicionales_urls', 'archivo_url', 'file_url', 'video_url'];

function recordTitle(record) {
  const fields = ['nombre_completo', 'nombre_o_descripcion', 'nombre_lugar', 'nombre', 'institucion_nombre', 'tipo_reporte', 'tipo_estructura', 'ciudad', 'email_contacto'];
  for (const field of fields) {
    if (record?.[field]) return String(record[field]).slice(0, 80);
  }
  return record?.id || '—';
}

function hasPhotos(record) {
  return PHOTO_FIELDS.some(field => {
    const value = record?.[field];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
}

export default function AdminDataPanel({ es = true }) {
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmPhoto, setConfirmPhoto] = useState(null);
  const [working, setWorking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.functions.invoke('adminDelete', { action: 'list_entities' })
      .then(r => {
        const list = r.data?.entities || [];
        setEntities(list);
        if (list.length && !selectedEntity) setSelectedEntity(list[0]);
      })
      .catch(() => setMessage(es ? 'No se pudo cargar la lista de secciones.' : 'Could not load sections.'));
  }, []);

  useEffect(() => { if (selectedEntity) loadRecords(selectedEntity); }, [selectedEntity]);

  const loadRecords = async (entity = selectedEntity) => {
    if (!entity) return;
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const res = await base44.functions.invoke('adminDelete', { action: 'list_records', entity_name: entity, limit: 75 });
      setRecords(res.data?.records || []);
      setMessage('');
    } catch {
      setRecords([]);
      setMessage(es ? 'No se pudieron cargar los registros.' : 'Could not load records.');
    }
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter(record => JSON.stringify(record).toLowerCase().includes(term));
  }, [records, searchTerm]);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectAllVisible = () => {
    if (selectedIds.size === filteredRecords.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredRecords.map(r => r.id)));
  };

  const runDelete = async () => {
    const ids = Array.isArray(confirmDelete) ? confirmDelete : [confirmDelete];
    if (!ids.length) return;
    setWorking(true);
    try {
      await base44.functions.invoke('adminDelete', { action: 'delete_many', entity_name: selectedEntity, ids });
      setMessage(es ? `Se borraron ${ids.length} registro(s).` : `${ids.length} record(s) deleted.`);
      setConfirmDelete(null);
      await loadRecords(selectedEntity);
    } catch {
      setMessage(es ? 'No se pudo borrar. Intenta de nuevo.' : 'Could not delete. Try again.');
    }
    setWorking(false);
  };

  const runClearPhotos = async () => {
    if (!confirmPhoto) return;
    setWorking(true);
    try {
      await base44.functions.invoke('adminDelete', { action: 'clear_photos', entity_name: selectedEntity, record_id: confirmPhoto });
      setMessage(es ? 'Fotos quitadas de la ficha pública.' : 'Photos removed from the public record.');
      setConfirmPhoto(null);
      await loadRecords(selectedEntity);
    } catch {
      setMessage(es ? 'No se pudieron quitar las fotos.' : 'Could not remove photos.');
    }
    setWorking(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{es ? 'Sección' : 'Section'}</label>
          <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white">
            {entities.map(entity => <option key={entity} value={entity}>{ENTITY_LABELS[entity] || entity}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">{es ? 'Buscar visible' : 'Search visible'}</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm" placeholder={es ? 'Nombre, ciudad, ID...' : 'Name, city, ID...'} />
          </div>
        </div>
      </div>

      {message && <div className="mb-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl px-3 py-2 text-xs font-semibold">{message}</div>}

      {selectedEntity && (
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
          <button onClick={selectAllVisible} disabled={!filteredRecords.length} className="text-xs font-bold px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-40">
            {selectedIds.size === filteredRecords.length ? (es ? 'Deseleccionar' : 'Unselect') : (es ? 'Seleccionar visibles' : 'Select visible')}
          </button>
          <span className="text-xs text-gray-500">{selectedIds.size} {es ? 'seleccionado(s)' : 'selected'} · {filteredRecords.length} {es ? 'visible(s)' : 'visible'}</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => loadRecords()} disabled={loading} className="text-xs font-bold px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 flex items-center gap-1">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {es ? 'Recargar' : 'Reload'}
            </button>
            <button onClick={() => setConfirmDelete(Array.from(selectedIds))} disabled={!selectedIds.size || working} className="text-xs font-bold px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-40 flex items-center gap-1">
              <Trash2 size={12} /> {es ? 'Borrar' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {loading && <div className="p-8 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" size={24} /><p className="text-sm">{es ? 'Cargando...' : 'Loading...'}</p></div>}
        {!loading && filteredRecords.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">{es ? 'No hay registros visibles.' : 'No visible records.'}</div>}
        {!loading && filteredRecords.map(record => (
          <div key={record.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
            <input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => toggleSelect(record.id)} className="mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{recordTitle(record)}</p>
              <p className="text-xs text-gray-500 truncate">{[record.ciudad, record.estado_region].filter(Boolean).join(', ') || selectedEntity}</p>
              <p className="text-[10px] text-gray-400 truncate">ID: {record.id}</p>
              {hasPhotos(record) && <p className="text-[10px] text-amber-700 font-bold mt-0.5">📷 {es ? 'Tiene fotos/archivos visibles' : 'Has visible photos/files'}</p>}
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {hasPhotos(record) && (
                <button onClick={() => setConfirmPhoto(record.id)} className="text-[10px] font-bold text-amber-700 border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 flex items-center gap-1">
                  <ImageOff size={12} /> {es ? 'Quitar fotos' : 'Remove photos'}
                </button>
              )}
              <button onClick={() => setConfirmDelete(record.id)} className="text-[10px] font-bold text-red-700 border border-red-200 bg-red-50 rounded-lg px-2 py-1 flex items-center gap-1">
                <Trash2 size={12} /> {es ? 'Borrar' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(confirmDelete || confirmPhoto) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setConfirmDelete(null); setConfirmPhoto(null); }}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <AlertTriangle size={42} className="text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-black text-center text-gray-900 mb-2">
              {confirmPhoto ? (es ? '¿Quitar fotos?' : 'Remove photos?') : (es ? '¿Borrar registro?' : 'Delete record?')}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              {confirmPhoto
                ? (es ? 'Se quitarán las fotos y archivos visibles de esta ficha. El registro seguirá existiendo.' : 'Visible photos and files will be removed from this record. The record will remain.')
                : (es ? 'Esta acción no se puede deshacer.' : 'This action cannot be undone.')}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmDelete(null); setConfirmPhoto(null); }} disabled={working} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-700">{es ? 'Cancelar' : 'Cancel'}</button>
              <button onClick={confirmPhoto ? runClearPhotos : runDelete} disabled={working} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2">
                {working ? <Loader2 size={16} className="animate-spin" /> : (confirmPhoto ? <ImageOff size={16} /> : <Trash2 size={16} />)}
                {working ? (es ? 'Procesando...' : 'Working...') : (confirmPhoto ? (es ? 'Sí, quitar' : 'Yes, remove') : (es ? 'Sí, borrar' : 'Yes, delete'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}