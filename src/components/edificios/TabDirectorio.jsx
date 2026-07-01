import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import EdificioImagen from '@/components/svzla/EdificioImagen';

const PRIORIDAD_SORT = { critico: 0, colapsado: 1, grave: 2, moderado: 3, leve: 4, no_evaluado: 5, no_sabe: 6 };

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', cardBorder: '#D4AC0D', label: { es: 'Daño leve',     en: 'Minor damage'   }, icon: '🟡', acceso: { es: 'Entrada con precaución', en: 'Enter with caution' } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', cardBorder: '#E67E22', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠', acceso: { es: 'Entrada limitada',       en: 'Limited entry'      } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', cardBorder: '#E74C3C', label: { es: 'Daño grave',    en: 'Severe damage'   }, icon: '🔴', acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'       } },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', cardBorder: '#922B21', label: { es: 'CRÍTICO',       en: 'CRITICAL'        }, icon: '🚨', acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER'       } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin evaluar',   en: 'Not evaluated'   }, icon: '⚪', acceso: { es: 'Sin verificar',          en: 'Unverified'         } },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', cardBorder: '#BFC9CA', label: { es: 'Sin datos',     en: 'No data'         }, icon: '⚪', acceso: { es: 'Sin información',        en: 'No information'     } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', cardBorder: '#4A0E0E', label: { es: 'COLAPSADO',     en: 'COLLAPSED'       }, icon: '💥', acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER'       } },
};
const cfg = (d) => DANO_CONFIG[d] || DANO_CONFIG.no_evaluado;

