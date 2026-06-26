import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, MapPin, AlertTriangle, Users, Phone, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const PAGE_SIZE = 10;

const ESTADO_OP_COLOR = {
  abierto: 'bg-green-100 text-green-800',
  saturado: 'bg-orange-100 text-orange-700',
  cerrado: 'bg-gray-200 text-gray-700',
  necesita_suministros: 'bg-blue-100 text-blue-700',
  necesita_voluntarios: 'bg-purple-100 text-purple-700',
};

const ESTADO_OP_LABEL = {
  abierto: { es: '✅ Abierto', en: '✅ Open' },
  saturado: { es: '⚠️ Saturado', en: '⚠️ Saturated' },
  cerrado: { es: '🔒 Cerrado', en: '🔒 Closed' },
  necesita_suministros: { es: '📦 Necesita suministros', en: '📦 Needs supplies' },
  necesita_voluntarios: { es: '🙋 Necesita voluntarios', en: '🙋 Needs volunteers' },
};

const PERSONA_ESTADO_COLOR = {
  buscando: 'bg-yellow-100 text-yellow-800',
  informacion_recibida: 'bg-blue-100 text-blue-700',
  visto_no_confirmado: 'bg-orange-100 text-orange-700',
  encontrado_con_vida: 'bg-green-100 text-green-800',
  en_hospital_refugio: 'bg-teal-100 text-teal-800',
  fallecido_reportado: 'bg-gray-200 text-gray-700',
  caso_cerrado: 'bg-gray-100 text-gray-500',
};

const PERSONA_ESTADO_LABEL = {
  buscando: { es: 'Buscando', en: 'Searching' },
  informacion_recibida: { es: 'Info recibida', en: 'Info received' },
  visto_no_confirmado: { es: 'Visto – sin confirmar', en: 'Seen – unconfirmed' },
  encontrado_con_vida: { es: 'Encontrado ✅', en: 'Found alive ✅' },
  en_hospital_refugio: { es: 'En hospital/refugio', en: 'In hospital/shelter' },
  fallecido_reportado: { es: 'Fallecido reportado', en: 'Death reported' },
  caso_cerrado: { es: 'Caso cerrado', en: 'Case closed' },
};

