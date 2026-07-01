import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, MapPin, AlertTriangle, Users, Phone, Loader2 } from 'lucide-react';
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
  buscando: 'bg-red-100 text-red-700',
  informacion_recibida: 'bg-blue-100 text-blue-700',
  visto_no_confirmado: 'bg-orange-100 text-orange-700',
  encontrado_con_vida: 'bg-green-100 text-green-800',
  en_hospital_refugio: 'bg-teal-100 text-teal-800',
  fallecido_reportado: 'bg-gray-200 text-gray-700',
  caso_cerrado: 'bg-gray-100 text-gray-500',
};
const PERSONA_ESTADO_LABEL = {
  buscando: { es: '🔴 Sin contacto', en: '🔴 Missing' },
  informacion_recibida: { es: '🔵 Con pistas', en: '🔵 Has leads' },
  visto_no_confirmado: { es: '🟠 Visto sin confirmar', en: '🟠 Seen unconfirmed' },
  encontrado_con_vida: { es: '✅ Localizado', en: '✅ Located' },
  en_hospital_refugio: { es: '🏥 Hospital/refugio', en: '🏥 Hospital/shelter' },
  fallecido_reportado: { es: '⚫ Fallecimiento reportado', en: '⚫ Death reported' },
  caso_cerrado: { es: '🔒 Caso cerrado', en: '🔒 Case closed' },
};

const MODOS = [
  { val: 'todo',     es: '🔍 Todo',      en: '🔍 All' },
  { val: 'personas', es: '👤 Personas',  en: '👤 People' },
  { val: 'danos',    es: '🚨 Daños',     en: '🚨 Damage' },
  { val: 'ayuda',    es: '🏥 Centros',   en: '🏥 Centers' },
];

