import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, MapPin, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import PrioridadBadge from '@/components/cris/PrioridadBadge';

const PAGE_SIZE = 10;

export default function Consultar() {
  const { t, lang } = useLang();
  const { lowBw } = useLowBw();
  const [query, setQuery] = useState('');
  const [reportes, setReportes] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [pageR, setPageR] = useState(1);
  const [pageP, setPageP] = useState(1);

  const buscar = async () => {
    if (!query.trim()) return;
    setBuscando(true);
    setBuscado(false);
    try {
      const [r, p] = await Promise.all([
        base44.entities.InfraestructuraSos.list(),
        base44.entities.PuntosAyuda.list(),
      ]);
      const q = query.toLowerCase();
      setReportes(r.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.direccion || '').toLowerCase().includes(q)
      ).sort((a, b) => {
        const ord = { critica: 0, alta: 1, normal: 2 };
        return (ord[a.prioridad] ?? 2) - (ord[b.prioridad] ?? 2);
      }));
      setPuntos(p.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.nombre_lugar || '').toLowerCase().includes(q)
      ));
      setPageR(1);
      setPageP(1);
    } catch {}
    setBuscando(false);
    setBuscado(true);
  };

  const reportesPage = reportes.slice(0, pageR * PAGE_SIZE);
  const puntosPage = puntos.slice(0, pageP * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {t.btn_volver}
        </Link>

        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">{t.consult_title}</h1>
        <p className="text-sm text-gray-500 mb-4">{t.consult_desc}</p>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder={t.buscar_placeholder}
            className="flex-1 border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          <button
            onClick={buscar}
            disabled={buscando}
            className="bg-[#1A1F2E] text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Search size={16} />
            {t.btn_buscar}
          </button>
        </div>

        {buscando && (
          <p className="text-center text-sm text-gray-400 py-8">{t.counters_loading}</p>
        )}

        {buscado && !buscando && reportes.length === 0 && puntos.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">{t.sin_resultados}</p>
        )}

        {/* Reportes de daño */}
        {reportesPage.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={12} className="text-[#B83A52]" />
              {lang === 'es' ? 'Reportes de daño' : 'Damage reports'} ({reportes.length})
            </h2>
            <div className="flex flex-col gap-2">
              {reportesPage.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#1A1F2E]">{r.tipo_reporte}</span>
                    <PrioridadBadge prioridad={r.prioridad} />
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={10} /> {r.direccion || r.ciudad}, {r.estado_region}
                  </p>
                  {r.personas_atrapadas === 'si' && (
                    <span className="inline-block mt-1 text-[10px] font-bold bg-[#F4D5DD] text-[#B83A52] px-2 py-0.5 rounded-full">
                      {lang === 'es' ? '⚠️ Personas atrapadas' : '⚠️ Trapped people'}
                    </span>
                  )}
                  {r.descripcion && !lowBw && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
            {reportes.length > reportesPage.length && (
              <button
                onClick={() => setPageR(p => p + 1)}
                className="w-full mt-3 py-2.5 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50"
              >{t.ver_mas}</button>
            )}
          </div>
        )}

        {/* Puntos de ayuda */}
        {puntosPage.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              🏥 {lang === 'es' ? 'Puntos de ayuda' : 'Help points'} ({puntos.length})
            </h2>
            <div className="flex flex-col gap-2">
              {puntosPage.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#1A1F2E]">{p.nombre_lugar}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.estado_operativo === 'abierto' ? 'bg-green-100 text-green-800' :
                      p.estado_operativo === 'saturado' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{p.estado_operativo}</span>
                  </div>
                  <p className="text-xs text-gray-500">{p.tipo_lugar} · {p.ciudad}, {p.estado_region}</p>
                  {p.direccion && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {p.direccion}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {puntos.length > puntosPage.length && (
              <button
                onClick={() => setPageP(p => p + 1)}
                className="w-full mt-3 py-2.5 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50"
              >{t.ver_mas}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}