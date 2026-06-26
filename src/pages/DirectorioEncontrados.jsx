import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, Share2, MapPin, Filter } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import TarjetaEncontrado from '@/components/svzla/TarjetaEncontrado';

const PAGE_SIZE = 15;

const CONDICION_BADGE = {
  a_salvo:             { es: '✅ A salvo',              en: '✅ Safe',                bg: 'bg-green-100 text-green-800' },
  herido_leve:         { es: '🟡 Herido leve',           en: '🟡 Mildly injured',      bg: 'bg-yellow-100 text-yellow-800' },
  herido_grave:        { es: '🔴 Herido grave',           en: '🔴 Seriously injured',   bg: 'bg-orange-100 text-orange-700' },
  fallecido_reportado: { es: '⚫ Fallecido (reportado)',  en: '⚫ Deceased (reported)',  bg: 'bg-gray-200 text-gray-700' },
  no_identificado:     { es: '❓ No identificado',        en: '❓ Unidentified',         bg: 'bg-gray-100 text-gray-600' },
};

export default function DirectorioEncontrados() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [todos, setTodos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [query, setQuery] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('');
  const [page, setPage] = useState(1);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);

  useEffect(() => {
    base44.entities.PersonasEncontradas.list('-updated_date', 200)
      .then(data => {
        setTodos(data);
        setFiltrados(data);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const aplicarFiltros = (q, condicion) => {
    const qLow = q.toLowerCase();
    const resultado = todos.filter(p => {
      const matchQ = !q ||
        (p.nombre_o_descripcion || '').toLowerCase().includes(qLow) ||
        (p.ciudad || '').toLowerCase().includes(qLow) ||
        (p.estado_region || '').toLowerCase().includes(qLow) ||
        (p.nombre_lugar || '').toLowerCase().includes(qLow) ||
        (p.cedula || '').toLowerCase().includes(qLow);
      const matchCond = !condicion || p.condicion === condicion;
      return matchQ && matchCond;
    });
    setFiltrados(resultado);
    setPage(1);
  };

  const handleQuery = (v) => { setQuery(v); aplicarFiltros(v, filtroCondicion); };
  const handleFiltro = (v) => { setFiltroCondicion(v); aplicarFiltros(query, v); };

  const visibles = filtrados.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🙋 {es ? 'Personas encontradas' : 'Found people'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Directorio de personas vistas, encontradas o reportadas por la comunidad. Si reconoces a alguien, comparte la tarjeta.'
            : 'Directory of people seen, found or reported by the community. If you recognize someone, share the card.'}
        </p>

        {/* Búsqueda */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => handleQuery(e.target.value)}
              placeholder={es ? 'Nombre, cédula, ciudad...' : 'Name, ID, city...'}
              className="w-full border border-[#EDEBE8] rounded-xl pl-9 pr-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
            />
          </div>
        </div>

        {/* Filtro condición */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button onClick={() => handleFiltro('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${!filtroCondicion ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
            {es ? 'Todos' : 'All'}
          </button>
          {Object.entries(CONDICION_BADGE).map(([val, data]) => (
            <button key={val} onClick={() => handleFiltro(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${filtroCondicion === val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
              {es ? data.es : data.en}
            </button>
          ))}
        </div>

        {cargando && (
          <div className="text-center py-10 text-sm text-gray-400">{es ? 'Cargando...' : 'Loading...'}</div>
        )}

        {!cargando && filtrados.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400 mb-3">
              {es ? 'No hay registros que coincidan.' : 'No matching records.'}
            </p>
            <Link to="/reportar-encontrado" className="text-sm text-[#D48C2E] underline">
              {es ? '→ Reportar persona encontrada' : '→ Report found person'}
            </Link>
          </div>
        )}

        {!cargando && filtrados.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {es ? `${filtrados.length} registro(s)` : `${filtrados.length} record(s)`}
          </p>
        )}

        {/* Lista */}
        <div className="space-y-2">
          {visibles.map(p => {
            const cond = CONDICION_BADGE[p.condicion] || { es: p.condicion, en: p.condicion, bg: 'bg-gray-100 text-gray-600' };
            const condLabel = es ? cond.es : cond.en;
            const lugar = [p.nombre_lugar, p.ciudad, p.estado_region].filter(Boolean).join(', ');
            const fecha = p.updated_date
              ? new Date(p.updated_date).toLocaleDateString(es ? 'es-VE' : 'en-US', { day: '2-digit', month: 'short' })
              : '';

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-[#EDEBE8] px-4 py-3">
                <div className="flex gap-3 items-start">
                  {/* Foto */}
                  {!lowBw && p.foto_url ? (
                    <img src={p.foto_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-[#EDEBE8] flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#F4F4F8] flex items-center justify-center text-2xl flex-shrink-0 border border-[#EDEBE8]">
                      👤
                    </div>
                  )}

                  {/* Datos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-black text-sm text-[#1A1F2E] leading-tight">{p.nombre_o_descripcion}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cond.bg}`}>
                        {condLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {p.edad_aprox && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.edad_aprox} {es ? 'años' : 'yrs'}</span>}
                      {p.sexo && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{p.sexo}</span>}
                      {p.cedula && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-100">CI: {p.cedula}</span>}
                    </div>

                    {lugar && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} className="flex-shrink-0" /> {lugar}
                      </p>
                    )}

                    {!lowBw && p.descripcion_fisica && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.descripcion_fisica}</p>
                    )}

                    {fecha && <p className="text-[10px] text-gray-400 mt-1">{fecha}</p>}
                  </div>
                </div>

                {/* Botón compartir */}
                <button
                  onClick={() => setTarjetaSeleccionada(p)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-[#1A1F2E] hover:bg-[#2d3549] text-white text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Share2 size={13} />
                  {es ? 'Ver y compartir tarjeta' : 'View and share card'}
                </button>
              </div>
            );
          })}
        </div>

        {filtrados.length > visibles.length && (
          <button onClick={() => setPage(p => p + 1)}
            className="w-full mt-4 py-3 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50 font-semibold">
            {es ? 'Ver más registros' : 'Show more records'}
          </button>
        )}

        {/* CTA al final */}
        <div className="mt-6 bg-[#F0F4FD] border border-blue-200 rounded-2xl px-4 py-4 text-center space-y-2">
          <p className="text-sm font-bold text-[#1A1F2E]">
            {es ? '¿Encontraste o viste a alguien?' : 'Did you find or see someone?'}
          </p>
          <Link to="/reportar-encontrado" className="block bg-[#D48C2E] text-white font-black py-3 rounded-xl text-sm">
            {es ? '+ Reportar persona encontrada' : '+ Report found person'}
          </Link>
        </div>
      </div>

      {/* Modal tarjeta */}
      {tarjetaSeleccionada && (
        <TarjetaEncontrado
          persona={tarjetaSeleccionada}
          onClose={() => setTarjetaSeleccionada(null)}
        />
      )}

      <Footer />
    </div>
  );
}