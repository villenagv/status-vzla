import { useState } from 'react';
import { Search } from 'lucide-react';

const COND = {
  a_salvo: { es: 'A salvo', en: 'Safe', cls: 'bg-green-100 text-green-700' },
  herido_leve: { es: 'Herido leve', en: 'Minor injury', cls: 'bg-yellow-100 text-yellow-700' },
  herido_grave: { es: 'Herido grave', en: 'Serious injury', cls: 'bg-orange-100 text-orange-700' },
  fallecido_reportado: { es: 'Fallecido rep.', en: 'Death rep.', cls: 'bg-gray-200 text-gray-700' },
  no_identificado: { es: 'No identificado', en: 'Unidentified', cls: 'bg-purple-100 text-purple-700' },
  no_sabe: { es: 'No se sabe', en: 'Unknown', cls: 'bg-gray-100 text-gray-500' },
};

export default function PersonasCentro({ personas, es }) {
  const [q, setQ] = useState('');
  const query = q.toLowerCase().trim();
  const filtradas = !query ? personas : personas.filter(p =>
    (p.nombre || '').toLowerCase().includes(query) ||
    (p.condicion || '').toLowerCase().includes(query) ||
    (p.origen || '').toLowerCase().includes(query)
  );

  return (
    <div className="border border-[#EDEBE8] rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-[#EDEBE8] px-3 py-2 space-y-2">
        <p className="text-xs font-bold text-gray-700">👤 {personas.length} {es ? 'personas vinculadas a este centro' : 'people linked to this center'}</p>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={es ? 'Buscar solo en este centro...' : 'Search only this center...'} className="w-full border border-[#EDEBE8] rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400" />
        </div>
      </div>
      {filtradas.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">{es ? 'Sin coincidencias en este centro.' : 'No matches in this center.'}</p> : (
        <div className="max-h-56 overflow-y-auto divide-y divide-[#EDEBE8]">
          {filtradas.slice(0, 80).map(p => {
            const c = COND[p.condicion] || COND.no_sabe;
            return <div key={p.key} className="px-3 py-2 flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold text-[#1A1F2E] truncate">{p.nombre}</p><p className="text-[10px] text-gray-400">{p.origen}</p></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{es ? c.es : c.en}</span></div>;
          })}
        </div>
      )}
    </div>
  );
}