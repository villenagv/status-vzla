import { AlertTriangle } from 'lucide-react';

const NIVEL = {
  leve: 'bg-yellow-100 text-yellow-700',
  moderado: 'bg-orange-100 text-orange-700',
  grave: 'bg-red-100 text-red-700',
  critico: 'bg-red-200 text-red-900',
  colapsado: 'bg-gray-900 text-white',
  no_evaluado: 'bg-gray-100 text-gray-600',
};

export default function DanosCentro({ danos, actualizaciones, operativos, es }) {
  const eventos = [...danos, ...actualizaciones, ...operativos].slice(0, 12);
  return (
    <div className="border border-[#EDEBE8] rounded-xl bg-white overflow-hidden">
      <div className="bg-red-50 border-b border-red-100 px-3 py-2 flex items-start gap-2">
        <AlertTriangle size={13} className="text-red-600 mt-0.5" />
        <p className="text-xs text-red-800 font-semibold">{es ? 'Daños, acceso y operación del centro' : 'Damage, access and center operation'}</p>
      </div>
      {eventos.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">{es ? 'Sin daños o cambios operativos asociados.' : 'No linked damage or operation changes.'}</p> : (
        <div className="divide-y divide-[#EDEBE8]">
          {eventos.map((d, i) => {
            const nivel = d.nivel_dano || d.tipo_dano || d.tipo_accion || d.estado_reporte || 'no_evaluado';
            return <div key={`${d.id || i}-${i}`} className="px-3 py-2"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-[#1A1F2E] truncate">{d.nombre_lugar || d.tipo_accion || d.tipo_dano || (es ? 'Actualización' : 'Update')}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${NIVEL[nivel] || 'bg-gray-100 text-gray-600'}`}>{nivel}</span></div>{(d.descripcion || d.notas_acceso || d.observaciones) && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{d.descripcion || d.notas_acceso || d.observaciones}</p>}</div>;
          })}
        </div>
      )}
    </div>
  );
}