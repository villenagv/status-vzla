import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

/**
 * Props:
 *   category: 'emergencias' | 'edificios' | 'personas' | 'puntos-ayuda'
 *   caseId: string  (e.g. report ID or temp ID)
 *   caseLabel: string (human-readable folder label, e.g. "Caso #001 - Caracas")
 *   maxFiles: number (default 5)
 *   onUploaded: (urls: string[]) => void
 *   disabled: boolean
 */
export default function FotosDragDrop({ category = 'emergencias', caseId, caseLabel, maxFiles = 5, onUploaded, disabled }) {
  const { lang } = useLang();
  const [files, setFiles] = useState([]); // { file, status: 'pending'|'uploading'|'done'|'error', url, preview }
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const es = lang === 'es';
  const labels = {
    drop: es ? 'Arrastra fotos aquí' : 'Drop photos here',
    or: es ? 'o' : 'or',
    select: es ? 'Seleccionar fotos' : 'Select photos',
    max: es ? `Máx. ${maxFiles} fotos` : `Max. ${maxFiles} photos`,
    uploading: es ? 'Subiendo...' : 'Uploading...',
    done: es ? 'Guardado en Drive' : 'Saved to Drive',
    error: es ? 'Error al subir' : 'Upload failed',
    optional: es ? 'Fotos opcionales · No es obligatorio' : 'Photos optional · Not required',
    limitReached: es ? `Límite de ${maxFiles} fotos alcanzado` : `${maxFiles} photo limit reached`,
  };

  const maxWidth = category === 'edificios' || category === 'emergencias' ? 1600 : 800;
  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
        URL.revokeObjectURL(url);
        resolve(compressed);
      }, 'image/jpeg', 0.85);
    };
    img.src = url;
  });
  const addFiles = useCallback(async (newFiles) => {
    const remaining = maxFiles - files.length;
    if (remaining <= 0) return;
    const originals = Array.from(newFiles).slice(0, remaining);
    const compressed = await Promise.all(originals.map(f => compressImage(f)));
    const toAdd = compressed.map(f => ({
      file: f,
      status: 'pending',
      url: null,
      preview: URL.createObjectURL(f),
      id: Math.random().toString(36).slice(2),
    }));
    setFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(item => uploadFile(item));
  }, [files.length, maxFiles, caseId, caseLabel, category]);

  const uploadFile = async (item) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));
    try {
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('category', category);
      fd.append('caseId', caseId || 'nuevo');
      fd.append('caseLabel', caseLabel || `${category}-nuevo`);

      const res = await base44.functions.invoke('driveUpload', fd);
      const data = res.data;
      if (data.success) {
        setFiles(prev => {
          const updated = prev.map(f => f.id === item.id ? { ...f, status: 'done', url: data.viewUrl } : f);
          const doneUrls = updated.filter(f => f.status === 'done').map(f => f.url);
          onUploaded && onUploaded(doneUrls);
          return updated;
        });
      } else {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
      }
    } catch {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
    }
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const doneUrls = updated.filter(f => f.status === 'done').map(f => f.url);
      onUploaded && onUploaded(doneUrls);
      return updated;
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const atLimit = files.length >= maxFiles;

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      {!atLimit && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            dragging ? 'border-[#1A1F2E] bg-blue-50' : 'border-[#EDEBE8] bg-white hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload size={22} className="mx-auto text-gray-400 mb-1" />
          <p className="text-sm font-medium text-gray-600">{labels.drop}</p>
          <p className="text-xs text-gray-400">{labels.or} <span className="underline text-[#1A1F2E]">{labels.select}</span></p>
          <p className="text-[10px] text-gray-400 mt-1">{labels.optional}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async e => await addFiles(e.target.files)}
            disabled={disabled}
          />
        </div>
      )}

      {atLimit && (
        <p className="text-xs text-[#D48C2E] font-medium text-center py-1">{labels.limitReached}</p>
      )}

      {/* Thumbnails */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map(f => (
            <div key={f.id} className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img src={f.preview} alt="" className="w-full h-full object-cover" />
              {/* Status overlay */}
              {f.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={18} className="text-white animate-spin" />
                </div>
              )}
              {f.status === 'done' && (
                <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5">
                  <CheckCircle size={12} className="text-white" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center gap-1">
                  <AlertCircle size={16} className="text-white" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); uploadFile(f); }}
                    className="text-[10px] text-white underline"
                  >{lang === 'es' ? 'Reintentar' : 'Retry'}</button>
                </div>
              )}
              {/* Remove */}
              {f.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeFile(f.id); }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-black/80"
                >
                  <X size={10} className="text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}