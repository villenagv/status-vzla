import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import EdificioImagen from '@/components/svzla/EdificioImagen';
import { DANO_CONFIG } from './directorioConfig';

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d}d` : `${d}d ago`;
  if (h > 0) return es ? `hace ${h}h` : `${h}h ago`;
  if (m < 1) return es ? 'ahora' : 'now';
  return es ? `hace ${m}m` : `${m}m ago`;
}

export default function EdificioCard({ e, es, lang, compact, onNotify }) {
  const c = DANO_CONFIG[e.nivel_dano] || DANO_CONFIG.no_evaluado;
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(e.nivel_dano) || e.hayAtrapados;
  const fotos = e.foto_urls || [];
  const irFicha = () => { window.location.href = `/edificio?id=${e.id}`; };
  const abrir = (ev) => { ev.stopPropagation(); onNotify(e); };

  if (compact) return (
    <div className={`flex items-stretch hover:bg-gray-50 ${noEntrar ? 'border-l-4 border-l-red-500' : ''}`}
      style={{ borderLeft: noEntrar ? `4px solid ${c.cardBorder}` : undefined }}>
      <div onClick={irFicha} className="cursor-pointer flex-shrink-0" style={{ width: 72 }}>
        <EdificioImagen fotoUrls={fotos} tipoEstructura={e.tipo_estructura} nivelDano={e.nivel_dano} reporte={e} height={72} lang={lang} />
      </div>
      <div onClick={irFicha} className="flex-1 min-w-0 cursor-pointer px-3 py-2.5 flex flex-col justify-center gap-0.5">
        <p className="font-bold text-sm text-[#1A1F2E] truncate leading-tight">{e._nombre}</p>
        {e.tipo_estructura && <p className="text-[10px] text-gray-400 truncate capitalize">{e.tipo_estructura.replace(/_/g, ' ')}</p>}
        <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
          <MapPin size={8} />{[e.direccion, e.ciudad].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
            style={{ color: c.color, background: c.bg, borderColor: c.border }}>
            {c.icon} {es ? c.label.es : c.label.en}
          </span>
          {e.hayAtrapados && <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">🆘</span>}
          {e.riesgo_gas && <span className="text-[9px] bg-orange-50 text-orange-700 border border-orange-200 px-1 py-0.5 rounded-full">💨</span>}
          {e.riesgo_electrico && <span className="text-[9px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1 py-0.5 rounded-full">⚡</span>}
          {e.riesgo_incendio && <span className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 rounded-full">🔥</span>}
        </div>
      </div>
      <div className="flex flex-col items-end justify-center gap-2 pr-3 flex-shrink-0">
        <span className="text-[9px] text-gray-400">{tiempoRelativo(e.updated_date || e.created_date, es)}</span>
        <button onClick={abrir} className="text-[9px] font-semibold bg-green-50 border border-green-300 text-green-700 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-green-100 whitespace-nowrap">
          🔔 {es ? 'Avísame' : 'Notify'}
        </button>
        <span onClick={irFicha} className="text-gray-300 text-xl cursor-pointer leading-none p-2 -m-2">›</span>
      </div>
    </div>
  );

  return (
    <Link to={`/edificio?id=${e.id}`}
      className="bg-white rounded-xl overflow-hidden no-underline hover:shadow-md transition-shadow flex flex-col"
      style={{ border: `2px solid ${noEntrar ? c.cardBorder : '#E5E7EB'}` }}>
      <EdificioImagen fotoUrls={fotos} tipoEstructura={e.tipo_estructura} nivelDano={e.nivel_dano} reporte={e} height={112} lang={lang} sinFotoNudge />
      <div className="p-3 flex-1 flex flex-col gap-1">
        {noEntrar && (
          <span className="self-start text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">
            🚫 {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
          </span>
        )}
        <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{e._nombre}</p>
        {e.tipo_estructura && <p className="text-[10px] text-gray-400 truncate capitalize">{e.tipo_estructura.replace(/_/g, ' ')}</p>}
        <p className="text-[10px] text-gray-400 truncate">📍 {[e.direccion, e.ciudad].filter(Boolean).join(' · ') || '—'}</p>
        <span className="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-auto"
          style={{ color: c.color, borderColor: c.border, background: c.bg }}>
          {c.icon} {es ? c.label.es : c.label.en}
        </span>
        {(e.hayAtrapados || e.riesgo_gas || e.riesgo_electrico || e.riesgo_incendio) && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {e.hayAtrapados && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full font-bold">🆘</span>}
            {e.riesgo_gas && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full">💨</span>}
            {e.riesgo_electrico && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full">⚡</span>}
            {e.riesgo_incendio && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full">🔥</span>}
          </div>
        )}
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
          <span className="text-[9px] text-gray-400">🕐 {tiempoRelativo(e.updated_date || e.created_date, es)}</span>
          <button onClick={ev => { ev.preventDefault(); abrir(ev); }}
            className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-300 px-2.5 py-2 rounded-full hover:bg-green-100 cursor-pointer">
            🔔 {es ? 'Avísame' : 'Notify'}
          </button>
        </div>
      </div>
    </Link>
  );
}