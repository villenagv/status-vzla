import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Sección expandible (acordeón) de la guía educativa de edificios.
// Las imágenes solo se renderizan cuando la sección está abierta (carga bajo demanda).
export default function SeccionGuia({ seccion, es }) {
  const [abierto, setAbierto] = useState(false);
  const [itemAbierto, setItemAbierto] = useState(null);

  return (
    <div className="rounded-2xl overflow-hidden border-2 mb-3" style={{ borderColor: seccion.border }}>
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
        style={{ background: seccion.bg }}
      >
        <span className="text-2xl flex-shrink-0">{seccion.emoji}</span>
        <p className="flex-1 text-sm font-black leading-tight" style={{ color: seccion.color }}>
          {es ? seccion.es : seccion.en}
        </p>
        <span style={{ color: seccion.color }}>
          {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {abierto && (
        <div style={{ background: '#FAFAFA' }}>
          {seccion.imagen && (
            <div className="p-3 border-b" style={{ borderColor: seccion.border }}>
              <img
                src={seccion.imagen}
                alt={es ? seccion.imagenAlt_es : seccion.imagenAlt_en}
                loading="lazy"
                className="w-full rounded-xl border border-gray-100"
              />
              {(seccion.imagenCaption_es || seccion.imagenCaption_en) && (
                <p className="text-[10px] text-gray-400 text-center mt-1.5">
                  {es ? seccion.imagenCaption_es : seccion.imagenCaption_en}
                </p>
              )}
            </div>
          )}
          {seccion.items.map((item, i) => (
            <div key={i} className="border-t" style={{ borderColor: seccion.border }}>
              <button
                onClick={() => setItemAbierto(itemAbierto === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white transition-colors"
              >
                <span className="text-sm font-semibold text-gray-800 flex-1">{es ? item.es : item.en}</span>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  {itemAbierto === i ? '▲' : '▼'}
                </span>
              </button>
              {itemAbierto === i && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-xl p-3 border border-gray-100">
                    {es ? item.desc_es : item.desc_en}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}