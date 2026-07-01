import { ACCION_ESTILOS, ACCION_LABELS, tiempoRelativo } from './edificioDetalleConfig';

export default function PersonasReportadasSitio({ reportesPersonas, es, t }) {
  if (reportesPersonas.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">👥 {t('Personas reportadas en este sitio', 'People reported at this site', 'Pessoas reportadas neste local')}</p>
      <div className="space-y-2">
        {reportesPersonas.slice(0, 5).map(a => {
          const s = ACCION_ESTILOS[a.tipo_accion] || { icon: '📋', color: '#555' };
          const lbl = ACCION_LABELS[a.tipo_accion];
          return (
            <div key={`persona-${a.id}`} className="border border-gray-100 rounded-xl px-3 py-2 bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold" style={{ color: s.color }}>{s.icon} {lbl ? (es ? lbl.es : lbl.en) : a.tipo_accion}</p>
                <span className="text-[10px] text-gray-400">{tiempoRelativo(a.created_date, es)}</span>
              </div>
              {a.descripcion && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.descripcion}</p>}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 leading-relaxed">
        ⚠️ {t('No publiques nombres, documentos ni datos médicos sensibles.', 'Do not publish names, IDs, or sensitive medical details.', 'Não publique nomes, documentos ou dados médicos sensíveis.')}
      </p>
    </div>
  );
}