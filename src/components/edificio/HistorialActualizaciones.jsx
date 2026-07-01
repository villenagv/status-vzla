import { ACCION_ESTILOS, ACCION_LABELS, tiempoRelativo } from './edificioDetalleConfig';

export default function HistorialActualizaciones({ actualizacionesCiudadanas, actualizacionesOrdenadas, es, t }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
      <div className="flex items-center mb-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">🕐 {t('Historial de actualizaciones e información', 'Update history & info', 'Histórico de atualizações')}{actualizacionesCiudadanas.length > 0 ? ` (${actualizacionesCiudadanas.length})` : ''}</h2>
      </div>
      {actualizacionesCiudadanas.length === 0 ? (
        <p className="text-xs text-gray-400 italic">{t('Sin actualizaciones registradas aún. Sé el primero en reportar.', 'No updates recorded yet. Be the first to report.', 'Sem atualizações registradas ainda. Seja o primeiro a reportar.')}</p>
      ) : (
        <div className="space-y-2">
          {actualizacionesOrdenadas.map((a) => {
            const s = ACCION_ESTILOS[a.tipo_accion] || { icon: '📋', color: '#555' };
            const lbl = ACCION_LABELS[a.tipo_accion];
            const esUrgente = ['personas_atrapadas', 'reportar_urgencia'].includes(a.tipo_accion);
            return (
              <div key={a.id} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: s.color }} />
                <div className={`flex-1 border rounded-xl px-3 py-2 ${esUrgente ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <span>{s.icon}</span>
                      <p className="text-xs font-semibold" style={{ color: s.color }}>{lbl ? (es ? lbl.es : lbl.en) : a.tipo_accion}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{tiempoRelativo(a.created_date, es)}</span>
                  </div>
                  {a.descripcion && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{a.descripcion}</p>}
                  {a.nivel_dano_anterior && a.nivel_dano_nuevo && a.nivel_dano_anterior !== a.nivel_dano_nuevo && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {t('Daño:', 'Damage:', 'Dano:')} {a.nivel_dano_anterior} → <strong className="text-gray-700">{a.nivel_dano_nuevo}</strong>
                    </p>
                  )}
                  {a.reportante_nombre && (
                    <p className="text-[10px] text-gray-500 mt-0.5">👤 {a.reportante_nombre}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}