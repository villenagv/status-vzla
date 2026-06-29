import { useState } from 'react';
import { Loader2, UploadCloud, Trash2, CheckCircle2, AlertCircle, Clock, Building2, WifiOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { dataURLaFile } from '@/lib/comprimirFoto';
import { MAX_FOTOS_TOTAL } from './guiaFotos';

/**
 * Panel de "Cola de envíos" para inspecciones guardadas sin conexión.
 * Permite subir una o TODAS las inspecciones pendientes cuando hay señal.
 * Cada item.data ya trae los campos de ReportesDano; item.fotos son base64 (dataURL) por subir.
 */
export default function ColaInspecciones({ es, offline, items, pendientes, onMarcar, onEliminar, onLimpiar }) {
  const [subiendoId, setSubiendoId] = useState(null);
  const [subiendoTodo, setSubiendoTodo] = useState(false);

  if (!items.length) return null;

  // Sube una inspección: convierte sus fotos base64 → archivos, las sube, crea el ReportesDano
  const subirUna = async (item) => {
    const urls = [];
    for (const foto of (item.fotos || [])) {
      try {
        const file = dataURLaFile(foto.dataURL, `inspeccion_${Date.now()}.jpg`);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) urls.push(file_url);
      } catch { /* seguimos con las demás */ }
    }
    await base44.entities.ReportesDano.create({
      ...item.data,
      foto_urls: urls.slice(0, MAX_FOTOS_TOTAL),
      triage_estado: 'pendiente_triage',
      requiere_inspeccion_presencial: true,
      estado_verificacion: 'recibido',
      nivel_verificacion: 'sin_verificar',
      fuente: 'solicitud_inspeccion',
    });
  };

  const handleUna = async (item) => {
    if (offline) return;
    setSubiendoId(item.id);
    try {
      await subirUna(item);
      onMarcar(item.id, 'sincronizado');
    } catch {
      onMarcar(item.id, 'error', es ? 'No se pudo subir' : 'Could not upload');
    }
    setSubiendoId(null);
  };

  const handleTodo = async () => {
    if (offline) return;
    setSubiendoTodo(true);
    for (const item of pendientes) {
      setSubiendoId(item.id);
      try {
        await subirUna(item);
        onMarcar(item.id, 'sincronizado');
      } catch {
        onMarcar(item.id, 'error', es ? 'No se pudo subir' : 'Could not upload');
      }
    }
    setSubiendoId(null);
    setSubiendoTodo(false);
  };

  const hayPendientes = pendientes.length > 0;
  const haySincronizados = items.some(i => i.status === 'sincronizado');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <UploadCloud size={16} /> {es ? 'Cola de envíos' : 'Upload queue'}
          <span className="text-xs font-semibold text-gray-500">({pendientes.length} {es ? 'pendiente(s)' : 'pending'})</span>
        </p>
        {haySincronizados && (
          <button type="button" onClick={onLimpiar}
            className="text-[11px] text-gray-400 hover:text-gray-700 cursor-pointer">
            {es ? 'Limpiar enviados' : 'Clear sent'}
          </button>
        )}
      </div>

      {offline && hayPendientes && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <WifiOff size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es ? 'Sin conexión. Tus inspecciones están guardadas en este dispositivo. Cuando recuperes señal podrás subir todo.' : 'No connection. Your inspections are saved on this device. When you regain signal you can upload everything.'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => {
          const enProceso = subiendoId === item.id;
          const nombre = item.data?.nombre_lugar?.trim() || (es ? 'Edificio sin nombre' : 'Unnamed building');
          const lugar = [item.data?.direccion, item.data?.ciudad].filter(Boolean).join(' · ');
          const numFotos = (item.fotos || []).length;
          return (
            <div key={item.id} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2.5">
              <Building2 size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {lugar || (es ? 'Sin dirección' : 'No address')} · {numFotos} {es ? 'fotos' : 'photos'}
                </p>
                {item.status === 'error' && (
                  <p className="text-[11px] text-red-600">{item.error || (es ? 'Error al subir' : 'Upload error')}</p>
                )}
              </div>

              {enProceso ? (
                <Loader2 size={16} className="animate-spin text-blue-600 flex-shrink-0" />
              ) : item.status === 'sincronizado' ? (
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              ) : (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.status === 'error'
                    ? <AlertCircle size={15} className="text-red-500" />
                    : <Clock size={15} className="text-amber-500" />}
                  <button type="button" onClick={() => handleUna(item)} disabled={offline || subiendoTodo}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-40 cursor-pointer px-1">
                    {es ? 'Subir' : 'Upload'}
                  </button>
                  <button type="button" onClick={() => onEliminar(item.id)} disabled={subiendoTodo}
                    className="text-gray-300 hover:text-red-500 disabled:opacity-40 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hayPendientes && (
        <button type="button" onClick={handleTodo} disabled={offline || subiendoTodo}
          className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer">
          {subiendoTodo ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
          {es ? `Subir todo (${pendientes.length})` : `Upload all (${pendientes.length})`}
        </button>
      )}
    </div>
  );
}