export default function Consultar() {
  const { t, lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const [query, setQuery] = useState('');
  const [modo, setModo] = useState('todo'); // 'todo' | 'personas' | 'danos' | 'ayuda'
  const [reportes, setReportes] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [pageR, setPageR] = useState(1);
  const [pageP, setPageP] = useState(1);
  const [pagePer, setPagePer] = useState(1);

  const buscar = async () => {
    if (!query.trim()) return;
    setBuscando(true);
    setBuscado(false);
    try {
      const q = query.toLowerCase();
      const promises = [];
      const includeDanos = modo === 'todo' || modo === 'danos';
      const includeAyuda = modo === 'todo' || modo === 'ayuda';
      const includePersonas = modo === 'todo' || modo === 'personas';

      if (includeDanos) promises.push(base44.entities.InfraestructuraSos.list('-created_date', 200));
      else promises.push(Promise.resolve([]));

      if (includeAyuda) promises.push(base44.entities.PuntosAyuda.list('-updated_date', 200));
      else promises.push(Promise.resolve([]));

      if (includePersonas) promises.push(base44.entities.PersonasBuscadas.list('-updated_date', 300));
      else promises.push(Promise.resolve([]));

      const [r, p, per] = await Promise.all(promises);

      setReportes(r.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.direccion || '').toLowerCase().includes(q) ||
        (x.tipo_reporte || '').toLowerCase().includes(q)
      ).sort((a, b) => {
        const ord = { critica: 0, alta: 1, normal: 2 };
        return (ord[a.prioridad] ?? 2) - (ord[b.prioridad] ?? 2);
      }));

      setPuntos(p.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.nombre_lugar || '').toLowerCase().includes(q) ||
        (x.tipo_lugar || '').toLowerCase().includes(q)
      ));

      setPersonas(per.filter(x =>
        (x.nombre_completo || '').toLowerCase().includes(q) ||
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.ultima_ubicacion_conocida || '').toLowerCase().includes(q)
      ).filter(x => x.estado_caso !== 'caso_cerrado'));

      setPageR(1); setPageP(1); setPagePer(1);
    } catch {}
    setBuscando(false);
    setBuscado(true);
  };

  const reportesPage = reportes.slice(0, pageR * PAGE_SIZE);
  const puntosPage = puntos.slice(0, pageP * PAGE_SIZE);
  const personasPage = personas.slice(0, pagePer * PAGE_SIZE);
  const totalResultados = reportes.length + puntos.length + personas.length;

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {t.btn_volver}
        </Link>

        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">{t.consult_title}</h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">{t.consult_desc}</p>

        {/* Instrucción contextual */}
        <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mb-4">
          <span className="text-sm flex-shrink-0">💡</span>
          <p className="text-xs text-blue-800 leading-relaxed">
            {es
              ? 'Escribe el nombre de una ciudad, barrio, municipio o persona. Filtra por tipo antes de buscar para resultados más rápidos.'
              : 'Type a city, neighborhood, municipality or person name. Filter by type before searching for faster results.'}
          </p>
        </div>

        {/* Filtro de modo */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {[
            { val: 'todo', es: '🔍 Todo', en: '🔍 All' },
            { val: 'personas', es: '👤 Personas', en: '👤 People' },
            { val: 'danos', es: '🚨 Daños', en: '🚨 Damage' },
            { val: 'ayuda', es: '🏥 Ayuda', en: '🏥 Help' },
          ].map(m => (
            <button key={m.val} onClick={() => setModo(m.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${modo === m.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
              {es ? m.es : m.en}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder={es ? 'Nombre, ciudad, zona...' : 'Name, city, zone...'}
            className="flex-1 border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          <button onClick={buscar} disabled={buscando}
            className="bg-[#1A1F2E] text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Search size={16} />
            {t.btn_buscar}
          </button>
        </div>

        {buscando && <p className="text-center text-sm text-gray-400 py-8">{t.counters_loading}</p>}

        {buscado && !buscando && totalResultados === 0 && (
          <div className="text-center py-8 space-y-3">
            <p className="text-3xl">🔍</p>
            <p className="text-sm font-semibold text-gray-600">
              {es ? `Sin resultados para "${query}"` : `No results for "${query}"`}
            </p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              {es
                ? 'Intenta con otro término. Puedes buscar por ciudad, barrio, nombre de persona o zona.'
                : 'Try a different term. You can search by city, neighborhood, person name or area.'}
            </p>
            <div className="flex flex-col gap-2 items-center pt-2">
              <Link to="/buscar-persona" className="text-sm text-[#D48C2E] font-semibold underline underline-offset-2">
                {es ? '→ Registrar búsqueda de persona' : '→ Register missing person search'}
              </Link>
              <Link to="/reportar" className="text-sm text-[#B83A52] font-semibold underline underline-offset-2">
                {es ? '→ Reportar emergencia en esta zona' : '→ Report emergency in this area'}
              </Link>
              <Link to="/institucional" className="text-sm text-blue-600 font-semibold underline underline-offset-2">
                {es ? '→ Registrar un centro de apoyo' : '→ Register a support center'}
              </Link>
            </div>
          </div>
        )}

        {buscado && !buscando && totalResultados > 0 && (
          <p className="text-xs text-gray-400 mb-4">
            {es ? `${totalResultados} resultado(s) para "${query}"` : `${totalResultados} result(s) for "${query}"`}
          </p>
        )}

        {/* Personas buscadas */}
        {personasPage.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              👤 {es ? 'Personas buscadas' : 'Missing people'} ({personas.length})
            </h2>
            <div className="flex flex-col gap-2">
              {personasPage.map(p => {
                const st = PERSONA_ESTADO_LABEL[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso };
                const stColor = PERSONA_ESTADO_COLOR[p.estado_caso] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1A1F2E] truncate">{p.nombre_completo}</p>
                        {p.edad_aprox && <p className="text-xs text-gray-400">{es ? 'Edad aprox.:' : 'Age approx.:'} {p.edad_aprox}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${stColor}`}>
                        {es ? st.es : st.en}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} /> {p.ultima_ubicacion_conocida} · {p.ciudad}, {p.estado_region}
                    </p>
                    {p.descripcion_fisica && !lowBw && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.descripcion_fisica}</p>
                    )}
                    {/* Anti-extorsión */}
                    <div className="mt-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-[#B83A52]">
                        {es ? '⚠️ Nunca envíes dinero a cambio de información.' : '⚠️ Never send money in exchange for information.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {personas.length > personasPage.length && (
              <button onClick={() => setPagePer(p => p + 1)} className="w-full mt-3 py-2.5 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50">
                {t.ver_mas}
              </button>
            )}
          </div>
        )}

        {/* Reportes de daño */}
        {reportesPage.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={12} className="text-[#B83A52]" />
              {es ? 'Reportes de daño' : 'Damage reports'} ({reportes.length})
            </h2>
            <div className="flex flex-col gap-2">
              {reportesPage.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#1A1F2E]">{r.tipo_reporte}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      r.prioridad === 'critica' ? 'bg-red-100 text-red-700' :
                      r.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {r.prioridad === 'critica' ? (es ? 'CRÍTICA' : 'CRITICAL') : r.prioridad === 'alta' ? (es ? 'Alta' : 'High') : (es ? 'Normal' : 'Normal')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={10} /> {r.direccion || r.ciudad}, {r.estado_region}
                  </p>
                  {r.personas_atrapadas === 'si' && (
                    <span className="inline-block mt-1 text-[10px] font-bold bg-[#F4D5DD] text-[#B83A52] px-2 py-0.5 rounded-full">
                      ⚠️ {es ? 'Personas atrapadas' : 'Trapped people'}
                    </span>
                  )}
                  {r.nivel_dano && (
                    <p className="text-xs text-gray-400 mt-1">{es ? 'Daño:' : 'Damage:'} {r.nivel_dano}</p>
                  )}
                  {r.descripcion && !lowBw && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
            {reportes.length > reportesPage.length && (
              <button onClick={() => setPageR(p => p + 1)} className="w-full mt-3 py-2.5 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50">
                {t.ver_mas}
              </button>
            )}
          </div>
        )}

        {/* Puntos de ayuda */}
        {puntosPage.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              🏥 {es ? 'Puntos de ayuda' : 'Help points'} ({puntos.length})
            </h2>
            <div className="flex flex-col gap-2">
              {puntosPage.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-[#EDEBE8] px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#1A1F2E] flex-1 truncate">{p.nombre_lugar}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_OP_COLOR[p.estado_operativo] || 'bg-gray-100 text-gray-600'}`}>
                      {(() => { const l = ESTADO_OP_LABEL[p.estado_operativo]; return l ? (es ? l.es : l.en) : p.estado_operativo; })()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{p.tipo_lugar} · {p.ciudad}, {p.estado_region}</p>
                  {p.direccion && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {p.direccion}</p>
                  )}
                  {p.personas_actuales != null && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Users size={10} /> {p.personas_actuales}{p.capacidad_maxima ? `/${p.capacidad_maxima}` : ''} {es ? 'personas' : 'people'}
                    </p>
                  )}
                  {!lowBw && p.servicios_disponibles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.servicios_disponibles.slice(0, 4).map(s => (
                        <span key={s} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                      {p.servicios_disponibles.length > 4 && (
                        <span className="text-[10px] text-gray-400">+{p.servicios_disponibles.length - 4}</span>
                      )}
                    </div>
                  )}
                  {!lowBw && p.necesidades_urgentes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.necesidades_urgentes.slice(0, 3).map(n => (
                        <span key={n} className="text-[10px] bg-[#FDF1F0] text-[#B83A52] px-1.5 py-0.5 rounded-full border border-[#E8B4B0]">
                          🆘 {n}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.telefono_publico && (
                    <a href={`tel:${p.telefono_publico}`} className="flex items-center gap-1 text-xs text-[#1A1F2E] hover:underline mt-1.5">
                      <Phone size={10} /> {p.telefono_publico}
                    </a>
                  )}
                  {p.whatsapp && (
                    <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-700 hover:underline mt-0.5">
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
            {puntos.length > puntosPage.length && (
              <button onClick={() => setPageP(p => p + 1)} className="w-full mt-3 py-2.5 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50">
                {t.ver_mas}
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}