import { useState } from 'react';
import { Loader2, Upload, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { comprimirFoto, dataURLaFile } from '@/lib/comprimirFoto';
import { GRUPOS_FOTOS, MAX_FOTOS_TOTAL } from '@/components/inspeccion/guiaFotos';
import GrupoFotos from '@/components/inspeccion/GrupoFotos';
import BuscadorEdificio from '@/components/inspeccion/BuscadorEdificio';

/**
 * CargaFotosInspector
 * Módulo guiado (mismo esquema que "Solicitar inspección" ciudadano) para que un
 * inspector suba evidencia fotográfica paso a paso a un edificio ya existente,
 * sin tener que declarar el resultado final de la inspección (severidad / tipo de daño).
 * Pasos: 1 por cada grupo de la guía fotográfica (fachada, estructural, pisos/techos,
 * riesgos) + 1 paso final de revisión y privacidad antes de guardar.
 */

const fotosVacias = () => GRUPOS_FOTOS.reduce((acc, g) => ({ ...acc, [g.key]: [] }), {});

export default function CargaFotosInspector({ perfil, es }) {
  const [nombreBusqueda, setNombreBusqueda] = useState('');
  const [edificio, setEdificio] = useState(null);
  const [paso, setPaso] = useState(0);
  const [fotosPorGrupo, setFotosPorGrupo] = useState(fotosVacias());
  const [comprimiendoGrupo, setComprimiendoGrupo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const TOTAL_PASOS = GRUPOS_FOTOS.length + 1; // + paso de revisión final
  const totalFotos = Object.values(fotosPorGrupo).reduce((n, arr) => n + arr.length, 0);

  const agregarFotos = async (grupoKey, files) => {
    const espacio = MAX_FOTOS_TOTAL - totalFotos;
    const archivos = files.slice(0, Math.max(0, espacio));
    if (!archivos.length) return;
    setComprimiendoGrupo(grupoKey);
    for (const file of archivos) {
      try {
        const dataURL = await comprimirFoto(file, 1280, 0.7);
        setFotosPorGrupo(prev => ({ ...prev, [grupoKey]: [...prev[grupoKey], { dataURL, descripcion: '', privada: false }] }));
      } catch { /* ignoramos la foto que falle */ }
    }
    setComprimiendoGrupo(null);
  };

  const quitarFoto = (grupoKey, index) => {
    setFotosPorGrupo(prev => ({ ...prev, [grupoKey]: prev[grupoKey].filter((_, i) => i !== index) }));
  };

  const describirFoto = (grupoKey, index, texto) => {
    setFotosPorGrupo(prev => ({
      ...prev,
      [grupoKey]: prev[grupoKey].map((f, i) => i === index ? { ...f, descripcion: texto } : f),
    }));
  };

  const marcarPrivada = (grupoKey, index, val) => {
    setFotosPorGrupo(prev => ({
      ...prev,
      [grupoKey]: prev[grupoKey].map((f, i) => i === index ? { ...f, privada: val } : f),
    }));
  };

  // Aplana fotos en orden de grupo → [{ dataURL, descripcion, privada, area }]
  const fotosAplanadas = () =>
    GRUPOS_FOTOS.flatMap(g => fotosPorGrupo[g.key].map((f, i) => ({
      ...f,
      area: g.key,
      grupoKey: g.key,
      idx: i,
    })));

  const otraCarga = () => {
    setEdificio(null); setNombreBusqueda(''); setPaso(0);
    setFotosPorGrupo(fotosVacias()); setExito(false); setError('');
  };

  const guardar = async () => {
    if (!edificio || totalFotos === 0) return;
    setGuardando(true);
    setError('');
    try {
      const planas = fotosAplanadas();
      const detalleNuevo = [];
      const urlsTodas = [];
      const urlsPublicas = [];
      for (let i = 0; i < planas.length; i++) {
        const f = planas[i];
        setProgreso(es ? `Subiendo foto ${i + 1} de ${planas.length}...` : `Uploading photo ${i + 1} of ${planas.length}...`);
        try {
          const file = dataURLaFile(f.dataURL, `evidencia_${Date.now()}_${i}.jpg`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          if (file_url) {
            detalleNuevo.push({ url: file_url, area: f.area, nota: (f.descripcion || '').trim(), piso: '', privada: !!f.privada });
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

  // ── Paso 0 (previo al wizard): elegir el edificio ──
  if (!edificio) return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs font-bold text-blue-800 mb-0.5">📷 {es ? 'Cargar fotos de un edificio' : 'Upload building photos'}</p>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          {es ? 'Busca el edificio y te guiaremos paso a paso para subir la evidencia correcta, sin necesidad de declarar el resultado final de la inspección.'
              : 'Search for the building and we will guide you step by step to upload the right evidence, without needing to declare the final inspection result.'}
        </p>
      </div>
      <BuscadorEdificio es={es} valor={nombreBusqueda} onCambiarNombre={setNombreBusqueda} onSeleccionar={setEdificio} seleccionado={edificio} />
    </div>
  );

  const grupoActual = paso < GRUPOS_FOTOS.length ? GRUPOS_FOTOS[paso] : null;
  const planas = fotosAplanadas();

  return (
    <div className="space-y-4">
      {/* Edificio elegido */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase">{es ? 'Cargando fotos para' : 'Uploading photos for'}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{edificio.nombre_lugar || (es ? 'Sin nombre' : 'No name')}</p>
          <p className="text-xs text-gray-400 truncate">{[edificio.direccion, edificio.ciudad].filter(Boolean).join(' · ')}</p>
        </div>
        <button onClick={otraCarga} className="text-xs text-gray-400 underline cursor-pointer flex-shrink-0">{es ? 'Cambiar' : 'Change'}</button>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
            {es ? `Paso ${paso + 1} de ${TOTAL_PASOS}` : `Step ${paso + 1} of ${TOTAL_PASOS}`}
          </p>
          <p className="text-[11px] text-gray-500">{totalFotos}/{MAX_FOTOS_TOTAL} {es ? 'fotos' : 'photos'}</p>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((paso + 1) / TOTAL_PASOS) * 100}%` }} />
        </div>
      </div>

      {/* Pasos de grupos de fotos */}
      {grupoActual && (
        <GrupoFotos
          grupo={grupoActual}
          es={es}
          fotos={fotosPorGrupo[grupoActual.key]}
          subiendo={comprimiendoGrupo === grupoActual.key}
          onAgregar={(files) => agregarFotos(grupoActual.key, files)}
          onQuitar={(i) => quitarFoto(grupoActual.key, i)}
          onDescribir={(i, t) => describirFoto(grupoActual.key, i, t)}
          disabled={totalFotos >= MAX_FOTOS_TOTAL}
        />
      )}

      {/* Paso final: revisión + privacidad + guardar */}
      {paso === GRUPOS_FOTOS.length && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-gray-900">✅ {es ? 'Revisión final' : 'Final review'}</p>
          {planas.length === 0 ? (
            <p className="text-xs text-gray-400">{es ? 'No agregaste fotos todavía. Vuelve a un paso anterior para tomar alguna.' : "You haven't added photos yet. Go back to a previous step to take some."}</p>
          ) : (
            <div className="space-y-2">
              {planas.map((f) => (
                <div key={`${f.grupoKey}-${f.idx}`} className="flex gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={f.dataURL} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => quitarFoto(f.grupoKey, f.idx)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer">
                      <X size={9} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-700">{es ? GRUPOS_FOTOS.find(g => g.key === f.grupoKey)?.es.titulo : GRUPOS_FOTOS.find(g => g.key === f.grupoKey)?.en.titulo}</p>
                    {f.descripcion && <p className="text-[11px] text-gray-500 truncate">{f.descripcion}</p>}
                    <label className="flex items-center gap-1.5 text-[10px] text-gray-500 cursor-pointer select-none mt-1">
                      <input type="checkbox" checked={!!f.privada} onChange={e => marcarPrivada(f.grupoKey, f.idx, e.target.checked)} className="rounded" />
                      {es ? '🔒 Mantener esta foto privada' : '🔒 Keep this photo private'}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      {guardando && progreso && (
        <p className="text-[11px] text-blue-700 text-center flex items-center justify-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> {progreso}
        </p>
      )}

      {/* Navegación */}
      <div className="flex gap-2">
        {paso > 0 && (
          <button type="button" onClick={() => setPaso(p => p - 1)}
            className="flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 text-sm font-semibold py-3 px-4 rounded-xl cursor-pointer hover:bg-gray-50">
            <ChevronLeft size={15} /> {es ? 'Atrás' : 'Back'}
          </button>
        )}
        {paso < GRUPOS_FOTOS.length ? (
          <button type="button" onClick={() => setPaso(p => p + 1)}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl cursor-pointer">
            {es ? 'Siguiente paso' : 'Next step'} <ChevronRight size={15} />
          </button>
        ) : (
          <button type="button" onClick={guardar} disabled={totalFotos === 0 || guardando || comprimiendoGrupo}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer">
            {guardando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {es ? 'Guardar fotos en la ficha' : 'Save photos to the record'}
          </button>
        )}
      </div>
      {paso === GRUPOS_FOTOS.length && totalFotos === 0 && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">{es ? 'Agrega al menos una foto para guardar.' : 'Add at least one photo to save.'}</p>
      )}
      {comprimiendoGrupo && (
        <p className="text-[11px] text-gray-500 text-center">📷 {es ? 'Comprimiendo fotos...' : 'Compressing photos...'}</p>
      )}
    </div>
  );
}