import { MapPin } from 'lucide-react';
import { PERSONA_ESTADO, FUENTE_BADGE } from './directorioConfig';

export default function PersonaGridCard({ p, es, onSelect }) {
  const st = PERSONA_ESTADO[p.estado_caso] || PERSONA_ESTADO['buscando'];
  const badge = FUENTE_BADGE[p._fuente] || FUENTE_BADGE.busqueda;
  const esCritico = p.estado_caso === 'buscando';

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 space-y-2 hover:shadow-md transition-all ${esCritico ? 'border-red-200' : 'border-gray-100'}`}>
      <div onClick={onSelect} className="cursor-pointer space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-[#1A1F2E] leading-tight">{p._nombre}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {p.edad_aprox && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{p.edad_aprox} {es ? 'años' : 'yrs'}</span>}
              {p.sexo && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">{p.sexo}</span>}
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${st.cls}`}>{es ? st.es : st.en}</span>
        </div>
        {(p.ultima_ubicacion_conocida || p.ciudad) && (
          <p className="text-xs text-gray-500 flex items-start gap-1">
            <MapPin size={10} className="flex-shrink-0 mt-0.5" />
            {[p.ultima_ubicacion_conocida, p.ciudad, p.estado_region].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.cls}`}>{es ? badge.es : badge.en}</span>
        <button
          onClick={ev => { ev.stopPropagation(); onSelect(); }}
          className="text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-blue-100 whitespace-nowrap flex-shrink-0">
          🔔 {es ? 'Avisar' : 'Notify'}
        </button>
      </div>
    </div>
  );
}