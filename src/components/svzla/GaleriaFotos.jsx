import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ImagenProxy from '@/components/svzla/ImagenProxy';

export default function GaleriaFotos({ urls }) {
  const [abierta, setAbierta] = useState(false);
  const [idx, setIdx] = useState(0);

  if (!urls?.length) return null;

  const abrir = (i) => { setIdx(i); setAbierta(true); };

  return (
    <>
      {/* Miniaturas */}
      <div className="flex gap-1.5 flex-wrap">
        {urls.slice(0, 3).map((url, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); abrir(i); }}
            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 p-0">
            <ImagenProxy src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
        {urls.length > 3 && (
          <button onClick={(e) => { e.stopPropagation(); abrir(3); }}
            className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-gray-600 cursor-pointer hover:bg-gray-200">
            +{urls.length - 3}
          </button>
        )}
      </div>

      {/* Lightbox */}
      {abierta && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setAbierta(false)}>
          <button onClick={() => setAbierta(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white z-10 cursor-pointer">
            <X size={18} />
          </button>
          {urls.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + urls.length) % urls.length); }}
                className="absolute left-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white z-10 cursor-pointer">
                <ChevronLeft size={20} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % urls.length); }}
                className="absolute right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white z-10 cursor-pointer">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div className="max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <ImagenProxy src={urls[idx]} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
          {urls.length > 1 && (
            <p className="absolute bottom-6 text-white/60 text-xs font-medium">{idx + 1} / {urls.length}</p>
          )}
        </div>
      )}
    </>
  );
}