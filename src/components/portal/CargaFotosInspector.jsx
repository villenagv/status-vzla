import { useState } from 'react';
import { Loader2, Camera, X, Upload, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { comprimirFoto, dataURLaFile } from '@/lib/comprimirFoto';
import { AREAS_INSPECCION, GRUPOS_AREA } from './areasInspeccion';
import ChecklistFotosGuia from './ChecklistFotosGuia';
import BuscadorEdificio from '@/components/inspeccion/BuscadorEdificio';

/**
 * CargaFotosInspector
 * Módulo independiente para que un inspector suba evidencia fotográfica guiada
 * a un edificio ya existente, sin tener que declarar el resultado final de la
 * inspección (severidad / tipo de daño). Útil para ir subiendo fotos durante
 * la visita, en varias tandas.
 * Cada foto: { url, area, nota, piso, privada } — igual formato que FormularioInspeccion.
 */

const MAX_FOTOS = 12;

export default function CargaFotosInspector({ perfil, es }) {
  const [nombreBusqueda, setNombreBusqueda] = useState('');
  const [edificio, setEdificio] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const agregarFotos = async (files) => {
    const espacio = MAX_FOTOS - fotos.length;
    const archivos = Array.from(files).slice(0, Math.max(0, espacio));
    if (!archivos.length) return;
    setSubiendoFoto(true);
    for (const file of archivos) {
      try {
        const dataURL = await comprimirFoto(file, 1280, 0.7);
        setFotos(prev => [...prev, { id: Date.now() + Math.random(), dataURL, area: 'general', nota: '', piso: '', privada: false }]);
      } catch { /* ignorar foto que falle */ }
    }
    setSubiendoFoto(false);
  };

  const actualizarFoto = (id, campo, valor) => setFotos(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  const eliminarFoto = (id) => setFotos(prev => prev.filter(f => f.id !== id));

  const otraCarga = () => { setEdificio(null); setNombreBusqueda(''); setFotos([]); setExito(false); setError(''); };

  const guardar = async () => {
    if (!edificio || fotos.length === 0) return;
    setGuardando(true);
    setError('');
    try {
      const detalleNuevo = [];
      const urlsTodas = [];
      const urlsPublicas = [];
      for (let i = 0; i < fotos.length; i++) {
        const f = fotos[i];
        setProgreso(es ? `Subiendo foto ${i + 1} de ${fotos.length}...` : `Uploading photo ${i + 1} of ${fotos.length}...`);
        try {
          const file = dataURLaFile(f.dataURL, `evidencia_${Date.now()}_${i}.jpg`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          if (file_url) {
            detalleNuevo.push({ url: file_url, area: f.area || 'general', nota: (f.nota || '').trim(), piso: (f.piso || '').trim(), privada: !!f.privada });
            urlsTodas.push(file_url);
            if (!f.privada) urlsPublicas.push(file_url);
          }
        } catch { /* seguimos con la siguiente */ }
      }

      setProgreso(es ? 'Guardando en la ficha...' : 'Saving to the record...');
      await base44.entities.ReportesDano.update(edificio.id, {
        inspeccion_detalle_fotos: [...(edificio.inspeccion_detalle_fotos || []), ...detalleNuevo],
        inspeccion_fotos: [...(edificio.inspeccion_fotos || []), ...urlsTodas],
        foto_urls: [...(edificio.foto_urls || []), ...urlsPublicas].slice(0, 5),
      });

      const inspector = perfil.user_nombre || perfil.user_email;
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: edificio.id, tipo_sitio: 'edificio', tipo_accion: 'tengo_actualizacion',
        descripcion: es ? `[EVIDENCIA] Se agregaron ${detalleNuevo.length} foto(s) de inspección.` : `[EVIDENCE] ${detalleNuevo.length} inspection photo(s) added.`,
        reportante_nombre: inspector, fuente: 'especialista', es_verificado: true,
      }).catch(() => {});

      setExito(true);
    } catch {
      setError(es ? 'No se pudieron guardar las fotos. Intenta de nuevo.' : 'Could not save the photos. Try again.');
    }
    setGuardando(false);
    setProgreso('');
  };

  if (exito) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
      <CheckCircle2 size={28} className="text-green-600 mx-auto mb-2" />
      <p className="text-sm font-bold text-green-800 mb-1">{es ? 'Fotos guardadas en la ficha.' : 'Photos saved to the record.'}</p>
      <p className="text-xs text-green-700 mb-4">{es ? 'La evidencia ya está disponible para revisión.' : 'The evidence is now available for review.'}</p>
      <button onClick={otraCarga} className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer">
        {es ? 'Cargar más fotos' : 'Upload more photos'}
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-800 mb-0.5">📷 {es ? 'Cargar fotos de un edificio' : 'Upload building photos'}</p>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          {es ? 'Busca el edificio y sube evidencia fotográfica guiada, sin necesidad de declarar el resultado final de la inspección.'
              : 'Search for the building and upload guided photo evidence, without needing to declare the final inspection result.'}
        </p>
      </div>

      {!edificio ? (
        <BuscadorEdificio es={es} valor={nombreBusqueda} onCambiarNombre={setNombreBusqueda} onSeleccionar={setEdificio} seleccionado={edificio} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{edificio.nombre_lugar || (es ? 'Sin nombre' : 'No name')}</p>
              <p className="text-xs text-gray-400 truncate">{[edificio.direccion, edificio.ciudad].filter(Boolean).join(' · ')}</p>
            </div>
            <button onClick={otraCarga} className="text-xs text-gray-400 underline cursor-pointer flex-shrink-0">{es ? 'Cambiar' : 'Change'}</button>
          </div>

          {fotos.length > 0 && <ChecklistFotosGuia fotos={fotos} es={es} />}

          <div className="space-y-2">
            {fotos.map((f, i) => (
              <div key={f.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex gap-2">
                <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={f.dataURL} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => eliminarFoto(f.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer">
                    <X size={10} />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold bg-black/60 text-white px-1 rounded">#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <select value={f.area} onChange={e => actualizarFoto(f.id, 'area', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer">
                    {GRUPOS_AREA.map(g => (
                      <optgroup key={g.val} label={es ? g.es : g.en}>
                        {AREAS_INSPECCION.filter(a => a.grupo === g.val).map(a => (
                          <option key={a.val} value={a.val}>{es ? a.es : a.en}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <input type="text" value={f.piso} onChange={e => actualizarFoto(f.id, 'piso', e.target.value)}
                      placeholder={es ? 'Piso (ej: 3)' : 'Floor (e.g. 3)'}
                      className="w-1/3 border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500" />
                    <input type="text" value={f.nota} onChange={e => actualizarFoto(f.id, 'nota', e.target.value)}
                      maxLength={200}
                      placeholder={es ? 'Nota técnica (opcional)' : 'Technical note (optional)'}
                      className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500" />
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none">
                    <input type="checkbox" checked={!!f.privada} onChange={e => actualizarFoto(f.id, 'privada', e.target.checked)} className="rounded" />
                    {es ? '🔒 Mantener esta foto privada' : '🔒 Keep this photo private'}
                  </label>
                </div>
              </div>
            ))}

            {fotos.length < MAX_FOTOS && (
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50">
                {subiendoFoto ? (
                  <Loader2 size={18} className="text-gray-400 animate-spin mx-auto" />
                ) : (
                  <>
                    <Camera size={18} className="text-gray-400 mx-auto mb-1" />
                    <span className="text-[11px] font-semibold text-gray-600">
                      {es ? `Agregar fotos (${fotos.length}/${MAX_FOTOS})` : `Add photos (${fotos.length}/${MAX_FOTOS})`}
                    </span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" multiple className="hidden"
                  onChange={e => { agregarFotos(e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </div>

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          {guardando && progreso && (
            <p className="text-[11px] text-blue-700 text-center flex items-center justify-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> {progreso}
            </p>
          )}

          <button onClick={guardar} disabled={fotos.length === 0 || guardando || subiendoFoto}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
            {guardando ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {es ? 'Guardar fotos en la ficha' : 'Save photos to the record'}
          </button>
          {fotos.length === 0 && (
            <p className="text-[10px] text-gray-400 text-center -mt-1">{es ? 'Agrega al menos una foto para guardar.' : 'Add at least one photo to save.'}</p>
          )}
        </div>
      )}
    </div>
  );
}