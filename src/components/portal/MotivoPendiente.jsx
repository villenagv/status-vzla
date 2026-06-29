import { useState } from 'react';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * MotivoPendiente
 * Permite al especialista declarar POR QUÉ una inspección sigue pendiente,
 * incluyendo el caso "no se ha logrado contacto con el reportante".
 * Guarda inspeccion_estado_pendiente + inspeccion_motivo_pendiente y deja
 * un evento en la línea de tiempo.
 *
 * Props:
 *  - reporte, perfil, es, onActualizado
 */

export const MOTIVO_OPTS = [
  { val: 'sin_contacto',         es: '📵 No se logró contacto',       en: '📵 No contact reached'        },
  { val: 'acceso_no_autorizado', es: '🚪 Acceso no autorizado',       en: '🚪 Access not authorized'     },
  { val: 'zona_insegura',        es: '☠️ Zona insegura',              en: '☠️ Unsafe area'               },
  { val: 'esperando_maquinaria', es: '🚜 Esperando maquinaria',       en: '🚜 Waiting for machinery'     },
  { val: 'reprogramada',         es: '📅 Reprogramada',               en: '📅 Rescheduled'               },
  { val: 'otro',                 es: '✏️ Otro motivo',                en: '✏️ Other reason'              },
];

export const MOTIVO_LABEL = (val, es) => {
  const o = MOTIVO_OPTS.find(x => x.val === val);
  return o ? (es ? o.es : o.en) : val;
};

export default function MotivoPendiente({ reporte, perfil, es, onActualizado }) {
  const actual = reporte.inspeccion_estado_pendiente && reporte.inspeccion_estado_pendiente !== 'ninguno' ? reporte.inspeccion_estado_pendiente : '';
  const [motivo, setMotivo] = useState(actual);
  const [detalle, setDetalle] = useState(reporte.inspeccion_motivo_pendiente || '');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    if (!motivo) return;
    setEnviando(true);
    try {
      await base44.entities.ReportesDano.update(reporte.id, {
        inspeccion_estado_pendiente: motivo,
        inspeccion_motivo_pendiente: detalle.trim(),
      });
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: reporte.id,
        tipo_sitio: 'edificio',
        tipo_accion: 'tengo_actualizacion',
        descripcion: `[INSPECCIÓN PENDIENTE] ${MOTIVO_LABEL(motivo, es)}.${detalle.trim() ? ' ' + detalle.trim() : ''}`,
        reportante_nombre: perfil.user_nombre || perfil.user_email,
        fuente: 'especialista',
        es_verificado: true,
      });
      onActualizado?.(reporte.id, { inspeccion_estado_pendiente: motivo, inspeccion_motivo_pendiente: detalle.trim() });
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch {}
    setEnviando(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
      <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
        <Clock size={12} /> {es ? '¿Por qué sigue pendiente?' : 'Why is it still pending?'}
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {MOTIVO_OPTS.map(o => (
          <button key={o.val} type="button" onClick={() => setMotivo(o.val)}
            className={`py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer text-left transition-colors ${motivo === o.val ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300'}`}>
            {es ? o.es : o.en}
          </button>
        ))}
      </div>
      <textarea value={detalle} onChange={e => setDetalle(e.target.value)} rows={2}
        placeholder={es ? 'Detalle (opcional): teléfono no responde, intentos hechos...' : 'Detail (optional): phone not answering, attempts made...'}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-amber-500" />
      <button type="button" onClick={guardar} disabled={!motivo || enviando}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
        {enviando ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
        {es ? 'Guardar motivo' : 'Save reason'}
      </button>
      {ok && <p className="text-xs text-center font-semibold text-green-600">{es ? 'Motivo guardado ✓' : 'Reason saved ✓'}</p>}
    </div>
  );
}