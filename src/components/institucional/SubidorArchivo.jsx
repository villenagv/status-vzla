import { useState } from 'react';
import { Upload, CheckCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SubidorArchivo({ es }) {
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setArchivo(file);
    setOk(false);
    setError('');
    setFileUrl('');
  };

  const subir = async () => {
    if (!archivo) return;
    setSubiendo(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      setFileUrl(file_url);
      setOk(true);
    } catch {
      setError(es
        ? 'No se pudo subir el archivo. Verifica tu conexión e intenta de nuevo.'
        : 'Could not upload the file. Check your connection and try again.');
    }
    setSubiendo(false);
  };

  const reset = () => {
    setArchivo(null);
    setOk(false);
    setError('');
    setFileUrl('');
  };

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Upload size={16} className="text-[#D48C2E]" />
        <h3 className="text-sm font-bold text-[#1A1F2E]">
          {es ? 'Opción A — Guardar archivo original' : 'Option A — Save original file'}
        </h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {es
          ? 'Sube tu archivo Excel, CSV o foto tal como está. Lo guardamos de forma segura sin procesarlo. Útil cuando tienes poco tiempo o mala señal.'
          : 'Upload your Excel, CSV or photo as-is. We save it securely without processing it. Useful when you are short on time or have poor signal.'}
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <p className="text-[11px] text-blue-800 leading-relaxed">
          📋 {es
            ? 'Acepta: Excel (.xlsx), CSV (.csv), imagen (foto de lista escrita a mano). No se publicará automáticamente — quedará pendiente de revisión.'
            : 'Accepts: Excel (.xlsx), CSV (.csv), image (photo of handwritten list). Will not be published automatically — will remain pending review.'}
        </p>
      </div>

      {!ok ? (
        <>
          <label
            htmlFor="subidor-file"
            className="flex flex-col items-center gap-2 border-2 border-dashed border-[#D48C2E] rounded-xl p-4 cursor-pointer hover:bg-orange-50 transition-colors"
          >
            <FileText size={24} className="text-[#D48C2E]" />
            <p className="text-sm font-semibold text-[#1A1F2E] text-center">
              {archivo ? `📄 ${archivo.name}` : (es ? 'Toca para seleccionar archivo o foto' : 'Tap to select file or photo')}
            </p>
            <p className="text-[10px] text-gray-400">.xlsx · .csv · .jpg · .png</p>
          </label>
          <input
            id="subidor-file"
            type="file"
            accept=".csv,.xlsx,.xls,.jpg,.jpeg,.png,.txt"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />

          {archivo && !ok && (
            <button
              onClick={subir}
              disabled={subiendo}
              className="w-full bg-[#D48C2E] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {subiendo
                ? <><Loader2 size={14} className="animate-spin" /> {es ? 'Subiendo...' : 'Uploading...'}</>
                : <><Upload size={14} /> {es ? 'Guardar archivo sin procesar' : 'Save file without processing'}</>}
            </button>
          )}

          {error && (
            <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3">
              <AlertCircle size={14} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#B83A52]">{error}</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-600" />
            <p className="text-xs font-bold text-green-800">
              {es ? '¡Archivo guardado correctamente!' : 'File saved successfully!'}
            </p>
          </div>
          <p className="text-[11px] text-green-700">
            {es
              ? 'Quedará disponible para revisión interna. No se publicará automáticamente.'
              : 'It will be available for internal review. It will not be published automatically.'}
          </p>
          <button onClick={reset} className="text-[11px] text-green-600 underline cursor-pointer mt-1">
            {es ? 'Subir otro archivo' : 'Upload another file'}
          </button>
        </div>
      )}
    </div>
  );
}