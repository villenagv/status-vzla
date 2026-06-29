import { useState } from 'react';
import { useLowBw } from '@/lib/LowBwContext';
import ImagenProxy from '@/components/svzla/ImagenProxy';
import SelloRiesgo, { selloKey } from '@/components/edificio/SelloRiesgo';

// Iconos y colores por tipo de estructura cuando no hay foto
const TIPO_VISUAL = {
  edificio_residencial: { icon: '🏠', bg: '#1E3A5F', label: { es: 'Residencial', en: 'Residential' } },
  hospital:             { icon: '🏥', bg: '#7B2020', label: { es: 'Hospital',    en: 'Hospital'     } },
  escuela:              { icon: '🏫', bg: '#14532D', label: { es: 'Escuela',     en: 'School'       } },
  iglesia:              { icon: '⛪', bg: '#3B1F6E', label: { es: 'Iglesia',     en: 'Church'       } },
  comercio:             { icon: '🏪', bg: '#92400E', label: { es: 'Comercio',   en: 'Business'     } },
  calle_via:            { icon: '🛣️', bg: '#374151', label: { es: 'Vía',        en: 'Road'         } },
  puente:               { icon: '🌉', bg: '#1F4E79', label: { es: 'Puente',     en: 'Bridge'       } },
  servicio_publico:     { icon: '🔌', bg: '#1A3A1A', label: { es: 'Servicio',   en: 'Utility'      } },
  refugio:              { icon: '🏕️', bg: '#065F46', label: { es: 'Refugio',    en: 'Shelter'      } },
  otro:                 { icon: '🏗️', bg: '#1C2128', label: { es: 'Edificio',   en: 'Building'     } },
};

const DANO_OVERLAY = {
  critico:     { text: '🚨 CRÍTICO',   en: '🚨 CRITICAL',   bg: 'rgba(153,27,27,0.85)'  },
  colapsado:   { text: '💥 COLAPSADO', en: '💥 COLLAPSED',  bg: 'rgba(69,10,10,0.90)'   },
  grave:       { text: '🔴 GRAVE',     en: '🔴 SEVERE',     bg: 'rgba(185,28,28,0.75)'  },
  moderado:    { text: '🟠 MODERADO',  en: '🟠 MODERATE',   bg: 'rgba(194,65,12,0.65)'  },
  leve:        { text: '🟡 LEVE',      en: '🟡 MINOR',      bg: 'rgba(161,98,7,0.55)'   },
  no_evaluado: { text: '⚪ SIN DATO',  en: '⚪ UNKNOWN',     bg: 'rgba(75,85,99,0.55)'   },
};

/**
 * EdificioImagen
 * Muestra la primera foto del edificio (con mini-carrusel si hay varias),
 * o un placeholder visual por tipo de estructura si no hay fotos.
 * En modo bajo consumo muestra solo el placeholder.
 *
 * Props:
 *  - fotoUrls: string[]  (foto_urls del reporte)
 *  - tipoEstructura: string
 *  - nivelDano: string
 *  - height: number (px, default 120)
 *  - lang: 'es'|'en'|'pt'
 *  - sinFotoNudge: bool — muestra aviso de "subir fachada" si true y no hay fotos
 *  - mostrarMiniaturasExtra: bool — muestra miniaturas de fotos 2+ debajo (solo en vista grid)
 *  - fotoUrlsExtra: string[] — fotos adicionales para miniaturas (si se pasa, se usa en vez de fotoUrls[1:])
 */