const PERSONA_ESTADO = {
  buscando:             { es: 'Buscando',            en: 'Searching',       cls: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida: { es: 'Info recibida',       en: 'Info received',   cls: 'bg-blue-100 text-blue-700'    },
  visto_no_confirmado:  { es: 'Visto sin confirmar', en: 'Seen unconfirmed',cls: 'bg-orange-100 text-orange-700'},
  encontrado_con_vida:  { es: 'Encontrado ✅',       en: 'Found alive ✅',  cls: 'bg-green-100 text-green-800'  },
  en_hospital_refugio:  { es: 'Hospital/refugio',    en: 'Hospital/Shelter',cls: 'bg-teal-100 text-teal-800'   },
  fallecido_reportado:  { es: 'Fallecimiento rep.',  en: 'Death reported',  cls: 'bg-gray-200 text-gray-700'   },
};

export default function TabDirectorio({
  todos, cargandoDir, cargandoPer, cargandoSols,
  filtroDir, setFiltroDir, filtroRapido, setFiltroRapido,
  filtroCiudad, setFiltroCiudad, ordenDir, setOrdenDir,
  pageDir, setPageDir, personas, encontrados, solicitudes,
  filtroPer, setFiltroPer, pagePer, setPagePer,
  setTab, setAvisameEdificio, lang, t,
}) {
  const es = lang === 'es';
  const pt = lang === 'pt';

  const tiempoRelativo = (fecha) => {
    if (!fecha) return '';
    const diff = Date.now() - new Date(fecha).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return pt ? `há ${d}d` : es ? `hace ${d}d` : `${d}d ago`;
    if (h > 0) return pt ? `há ${h}h` : es ? `hace ${h}h` : `${h}h ago`;
    if (m < 1) return pt ? 'agora' : es ? 'ahora' : 'now';
    return pt ? `há ${m}m` : es ? `hace ${m}m` : `${m}m ago`;
  };

  const criticos = todos.filter(r => ['critico', 'colapsado', 'grave'].includes(r.nivel_dano));
  const conAtrapados = todos.filter(r => ['si', 'voces'].includes(r.personas_atrapadas));
  const sinVerificar = todos.filter(r => r.nivel_verificacion === 'sin_verificar' || !r.nivel_verificacion);
  const conContactos = todos.filter(r => r.contactos_acceso?.length > 0);
  const ultimaHora = todos.filter(r => {
    const diff = Date.now() - new Date(r.updated_date || r.created_date).getTime();
    return diff <= 2 * 60 * 60 * 1000;
  });
  const ciudadesDisponibles = [...new Set(todos.map(r => r.ciudad).filter(Boolean))].sort();

  const dirBase = todos.filter(r => {
    const qText = filtroDir.trim().toLowerCase();
    const passText = !qText || (r.direccion || '').toLowerCase().includes(qText) || (r.ciudad || '').toLowerCase().includes(qText) || (r.nombre_lugar || '').toLowerCase().includes(qText);
    const passCiudad = !filtroCiudad || (r.ciudad || '').toLowerCase() === filtroCiudad.toLowerCase();
    return passText && passCiudad;
  });
  const dirFiltrados = dirBase.filter(r => {
    if (filtroRapido === 'criticos') return ['critico', 'colapsado', 'grave'].includes(r.nivel_dano);
    if (filtroRapido === 'atrapados') return ['si', 'voces'].includes(r.personas_atrapadas);
    if (filtroRapido === 'sin_verificar') return r.nivel_verificacion === 'sin_verificar' || !r.nivel_verificacion;
    if (filtroRapido === 'con_contactos') return r.contactos_acceso?.length > 0;
    if (filtroRapido === 'ultima_hora') {
      const diff = Date.now() - new Date(r.updated_date || r.created_date).getTime();
      return diff <= 2 * 60 * 60 * 1000;
    }
    return true;
  }).sort((a, b) => {
    if (ordenDir === 'recientes') return new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date);
    const aAtrapado = ['si', 'voces'].includes(a.personas_atrapadas) ? -1 : 0;
    const bAtrapado = ['si', 'voces'].includes(b.personas_atrapadas) ? -1 : 0;
    if (aAtrapado !== bAtrapado) return aAtrapado - bAtrapado;
    return (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5);
  });

  const perFiltradas = [...personas, ...encontrados].filter(p => {
    if (!filtroPer.trim()) return true;
    const q = filtroPer.toLowerCase();
    return (p.nombre_completo || p.nombre_o_descripcion || '').toLowerCase().includes(q) || (p.ciudad || '').toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Barra búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <input value={filtroDir} onChange={e => { setFiltroDir(e.target.value); setPageDir(12); }}
          placeholder={t('Buscar por nombre, dirección, ciudad...', 'Search by name, address, city...', 'Buscar por nome, endereço, cidade...')}
          className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 placeholder-gray-400" />
        <button onClick={() => setTab('reportar')} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap flex-shrink-0">
          + {t('Reportar daño', 'Report damage', 'Reportar dano')}
        </button>
      </div>

      {/* Ordenamiento */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{t('Ordenar:', 'Sort:', 'Ordenar:')}</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          <button onClick={() => { setOrdenDir('prioridad'); setPageDir(12); }}
            className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${ordenDir === 'prioridad' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🚨 {t('Prioridad', 'Priority', 'Prioridade')}
          </button>
          <button onClick={() => { setOrdenDir('recientes'); setPageDir(12); }}
            className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border-l border-gray-200 ${ordenDir === 'recientes' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🕐 {t('Recientes', 'Recent', 'Recentes')}
          </button>
        </div>
      </div>

      {/* Filtro ciudad */}
      {ciudadesDisponibles.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap flex-shrink-0">📍 {t('Ciudad:', 'City:', 'Cidade:')}</span>
          <div className="flex gap-1.5">
            <button onClick={() => { setFiltroCiudad(''); setPageDir(12); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors ${!filtroCiudad ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'}`}>
              {t('Todas', 'All', 'Todas')}
            </button>
            {ciudadesDisponibles.slice(0, 12).map(c => (
              <button key={c} onClick={() => { setFiltroCiudad(filtroCiudad === c ? '' : c); setPageDir(12); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors ${filtroCiudad === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chip última hora */}
      {ultimaHora.length > 0 && (
        <div className="mb-2">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mr-2">{t('Última hora', 'Last 2 hours', 'Última hora')}</span>
          <button onClick={() => { setFiltroRapido(filtroRapido === 'ultima_hora' ? 'todos' : 'ultima_hora'); setPageDir(12); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-colors whitespace-nowrap animate-pulse ${filtroRapido === 'ultima_hora' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-300'}`}>
            🕐 {t(`Últimas 2h (${ultimaHora.length})`, `Last 2h (${ultimaHora.length})`, `Últimas 2h (${ultimaHora.length})`)}
          </button>
        </div>
      )}

      {/* Chips filtro rápido */}
      <div className="flex gap-2 flex-wrap mb-1 overflow-x-auto pb-1">
        {[
          { key: 'todos',         label: t(`Todos (${todos.length})`, `All (${todos.length})`, `Todos (${todos.length})`), color: 'gray' },
          { key: 'atrapados',     label: t(`🆘 Atrapados (${conAtrapados.length})`, `🆘 Trapped (${conAtrapados.length})`, `🆘 Presos (${conAtrapados.length})`), color: 'red' },
          { key: 'criticos',      label: t(`🚨 Críticos (${criticos.length})`, `🚨 Critical (${criticos.length})`, `🚨 Críticos (${criticos.length})`), color: 'orange' },
          { key: 'con_contactos', label: t(`📞 Con contactos (${conContactos.length})`, `📞 With contacts (${conContactos.length})`, `📞 Com contatos (${conContactos.length})`), color: 'teal' },
          { key: 'sin_verificar', label: t(`⚪ Sin verificar (${sinVerificar.length})`, `⚪ Unverified (${sinVerificar.length})`, `⚪ Sem verificar (${sinVerificar.length})`), color: 'gray' },
        ].map(chip => {
          const active = filtroRapido === chip.key;
          const colorMap = {
            red:    active ? 'bg-red-600 text-white border-red-600'       : 'bg-white text-red-600 border-red-300',
            orange: active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-700 border-orange-300',
            teal:   active ? 'bg-teal-700 text-white border-teal-700'     : 'bg-white text-teal-700 border-teal-300',
            gray:   active ? 'bg-gray-800 text-white border-gray-800'     : 'bg-white text-gray-600 border-gray-300',
          };
          return (
            <button key={chip.key} onClick={() => { setFiltroRapido(chip.key); setPageDir(12); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${colorMap[chip.color]}`}>
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Lista / grid */}
      {cargandoDir ? (
        <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
          <Loader2 size={20} className="animate-spin" />
          {t('Cargando directorio...', 'Loading directory...', 'Carregando diretório...')}
        </div>
      ) : dirFiltrados.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
          <p className="text-2xl mb-2">🏗️</p>
          <p>{t('Sin reportes para este filtro.', 'No reports for this filter.', 'Sem relatórios para este filtro.')}</p>
          <button onClick={() => setTab('reportar')} className="text-blue-600 underline text-sm mt-2 cursor-pointer">
            {t('Ser el primero en reportar →', 'Be the first to report →', 'Seja o primeiro a reportar →')}
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {dirFiltrados.length} {t(
              `edificio(s) · ${ordenDir === 'recientes' ? 'más recientes primero' : 'ordenados por prioridad'}`,
              `building(s) · ${ordenDir === 'recientes' ? 'most recent first' : 'sorted by priority'}`,
              `edifício(s)`
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {dirFiltrados.slice(0, pageDir).map(r => {
              const c = cfg(r.nivel_dano);
              const noEntrar = ['grave', 'critico', 'colapsado'].includes(r.nivel_dano);
              const esCrit = noEntrar || r.prioridad === 'critica';
              return (
                <Link key={r.id} to={`/edificio?id=${r.id}`}
                  className="bg-white rounded-xl overflow-hidden no-underline hover:shadow-md transition-shadow flex flex-col"
                  style={{ border: `2px solid ${esCrit ? c.cardBorder : '#E5E7EB'}` }}>
                  <EdificioImagen fotoUrls={r.foto_urls} tipoEstructura={r.tipo_estructura} nivelDano={r.nivel_dano} reporte={r} height={112} lang={lang} sinFotoNudge />
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    {esCrit && <span className="self-start text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">🚫 {t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR')}</span>}
                    <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">
                      {r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || t('Sin nombre', 'Unnamed', 'Sem nome')}
                    </p>
                    {r.tipo_estructura && <p className="text-[10px] text-gray-400 truncate capitalize">{r.tipo_estructura.replace(/_/g, ' ')}</p>}
                    <p className="text-[10px] text-gray-400 truncate">📍 {[r.direccion, r.ciudad].filter(Boolean).join(' · ') || '—'}</p>
                    <span className="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-auto"
                      style={{ color: c.color, borderColor: c.border, background: c.bg }}>
                      {c.icon} {t(c.label.es, c.label.en, c.label.es)}
                    </span>
                    {(r.riesgo_gas || r.riesgo_electrico || r.riesgo_incendio || r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces') && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {(r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces') && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full font-bold">🆘</span>}
                        {r.riesgo_gas       && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full">💨</span>}
                        {r.riesgo_electrico && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full">⚡</span>}
                        {r.riesgo_incendio  && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded-full">🔥</span>}
                      </div>
                    )}
                    {r.nivel_verificacion === 'institucional' && <span className="text-[9px] text-teal-700 font-semibold">🛡️ {t('Verificado', 'Verified', 'Verificado')}</span>}
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
                      <span className="text-[9px] text-gray-400">🕐 {tiempoRelativo(r.updated_date || r.created_date)}</span>
                      <div className="flex items-center gap-1">
                        {r.contactos_acceso?.length > 0 && <span className="text-[9px] text-teal-600 font-semibold">📞 {r.contactos_acceso.length}</span>}
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setAvisameEdificio({ id: r.id, nombre: r.nombre_lugar || r.tipo_estructura?.replace(/_/g, ' ') || '—', direccion: r.direccion, ciudad: r.ciudad }); }}
                          className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-300 px-1.5 py-0.5 rounded-full hover:bg-green-100 flex items-center gap-0.5 cursor-pointer">
                          🔔 {t('Avísame', 'Notify me', 'Me avise')}
                        </button>
                        <Link to={`/solicitar-inspeccion?edificio=${r.id}`} onClick={e => e.stopPropagation()}
                          className="text-[9px] font-bold text-white bg-blue-700 px-1.5 py-0.5 rounded-full no-underline hover:bg-blue-800">
                          📸 {t('Inspección', 'Inspect', 'Inspeção')}
                        </Link>
                        <Link to={`/edificio?id=${r.id}`} onClick={e => e.stopPropagation()}
                          className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full no-underline hover:bg-blue-100">
                          ✏️ {t('Actualizar', 'Update', 'Atualizar')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {dirFiltrados.length > pageDir && (
            <button onClick={() => setPageDir(v => v + 12)}
              className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
              {t(`Ver ${Math.min(12, dirFiltrados.length - pageDir)} más`, `Load ${Math.min(12, dirFiltrados.length - pageDir)} more`, `Ver mais`)}
            </button>
          )}
        </>
      )}

      {/* Personas buscadas y encontradas */}
      <div className="mt-8 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold text-gray-800">👤 {t('Personas buscadas y encontradas', 'Missing & Found people', 'Pessoas procuradas e encontradas')}</h2>
          <input value={filtroPer} onChange={e => { setFiltroPer(e.target.value); setPagePer(8); }}
            placeholder={t('Filtrar por nombre, ciudad...', 'Filter by name, city...', 'Filtrar por nome, cidade...')}
            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600 placeholder-gray-400 w-full sm:w-64" />
        </div>
        {cargandoPer ? (
          <div className="text-center py-6 text-gray-400 text-sm">{t('Cargando...', 'Loading...', 'Carregando...')}</div>
        ) : (
          <>
            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Nombre', 'Name', 'Nome')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Edad', 'Age', 'Idade')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Última ubicación', 'Last location', 'Última localização')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Estado', 'Status', 'Estado')}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Tipo', 'Type', 'Tipo')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {perFiltradas.slice(0, pagePer).map(p => {
                    const esBuscada = !!p.nombre_completo;
                    const nombre = p.nombre_completo || p.nombre_o_descripcion || '—';
                    const estado_caso = p.estado_caso || p.condicion;
                    const st = PERSONA_ESTADO[estado_caso] || { es: estado_caso || '—', en: estado_caso || '—', cls: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><p className="font-semibold text-gray-900 text-xs">{nombre}</p>{p.sexo && <p className="text-[10px] text-gray-400">{p.sexo}</p>}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{p.edad_aprox || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600"><p>{p.ultima_ubicacion_conocida || p.ubicacion_actual || '—'}</p><p className="text-gray-400">{p.ciudad}{p.estado_region ? `, ${p.estado_region}` : ''}</p></td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{t(st.es, st.en, st.es)}</span></td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${esBuscada ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{esBuscada ? t('Buscada', 'Missing', 'Procurada') : t('Encontrada', 'Found', 'Encontrada')}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2 mb-4">
              {perFiltradas.slice(0, pagePer).map(p => {
                const esBuscada = !!p.nombre_completo;
                const nombre = p.nombre_completo || p.nombre_o_descripcion || '—';
                const estado_caso = p.estado_caso || p.condicion;
                const st = PERSONA_ESTADO[estado_caso] || { es: estado_caso || '—', en: estado_caso || '—', cls: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{nombre}</p><p className="text-xs text-gray-400 truncate">📍 {p.ultima_ubicacion_conocida || p.ubicacion_actual || '—'} · {p.ciudad}</p></div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{t(st.es, st.en, st.es)}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${esBuscada ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{esBuscada ? t('Buscada', 'Missing', 'Procurada') : t('Encontrada', 'Found', 'Encontrada')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {perFiltradas.length > pagePer && (
              <button onClick={() => setPagePer(v => v + 8)} className="w-full py-2.5 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50 mb-3">
                {t(`Ver ${Math.min(8, perFiltradas.length - pagePer)} más`, `Load ${Math.min(8, perFiltradas.length - pagePer)} more`, `Ver mais`)}
              </button>
            )}
            <div className="flex gap-3 flex-wrap">
              <Link to="/buscar-persona" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg font-semibold no-underline hover:bg-amber-100">
                + {t('Reportar persona buscada', 'Report missing person', 'Reportar pessoa procurada')}
              </Link>
              <Link to="/reportar-encontrado" className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg font-semibold no-underline hover:bg-green-100">
                + {t('Reportar persona encontrada', 'Report found person', 'Reportar pessoa encontrada')}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Solicitudes pendientes de vecinos */}
      {!cargandoSols && solicitudes.length > 0 && (
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
            <span className="text-base">🧑‍🤝‍🧑</span>
            <div>
              <p className="text-xs font-bold text-purple-800">{t('Vecinos están buscando información', 'Neighbors are looking for information', 'Vizinhos buscam informações')}</p>
              <p className="text-[11px] text-purple-600">{t('¿Conoces alguno? Tu información ayuda a la comunidad.', 'Do you know any? Your info helps the community.', 'Você conhece algum? Sua informação ajuda a comunidade.')}</p>
            </div>
          </div>
          <div className="space-y-2">
            {solicitudes.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.nombre_lugar}</p>
                  <p className="text-xs text-gray-500 truncate">📍 {s.direccion || t('Sin dirección', 'No address', 'Sem endereço')} · {s.ciudad}</p>
                </div>
                <Link to={`/reportar-dano?nombre=${encodeURIComponent(s.nombre_lugar || '')}&direccion=${encodeURIComponent(s.direccion || '')}&ciudad=${encodeURIComponent(s.ciudad || '')}`}
                  className="text-xs font-semibold bg-purple-700 text-white px-3 py-1.5 rounded-lg flex-shrink-0 no-underline hover:bg-purple-800">
                  {t('Tengo info →', 'I have info →', 'Tenho info →')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}