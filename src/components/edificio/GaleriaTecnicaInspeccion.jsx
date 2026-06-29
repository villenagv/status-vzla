import { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ImagenProxy from '@/components/svzla/ImagenProxy';
import { AREAS_INSPECCION, GRUPOS_AREA, areaLabel } from '@/components/portal/areasInspeccion';

/**
 * GaleriaTecnicaInspeccion
 * Muestra las fotos de la inspección presencial organizadas y EN ORDEN por
 * grupo de área (Estructural → Fachada → Instalaciones → Acabados → Otros),
 * indicando para cada foto el área marcada y su nota técnica.
 * Al final completa con TODAS las demás fotos del edificio (foto_urls) que no
 * estén ya clasificadas en el detalle de inspección.
 *
 * Solo lectura. Mobile-first y bajo consumo: miniaturas livianas + lightbox
 * que carga la foto completa solo al abrir.
 *
 * Props: edificio (ReportesDano), es (bool idioma)
 */

// Orden de grupos según areasInspeccion (con un icono por grupo)
const GRUPO_ICON = { estructural: '🏗️', fachada: '🧱', instalaciones: '🔌', acabados: '🪵', otros: '📋' };
const grupoDeArea = (val) => (AREAS_INSPECCION.find(a => a.val === val)?.grupo) || 'otros';

export default function GaleriaTecnicaInspeccion({ edificio, es }) {
  const [lightbox, setLightbox] = useState(null); // { lista: [{url,area,nota}], idx }

  const { grupos, complementarias, totalInspeccion } = useMemo(() => {
    const detalle = Array.isArray(edificio.inspeccion_detalle_fotos) ? edificio.inspeccion_detalle_fotos.filter(f => f?.url) : [];

    // Agrupar el detalle por grupo de área, preservando el orden de captura dentro de cada uno
    const porGrupo = {};
    detalle.forEach((f) => {
      const g = grupoDeArea(f.area);
      if (!porGrupo[g]) porGrupo[g] = [];
      porGrupo[g].push(f);
    });

    // Ordenar por la jerarquía definida en GRUPOS_AREA
    const grupos = GRUPOS_AREA
      .filter(g => porGrupo[g.val]?.length)
      .map(g => ({ ...g, fotos: porGrupo[g.val] }));

    // Fotos del edificio que NO están ya en el detalle de inspección
    const urlsDetalle = new Set(detalle.map(f => f.url));
    const complementarias = (edificio.foto_urls || []).filter(url => url && !urlsDetalle.has(url));

    return { grupos, complementarias, totalInspeccion: detalle.length };
  }, [edificio.inspeccion_detalle_fotos, edificio.foto_urls]);

  // Si no hay nada que mostrar, no renderizamos la sección
  if (totalInspeccion === 0 && complementarias.length === 0) return null;

  const abrir = (lista, idx) => setLightbox({ lista, idx });
  const cerrar = () => setLightbox(null);
  const mover = (delta) => setLightbox(lb => ({ ...lb, idx: (lb.idx + delta + lb.lista.length) % lb.lista.length }));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">📸</span>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {es ? 'Galería técnica de la inspección' : 'Technical inspection gallery'}
        </h2>
      </div>
      <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
        {es ? 'Fotos tomadas durante la inspección, agrupadas por área del edificio. Toca una foto para verla completa.'
             : 'Photos taken during the inspection, grouped by building area. Tap a photo to view it full size.'}
      </p>

      {/* Grupos por área, en orden */}
      <div className="space-y-4">
        {grupos.map(g => (
          <div key={g.val}>
            <p className="text-[11px] font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <span>{GRUPO_ICON[g.val] || '📋'}</span>
              {es ? g.es : g.en}
              <span className="text-[10px] font-semibold text-gray-400">({g.fotos.length})</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {g.fotos.map((f, i) => (
                <button key={`${g.val}-${i}`} onClick={() => abrir(g.fotos, i)}
                  className="text-left cursor-pointer group p-0 bg-transparent border-0">
                  <div className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200 group-hover:opacity-80">
                    <ImagenProxy src={f.url} alt={areaLabel(f.area, es)} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[9px] font-semibold text-gray-600 mt-1 leading-tight">{areaLabel(f.area, es)}</p>
                  {f.nota && <p className="text-[9px] text-gray-400 leading-tight line-clamp-2">{f.nota}</p>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fotos complementarias del edificio (sin área específica) */}
      {complementarias.length > 0 && (
        <div className={grupos.length > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
          <p className="text-[11px] font-bold text-gray-700 mb-2 flex items-center gap-1.5">
            <span>🗂️</span>
            {es ? 'Otras fotos del edificio' : 'Other building photos'}
            <span className="text-[10px] font-semibold text-gray-400">({complementarias.length})</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {complementarias.map((url, i) => (
              <button key={`comp-${i}`} onClick={() => abrir(complementarias.map(u => ({ url: u })), i)}
                className="cursor-pointer group p-0 bg-transparent border-0">
                <div className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200 group-hover:opacity-80">
                  <ImagenProxy src={url} alt="" className="w-full h-full object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={cerrar}>
          <button onClick={cerrar} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white z-10 cursor-pointer">
            <X size={18} />
          </button>
          {lightbox.lista.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); mover(-1); }}
                className="absolute left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white z-10 cursor-pointer">
                <ChevronLeft size={20} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); mover(1); }}
                className="absolute right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white z-10 cursor-pointer">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <ImagenProxy src={lightbox.lista[lightbox.idx].url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            {(lightbox.lista[lightbox.idx].area || lightbox.lista[lightbox.idx].nota) && (
              <div className="mt-3 text-center px-4">
                {lightbox.lista[lightbox.idx].area && (
                  <p className="text-white text-sm font-bold">{areaLabel(lightbox.lista[lightbox.idx].area, es)}</p>
                )}
                {lightbox.lista[lightbox.idx].nota && (
                  <p className="text-white/70 text-xs mt-0.5">{lightbox.lista[lightbox.idx].nota}</p>
                )}
              </div>
            )}
          </div>
          {lightbox.lista.length > 1 && (
            <p className="absolute bottom-6 text-white/60 text-xs font-medium">{lightbox.idx + 1} / {lightbox.lista.length}</p>
          )}
        </div>
      )}
    </div>
  );
}