export default function EdificioImagen({ fotoUrls = [], tipoEstructura, nivelDano, riesgo, height = 120, lang = 'es', sinFotoNudge = false, mostrarMiniaturasExtra = false, fotoUrlsExtra }) {
  const { lowBw } = useLowBw();
  const [idx, setIdx] = useState(0);
  const [cargada, setCargada] = useState(false);
  const [error, setError] = useState(false);

  const es = lang !== 'en';
  const visual = TIPO_VISUAL[tipoEstructura] || TIPO_VISUAL.otro;
  const overlay = DANO_OVERLAY[nivelDano];
  const fotos = (fotoUrls || []).filter(Boolean);
  const hayFotos = fotos.length > 0;
  // Sello oficial: aparece si el especialista ya clasificó el riesgo (o por nivel de daño)
  const haySello = !!selloKey(riesgo, nivelDano);
  const sello = haySello && !lowBw ? (
    <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 2 }}>
      <SelloRiesgo riesgo={riesgo} nivelDano={nivelDano} size={Math.min(48, height * 0.42)} es={es} />
    </div>
  ) : null;

  // Placeholder
  if (!hayFotos || lowBw) {
    return (
      <div
        style={{ height, background: visual.bg, position: 'relative', overflow: 'hidden', flexShrink: 0 }}
        className="w-full flex flex-col items-center justify-center gap-1"
      >
        {sello}
        <span style={{ fontSize: height > 80 ? 32 : 20 }}>{visual.icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {es ? visual.label.es : visual.label.en}
        </span>
        {/* Overlay nivel daño */}
        {overlay && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: overlay.bg, padding: '3px 8px', textAlign: 'center',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
              {es ? overlay.text : overlay.en}
            </span>
          </div>
        )}
        {/* Nudge si no hay fotos */}
        {sinFotoNudge && !hayFotos && !lowBw && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            background: 'rgba(245,197,24,0.18)', border: '1px solid rgba(245,197,24,0.45)',
            borderRadius: 6, padding: '2px 6px',
          }}>
            <span style={{ fontSize: 8, color: '#FCD34D', fontWeight: 700 }}>📷 {es ? 'Sin foto' : 'No photo'}</span>
          </div>
        )}
      </div>
    );
  }

  // Con fotos — mini carrusel
  const prev = (ev) => { ev.stopPropagation(); setIdx(i => Math.max(0, i - 1)); setError(false); setCargada(false); };
  const next = (ev) => { ev.stopPropagation(); setIdx(i => Math.min(fotos.length - 1, i + 1)); setError(false); setCargada(false); };

  const fotosExtra = fotoUrlsExtra || fotos.slice(1);

  return (
    <>
      <div style={{ height, position: 'relative', overflow: 'hidden', flexShrink: 0, background: visual.bg }} className="w-full">
        {sello}
        {/* Imagen */}
        {!error ? (
          <ImagenProxy
            src={fotos[idx]}
            alt=""
            onLoad={() => setCargada(true)}
            onError={() => setError(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: cargada ? 1 : 0, transition: 'opacity 200ms',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ fontSize: 28 }}>{visual.icon}</span>
          </div>
        )}

        {/* Skeleton mientras carga */}
        {!cargada && !error && (
          <div style={{ position: 'absolute', inset: 0, background: visual.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28, opacity: 0.4 }}>{visual.icon}</span>
          </div>
        )}

        {/* Overlay nivel daño */}
        {overlay && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: overlay.bg, padding: '3px 8px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
              {es ? overlay.text : overlay.en}
            </span>
          </div>
        )}

        {/* Contador de fotos */}
        {fotos.length > 1 && (
          <div style={{
            position: 'absolute', top: 5, right: 5,
            background: 'rgba(0,0,0,0.55)', borderRadius: 10,
            padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>📷 {idx + 1}/{fotos.length}</span>
          </div>
        )}

        {/* Botones prev/next — solo si hay más de 1 foto */}
        {fotos.length > 1 && (
          <>
            {idx > 0 && (
              <button onClick={prev} style={{
                position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.50)', border: 'none', borderRadius: '50%',
                width: 22, height: 22, color: '#fff', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>‹</button>
            )}
            {idx < fotos.length - 1 && (
              <button onClick={next} style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.50)', border: 'none', borderRadius: '50%',
                width: 22, height: 22, color: '#fff', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>›</button>
            )}
          </>
        )}
      </div>

      {/* Miniaturas extra debajo de la foto principal */}
      {mostrarMiniaturasExtra && fotosExtra.length > 0 && (
        <div className="flex gap-1.5 p-2 bg-gray-50 border-t border-gray-100 overflow-x-auto">
          {fotosExtra.map((url, i) => (
            <div key={i} className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
              <ImagenProxy src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}