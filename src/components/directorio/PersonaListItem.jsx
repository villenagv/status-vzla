import { MapPin } from 'lucide-react';
import { PERSONA_ESTADO, FUENTE_BADGE } from './directorioConfig';

export default function PersonaListItem({ p, es, onSelect }) {
  const st = PERSONA_ESTADO[p.estado_caso] || PERSONA_ESTADO['buscando'];
  const badge = FUENTE_BADGE[p._fuente] || FUENTE_BADGE.busqueda;
  const esCritico = p.estado_caso === 'buscando';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 ${esCritico ? 'border-l-4 border-l-red-400' : ''}`}>
      <div onClick={onSelect} className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 cursor-pointer ${esCritico ? 'bg-red-50' : 'bg-gray-50'}`}>
        {p._fuente === 'encontrada' ? '🙋' : p._fuente === 'cris' ? '📍' : '👤'}
      </div>
      <div onClick={onSelect} className="flex-1 min-w-0 cursor-pointer">
        <p className="font-bold text-sm text-[#1A1F2E] truncate">{p._nombre}</p>
        <p className="text-xs text-gray-400 truncate flex items-center gap-1">
          <MapPin size={9} />{[p.ultima_ubicacion_conocida, p.ciudad].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{es ? st.es : st.en}</span>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>{es ? badge.es : badge.en}</span>
        </div>
        <button onClick={onSelect}
          className="text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-100 whitespace-nowrap">
          🔔 {es ? 'Avisar' : 'Notify'}
        </button>
        <span onClick={onSelect} className="text-gray-300 text-xl cursor-pointer p-2 -m-2">›</span>
      </div>
    </div>
  );
}