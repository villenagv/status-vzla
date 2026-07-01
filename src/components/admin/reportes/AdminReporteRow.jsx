import { Link } from 'react-router-dom';

const ESTADOS = ['recibido', 'verificado', 'duplicado', 'falso', 'resuelto'];

export default function AdminReporteRow({ reporte, voluntarios, es, onUpdate }) {
  const urgente = reporte.prioridad === 'critica' || ['si', 'posible', 'voces'].includes(reporte.personas_atrapadas);
  const incompleto = (reporte.nivel_dano || 'no_evaluado') === 'no_evaluado' || !reporte.direccion;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{reporte.nombre_lugar || (es ? 'Sin nombre' : 'Unnamed')}</p>
          <p className="text-xs text-gray-500 truncate">{[reporte.ciudad, reporte.estado_region].filter(Boolean).join(', ')}</p>
          <p className="text-[10px] text-gray-400">{reporte.codigo_reporte} · {new Date(reporte.created_date).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {urgente && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">🚨 {es ? 'Urgente' : 'Urgent'}</span>}
          {incompleto && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠️ {es ? 'Incompleto' : 'Incomplete'}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <select value={reporte.estado_verificacion || 'recibido'} onChange={e => onUpdate(reporte.id, { estado_verificacion: e.target.value })}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={reporte.voluntario_asignado_id || ''} onChange={e => {
            const v = voluntarios.find(v => v.user_id === e.target.value);
            onUpdate(reporte.id, { voluntario_asignado_id: e.target.value, voluntario_asignado_nombre: v?.user_nombre || '' });
          }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white truncate">
          <option value="">{es ? 'Sin asignar' : 'Unassigned'}</option>
          {voluntarios.map(v => <option key={v.user_id} value={v.user_id}>{v.user_nombre || v.user_email}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Link to={`/edificio?id=${reporte.id}`} className="text-[10px] font-bold text-blue-700 border border-blue-200 bg-blue-50 rounded-lg px-2 py-1 no-underline">
          {es ? 'Ver ficha e historial' : 'View record & history'}
        </Link>
        {reporte.estado_verificacion !== 'resuelto' && (
          <button onClick={() => onUpdate(reporte.id, { estado_verificacion: 'resuelto' })}
            className="text-[10px] font-bold text-green-700 border border-green-200 bg-green-50 rounded-lg px-2 py-1">
            {es ? 'Cerrar reporte' : 'Close report'}
          </button>
        )}
      </div>
    </div>
  );
}