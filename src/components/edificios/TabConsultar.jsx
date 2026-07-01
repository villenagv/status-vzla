import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { normalizarTexto, similitudTexto } from '@/lib/similitud';

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', label: { es: 'Daño leve',     en: 'Minor damage'   }, icon: '🟡', acceso: { es: 'Entrada con precaución', en: 'Enter with caution' } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', label: { es: 'Daño moderado', en: 'Moderate damage' }, icon: '🟠', acceso: { es: 'Entrada limitada',       en: 'Limited entry'      } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', label: { es: 'Daño grave',    en: 'Severe damage'   }, icon: '🔴', acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'       } },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', label: { es: 'CRÍTICO',       en: 'CRITICAL'        }, icon: '🚨', acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER'       } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin evaluar',   en: 'Not evaluated'   }, icon: '⚪', acceso: { es: 'Sin verificar',          en: 'Unverified'         } },
  no_sabe:     { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin datos',     en: 'No data'         }, icon: '⚪', acceso: { es: 'Sin información',        en: 'No information'     } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', label: { es: 'COLAPSADO',     en: 'COLLAPSED'       }, icon: '💥', acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER'       } },
};
const cfg = (d) => DANO_CONFIG[d] || DANO_CONFIG.no_evaluado;

const PRIORIDAD_SORT = { critico: 0, colapsado: 1, grave: 2, moderado: 3, leve: 4, no_evaluado: 5, no_sabe: 6 };

export default function TabConsultar({ todos, setTab, t, lang }) {
  const es = lang === 'es';
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subPara, setSubPara] = useState(null);
  const [subEnviando, setSubEnviando] = useState(false);
  const [subOk, setSubOk] = useState(false);

  const buscar = async () => {
    if (!query.trim()) return;
    setBuscando(true); setBuscado(false);
    const q = normalizarTexto(query);
    const enc = todos.filter(r => {
      const dir = normalizarTexto(r.direccion || '');
      const ciudad = normalizarTexto(r.ciudad || '');
      const nombre = normalizarTexto(r.nombre_lugar || '');
      return similitudTexto(q, dir) > 0.4 || similitudTexto(q, ciudad) > 0.6 || similitudTexto(q, nombre) > 0.5 || dir.includes(q) || ciudad.includes(q) || nombre.includes(q);
    }).sort((a, b) => (PRIORIDAD_SORT[a.nivel_dano] ?? 5) - (PRIORIDAD_SORT[b.nivel_dano] ?? 5));
    setResultados(enc);
    setBuscando(false); setBuscado(true);
  };

  const suscribirse = async (reporteId) => {
    if (!subEmail.trim()) return;
    setSubEnviando(true);
    try {
      const { base44 } = await import('@/api/base44Client');
      await base44.functions.invoke('registrarSuscripcionEdificio', { edificio_id: reporteId, email: subEmail.trim(), lang });
      setSubOk(true);
      setTimeout(() => setSubOk(false), 3000);
    } catch {}
    setSubEnviando(false); setSubEmail(''); setSubPara(null);
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="text-base font-semibold text-gray-800 mb-1">{t('¿Es seguro este edificio?', 'Is this building safe?', 'Este edifício é seguro?')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('Escribe la dirección, nombre o zona para ver si hay reportes.', 'Type the address, name or area to see if there are reports.', 'Digite o endereço, nome ou área para ver se há relatórios.')}</p>
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder={t('Ej: Edif. Las Torres, Av. Principal, La Guaira...', 'E.g: Las Torres building, Main Ave, La Guaira...', 'Ex: Ed. Las Torres, Av. Principal, La Guaira...')}
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-600" />
          <button onClick={buscar} disabled={buscando}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {t('Buscar', 'Search', 'Buscar')}
          </button>
        </div>
      </div>

      {buscado && !buscando && resultados.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800 text-sm">{t('Sin reportes de daño para esta búsqueda.', 'No damage reports found for this search.', 'Nenhum relatório de dano para esta busca.')}</p>
          <p className="text-xs text-green-600 mt-1">{t('Esto no garantiza que sea 100% seguro. Si ves daños, repórtalos.', 'This does not guarantee 100% safety. If you see damage, report it.', 'Isso não garante 100% de segurança. Se ver danos, reporte.')}</p>
          <button onClick={() => setTab('reportar')} className="mt-3 text-sm text-blue-700 underline cursor-pointer">{t('Reportar daño →', 'Report damage →', 'Reportar dano →')}</button>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{resultados.length} {t('reporte(s)', 'report(s)', 'relatório(s)')}</p>
          {resultados.map(r => {
            const c = cfg(r.nivel_dano);
            const noEntrar = ['grave', 'critico', 'colapsado'].includes(r.nivel_dano);
            return (
              <div key={r.id} style={{ background: c.bg, borderColor: c.border }} className="border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{c.icon}</span>
                      <span className="font-bold text-sm" style={{ color: c.color }}>{t(c.label.es, c.label.en, c.label.es)}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{r.nombre_lugar || r.tipo_estructura}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><MapPin size={10} />{r.direccion} · {r.ciudad}, {r.estado_region}</p>
                  </div>
                  {noEntrar && (
                    <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0 text-center">
                      {t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {r.personas_atrapadas === 'si' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">🚨 {t('Atrapados', 'Trapped', 'Presos')}</span>}
                  {r.riesgo_gas            && <span className="text-xs bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">💨 Gas</span>}
                  {r.riesgo_electrico      && <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">⚡</span>}
                  {r.riesgo_incendio       && <span className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">🔥</span>}
                </div>
                {r.foto_urls?.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {r.foto_urls.slice(0, 3).map((url, i) => <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />)}
                    {r.foto_urls.length > 3 && <span className="text-xs text-gray-400 self-center">+{r.foto_urls.length - 3}</span>}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t" style={{ borderColor: c.border }}>
                  <p className="text-xs font-medium" style={{ color: c.color }}>🚪 {t(c.acceso.es, c.acceso.en, c.acceso.es)}</p>
                  {r.descripcion && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.descripcion}</p>}
                </div>
                {subPara?.id === r.id && (
                  <div className="mt-3 flex gap-2">
                    <input value={subEmail} onChange={e => setSubEmail(e.target.value)}
                      placeholder={t('Tu email...', 'Your email...', 'Seu email...')}
                      className="flex-1 border-2 border-gray-300 rounded-lg px-2.5 py-2 text-xs bg-white text-gray-900 focus:outline-none focus:border-blue-600 placeholder-gray-400" />
                    <button onClick={() => suscribirse(r.id)} disabled={subEnviando}
                      className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-40 cursor-pointer">
                      {t('Suscribir', 'Subscribe', 'Inscrever')}
                    </button>
                  </div>
                )}
                <div className="mt-2 flex justify-between items-center">
                  {subOk && subPara?.id === r.id && <span className="text-xs text-green-600 font-medium">✅ {t('Suscrito.', 'Subscribed.', 'Inscrito.')}</span>}
                  {(!subPara || subPara.id !== r.id) && (
                    <button onClick={() => setSubPara({ id: r.id })} className="text-[11px] text-blue-600 underline cursor-pointer">
                      🔔 {t('Avísame si cambia el estado', 'Notify me of changes', 'Me avise se mudar')}
                    </button>
                  )}
                  <Link to={`/edificio?id=${r.id}`} className="text-[11px] text-blue-600 font-semibold no-underline hover:underline">
                    {t('Ver ficha completa →', 'View full record →', 'Ver ficha completa →')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}