export default function Consultar() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;
  const [query, setQuery] = useState('');
  const [modo, setModo] = useState('todo');
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
      const includeDanos = modo === 'todo' || modo === 'danos';
      const includeAyuda = modo === 'todo' || modo === 'ayuda';
      const includePersonas = modo === 'todo' || modo === 'personas';

      const [r, p, per] = await Promise.all([
        includeDanos ? base44.entities.InfraestructuraSos.list('-created_date', 200) : Promise.resolve([]),
        includeAyuda ? base44.entities.PuntosAyuda.list('-updated_date', 200) : Promise.resolve([]),
        includePersonas ? base44.entities.PersonasBuscadas.list('-updated_date', 300) : Promise.resolve([]),
      ]);

      setReportes(r.filter(x =>
        (x.ciudad || '').toLowerCase().includes(q) ||
        (x.estado_region || '').toLowerCase().includes(q) ||
        (x.direccion || '').toLowerCase().includes(q) ||
        (x.tipo_reporte || '').toLowerCase().includes(q)
      ).sort((a, b) => ({ critica: 0, alta: 1, normal: 2 }[a.prioridad] ?? 2) - ({ critica: 0, alta: 1, normal: 2 }[b.prioridad] ?? 2)));

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
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {t('Volver', 'Go back', 'Voltar')}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🔍 {t('Buscar información', 'Search information', 'Buscar informações')}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {t(
            'Busca personas, zonas de daño o centros de ayuda. Escribe el nombre de una ciudad, barrio, municipio o persona.',
            'Search for people, damage areas, or help centers. Type a city, neighborhood, municipality, or person name.',
            'Busque pessoas, zonas de dano ou centros de ajuda. Digite o nome de uma cidade, bairro, município ou pessoa.'
          )}
        </p>

        {/* Instrucción de uso */}
        <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-3 py-3 mb-4">
          <span className="text-sm flex-shrink-0">💡</span>
          <p className="text-xs text-blue-800 leading-relaxed">
            {t(
              'Selecciona primero el tipo de búsqueda y luego escribe. Puedes buscar por ciudad, zona, nombre de persona o dirección.',
              'Select the search type first, then type your query. You can search by city, area, person name, or address.',
              'Selecione primeiro o tipo de busca e depois escreva. Você pode buscar por cidade, zona, nome de pessoa ou endereço.'
            )}
          </p>
        </div>

        {/* Filtro de modo */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {MODOS.map(m => (
            <button
              key={m.val}
              onClick={() => setModo(m.val)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${modo === m.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}
            >
              {t(m.es, m.en, m.es)}
            </button>
          ))}
        </div>

        {/* Barra de búsqueda */}
        <div className="flex gap-2 mb-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder={t('Ej: La Guaira, María González, Av. Bolívar...', 'E.g: La Guaira, Maria Gonzalez, Bolivar Ave...', 'Ex: La Guaira, Maria González, Av. Bolívar...')}
            className="flex-1 border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400"
          />
          <button
            onClick={buscar}
            disabled={buscando || !query.trim()}
            className="bg-[#1A1F2E] text-white px-5 py-3 rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50"
          >
            {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {t('Buscar', 'Search', 'Buscar')}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-6">
          {t('Presiona Enter o toca "Buscar" para ver resultados.', 'Press Enter or tap "Search" to see results.', 'Pressione Enter ou toque em "Buscar" para ver os resultados.')}
        </p>

        {/* Cargando */}
        {buscando && (
          <div className="text-center py-10">
            <Loader2 size={28} className="animate-spin text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">{t('Buscando...', 'Searching...', 'Buscando...')}</p>
          </div>
        )}

        {/* Sin resultados */}
        {buscado && !buscando && totalResultados === 0 && (
          <div className="text-center py-8 space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="text-base font-black text-gray-600">
              {t(`Sin resultados para "${query}"`, `No results for "${query}"`, `Sem resultados para "${query}"`)}
            </p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              {t(
                'Prueba con el nombre de una ciudad, barrio o municipio cercano. También puedes registrar nueva información.',
                'Try a city, neighborhood, or nearby municipality name. You can also register new information.',
                'Tente o nome de uma cidade, bairro ou município próximo. Você também pode registrar novas informações.'
              )}
            </p>
            <div className="flex flex-col gap-2 items-center pt-2">
              <Link to="/buscar-persona" className="text-sm text-[#6C3483] font-black bg-purple-50 border border-purple-200 px-4 py-2.5 rounded-xl no-underline">
                👤 {t('Registrar persona buscada', 'Register missing person', 'Registrar pessoa desaparecida')}
              </Link>
              <Link to="/reportar" className="text-sm text-[#B83A52] font-black bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl no-underline">
                🚨 {t('Reportar emergencia en esta zona', 'Report emergency in this area', 'Reportar emergência nesta zona')}
              </Link>
              <Link to="/institucional" className="text-sm text-[#1A5C3A] font-black bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl no-underline">
                🏛️ {t('Registrar centro de apoyo', 'Register support center', 'Registrar centro de apoio')}
              </Link>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        {buscado && !buscando && totalResultados > 0 && (
          <div className="bg-white border border-[#EDEBE8] rounded-2xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <Search size={13} className="text-gray-400" />
            <p className="text-xs text-gray-500 font-semibold">
              {t(`${totalResultados} resultado(s) para "${query}"`, `${totalResultados} result(s) for "${query}"`, `${totalResultados} resultado(s) para "${query}"`)}
            </p>
          </div>
        )}

        {/* ── Personas buscadas ── */}
        {personasPage.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">👤</span>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
                {t('Personas buscadas', 'Missing people', 'Pessoas desaparecidas')} ({personas.length})
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {personasPage.map(p => {
                const st = PERSONA_ESTADO_LABEL[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso };
                const stColor = PERSONA_ESTADO_COLOR[p.estado_caso] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-[#EDEBE8] px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link to={`/persona?id=${p.id}`} className="font-black text-sm text-[#1A1F2E] truncate block no-underline hover:underline">
                          {p.nombre_completo}
                        </Link>
                        {p.edad_aprox && <p className="text-xs text-gray-400">{t('Edad aprox.:', 'Age approx.:', 'Idade aprox.:')} {p.edad_aprox}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${stColor}`}>
                        {t(st.es, st.en, st.es)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} />
                      {p.ultima_ubicacion_conocida} · {p.ciudad}, {p.estado_region}
                    </p>
                    {!lowBw && p.descripcion_fisica && (
                      <p className="text-xs text-gray-400 line-clamp-1">{p.descripcion_fisica}</p>
                    )}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-amber-800 font-semibold">
                        ⚠️ {t('Nunca envíes dinero a cambio de información. Es una estafa.', 'Never send money in exchange for information. It is a scam.', 'Nunca envie dinheiro por informações. É uma fraude.')}
                      </p>
                    </div>
                    <Link to={`/persona?id=${p.id}`} className="block text-xs font-bold text-[#6C3483] text-center bg-purple-50 border border-purple-200 py-2 rounded-xl no-underline">
                      {t('Ver perfil completo →', 'View full profile →', 'Ver perfil completo →')}
                    </Link>
                  </div>
                );
              })}
            </div>
            {personas.length > personasPage.length && (
              <button onClick={() => setPagePer(p => p + 1)} className="w-full mt-3 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-[#EDEBE8] rounded-2xl bg-white">
                {t(`Ver más (${personas.length - personasPage.length} restantes)`, `Show more (${personas.length - personasPage.length} remaining)`, `Ver mais (${personas.length - personasPage.length} restantes)`)}
              </button>
            )}
          </div>
        )}

        {/* ── Reportes de daño ── */}
        {reportesPage.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-[#B83A52]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
                {t('Reportes de daño', 'Damage reports', 'Relatórios de dano')} ({reportes.length})
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {reportesPage.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-[#EDEBE8] px-4 py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-[#1A1F2E]">{r.tipo_reporte}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.prioridad === 'critica' ? 'bg-red-100 text-red-700' : r.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.prioridad === 'critica' ? t('🔴 CRÍTICA', '🔴 CRITICAL', '🔴 CRÍTICA') : r.prioridad === 'alta' ? t('🟠 Alta', '🟠 High', '🟠 Alta') : t('Normal', 'Normal', 'Normal')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={10} /> {r.direccion || r.ciudad}, {r.estado_region}
                  </p>
                  {r.personas_atrapadas === 'si' && (
                    <span className="inline-block text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      🆘 {t('Personas atrapadas', 'Trapped people', 'Pessoas presas')}
                    </span>
                  )}
                  {r.nivel_dano && <p className="text-xs text-gray-400">{t('Daño:', 'Damage:', 'Dano:')} {r.nivel_dano}</p>}
                  {!lowBw && r.descripcion && <p className="text-xs text-gray-400 line-clamp-2">{r.descripcion}</p>}
                </div>
              ))}
            </div>
            {reportes.length > reportesPage.length && (
              <button onClick={() => setPageR(p => p + 1)} className="w-full mt-3 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-[#EDEBE8] rounded-2xl bg-white">
                {t(`Ver más (${reportes.length - reportesPage.length} restantes)`, `Show more (${reportes.length - reportesPage.length} remaining)`, `Ver mais (${reportes.length - reportesPage.length} restantes)`)}
              </button>
            )}
          </div>
        )}

        {/* ── Puntos de ayuda ── */}
        {puntosPage.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🏥</span>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
                {t('Centros de ayuda', 'Help centers', 'Centros de ajuda')} ({puntos.length})
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {puntosPage.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-[#EDEBE8] px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-[#1A1F2E] flex-1 truncate">{p.nombre_lugar}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_OP_COLOR[p.estado_operativo] || 'bg-gray-100 text-gray-600'}`}>
                      {(() => { const l = ESTADO_OP_LABEL[p.estado_operativo]; return l ? t(l.es, l.en, l.es) : p.estado_operativo; })()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{p.tipo_lugar} · {p.ciudad}, {p.estado_region}</p>
                  {p.direccion && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {p.direccion}</p>}
                  {p.personas_actuales != null && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={10} /> {p.personas_actuales}{p.capacidad_maxima ? `/${p.capacidad_maxima}` : ''} {t('personas', 'people', 'pessoas')}
                    </p>
                  )}
                  {!lowBw && p.servicios_disponibles?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.servicios_disponibles.slice(0, 4).map(s => (
                        <span key={s} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  {p.telefono_publico && (
                    <a href={`tel:${p.telefono_publico}`} className="flex items-center gap-1 text-xs font-semibold text-[#1A1F2E] hover:underline">
                      <Phone size={10} /> {p.telefono_publico}
                    </a>
                  )}
                  {p.whatsapp && (
                    <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-700 hover:underline">
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
            {puntos.length > puntosPage.length && (
              <button onClick={() => setPageP(p => p + 1)} className="w-full mt-3 py-3 text-sm font-semibold text-[#1A1F2E] border-2 border-[#EDEBE8] rounded-2xl bg-white">
                {t(`Ver más (${puntos.length - puntosPage.length} restantes)`, `Show more (${puntos.length - puntosPage.length} remaining)`, `Ver mais (${puntos.length - puntosPage.length} restantes)`)}
              </button>
            )}
          </div>
        )}

        {/* Acciones si hay resultados */}
        {buscado && !buscando && totalResultados > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('¿No encuentras lo que buscas?', "Can't find what you're looking for?", '¿No encontró lo que busca?')}</p>
            <div className="flex flex-col gap-1.5">
              <Link to="/buscar-persona" className="text-xs text-[#6C3483] font-semibold underline underline-offset-2">
                {t('→ Registrar nueva persona buscada', '→ Register a new missing person', '→ Registrar nova pessoa desaparecida')}
              </Link>
              <Link to="/reportar" className="text-xs text-[#B83A52] font-semibold underline underline-offset-2">
                {t('→ Reportar nueva emergencia en esta zona', '→ Report new emergency in this area', '→ Reportar nova emergência nesta zona')}
              </Link>
              <Link to="/institucional" className="text-xs text-blue-600 font-semibold underline underline-offset-2">
                {t('→ Registrar un centro de apoyo', '→ Register a support center', '→ Registrar um centro de apoio')}
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}