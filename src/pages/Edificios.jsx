import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useOffline } from '@/lib/useOffline';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import OfflineBanner from '@/components/svzla/OfflineBanner';
import PopupAvisame from '@/components/edificio/PopupAvisame';
import TabDirectorio from '@/components/edificios/TabDirectorio';
import TabConsultar from '@/components/edificios/TabConsultar';
import TabReportar from '@/components/edificios/TabReportar';

const TABS = [
  { key: 'directorio', emoji: '📋', es: 'Directorio', en: 'Directory', pt: 'Diretório' },
  { key: 'consultar',  emoji: '🔍', es: 'Buscar',    en: 'Search',    pt: 'Buscar' },
  { key: 'reportar',   emoji: '🚨', es: 'Reportar',  en: 'Report',    pt: 'Reportar' },
  { key: 'solicitar',  emoji: '📮', es: 'Solicitar', en: 'Request',   pt: 'Solicitar' },
];

export default function Edificios() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || (params.get('modo') === 'request' ? 'solicitar' : 'directorio');
  const [tab, setTab] = useState(initialTab);
  const { offline } = useOffline();

  // ── DATOS GLOBALES ──
  const [todos, setTodos] = useState([]);
  const [cargandoDir, setCargandoDir] = useState(true);
  const [personas, setPersonas] = useState([]);
  const [encontrados, setEncontrados] = useState([]);
  const [cargandoPer, setCargandoPer] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSols, setCargandoSols] = useState(true);

  // ── ESTADO DIRECTORIO ──
  const [filtroDir, setFiltroDir] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('todos');
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [ordenDir, setOrdenDir] = useState('recientes');
  const [pageDir, setPageDir] = useState(12);
  const [filtroPer, setFiltroPer] = useState('');
  const [pagePer, setPagePer] = useState(8);

  // ── POP-UP AVÍSAME ──
  const [avisameEdificio, setAvisameEdificio] = useState(null);
  const [avisameEmail, setAvisameEmail] = useState('');
  const [avisameNombre, setAvisameNombre] = useState('');
  const [avisameEnviando, setAvisameEnviando] = useState(false);
  const [avisameOk, setAvisameOk] = useState(false);

  useEffect(() => {
    base44.entities.ReportesDano.list('-updated_date', 2000)
      .then(d => setTodos(d || []))
      .catch(() => {})
      .finally(() => setCargandoDir(false));
    Promise.all([
      base44.entities.PersonasBuscadas.list('-created_date', 100),
      base44.entities.PersonasEncontradas.list('-created_date', 50),
    ]).then(([b, e]) => {
      setPersonas((b || []).filter(p => p.estado_caso !== 'caso_cerrado'));
      setEncontrados(e || []);
    }).catch(() => {}).finally(() => setCargandoPer(false));
    base44.entities.SolicitudesInfoEdificio.filter({ estado_solicitud: 'pendiente' }, '-created_date', 10)
      .then(sols => { if (sols) setSolicitudes(sols.filter(s => s.nombre_lugar && !s.reporte_encontrado_id)); })
      .catch(() => {}).finally(() => setCargandoSols(false));
  }, []);

  const handleAvisame = async () => {
    if (!avisameEmail.trim() || !avisameEdificio) return;
    setAvisameEnviando(true);
    try {
      await base44.functions.invoke('registrarSuscripcionEdificio', { edificio_id: avisameEdificio.id, email: avisameEmail.trim(), nombre: avisameNombre.trim(), lang });
      setAvisameOk(true);
    } catch {}
    setAvisameEnviando(false);
  };

  const cerrarAvisame = () => { setAvisameEdificio(null); setAvisameEmail(''); setAvisameNombre(''); setAvisameOk(false); setAvisameEnviando(false); };

  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F2F5' }}>
      <TopBar />
      <OfflineBanner offline={offline} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 flex flex-col gap-3">

        {/* ── PANEL SUPERIOR ── */}
        <div className="rounded-2xl px-5 py-4" style={{ background: '#111827', boxShadow: '0 2px 10px rgba(0,0,0,0.10)' }}>
          <Link to="/" className="inline-flex items-center gap-1 text-xs mb-2 no-underline" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ChevronLeft size={14} /> {t('Inicio', 'Home', 'Início')}
          </Link>
          <h1 className="text-xl font-black leading-tight mb-1" style={{ color: '#fff', letterSpacing: '-0.01em' }}>
            🏗️ {t('Edificios y estructuras', 'Buildings & structures', 'Edifícios e estruturas')}
          </h1>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {t('Directorio de edificios reportados · Consulta y reporta daños.', 'Directory of reported buildings · Check and report damage.', 'Diretório de edifícios reportados · Consulte e reporte danos.')}
          </p>

          {/* Segmented tabs */}
          <div className="grid grid-cols-4 gap-1.5 mt-4 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {TABS.map(tb => {
              const active = tab === tb.key;
              return (
                <button key={tb.key} onClick={() => setTab(tb.key)}
                  className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  style={active ? { background: '#fff', color: '#111827' } : { background: 'transparent', color: 'rgba(255,255,255,0.6)' }}>
                  <span className="text-sm">{tb.emoji}</span>
                  {pt ? tb.pt : es ? tb.es : tb.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BANNER GUÍA + ALERTA: fila combinada ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/guia-edificios" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 no-underline"
            style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
            <span className="text-xl flex-shrink-0">📖</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black leading-tight" style={{ color: '#111827' }}>{t('¿Sabes evaluar un edificio dañado?', 'Know how to evaluate damage?', 'Sabe avaliar um edifício danificado?')}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{t('Ver guía de seguridad →', 'View safety guide →', 'Ver guia de segurança →')}</p>
            </div>
          </Link>

          <div className="flex gap-3 rounded-2xl px-4 py-3.5" style={{ background: '#FEF2F2', border: '1px solid rgba(192,57,43,0.25)' }}>
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
            <p className="text-[11.5px] font-medium leading-relaxed" style={{ color: '#991B1B' }}>
              {t('No entres a estructuras dañadas. Si hay grietas graves, gas, cables o atrapados — llama al 171.',
                 'Do not enter damaged structures. If there are cracks, gas, wires or trapped people — call 171.',
                 'Não entre em estruturas danificadas. Se houver rachaduras, gás, fios ou presos — ligue 171.')}
            </p>
          </div>
        </div>

        {/* ── CONTENIDO POR TAB ── */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          {tab === 'directorio' && (
            <TabDirectorio
              todos={todos} cargandoDir={cargandoDir} cargandoPer={cargandoPer} cargandoSols={cargandoSols}
              filtroDir={filtroDir} setFiltroDir={setFiltroDir}
              filtroRapido={filtroRapido} setFiltroRapido={setFiltroRapido}
              filtroCiudad={filtroCiudad} setFiltroCiudad={setFiltroCiudad}
              ordenDir={ordenDir} setOrdenDir={setOrdenDir}
              pageDir={pageDir} setPageDir={setPageDir}
              personas={personas} encontrados={encontrados} solicitudes={solicitudes}
              filtroPer={filtroPer} setFiltroPer={setFiltroPer}
              pagePer={pagePer} setPagePer={setPagePer}
              setTab={setTab} setAvisameEdificio={setAvisameEdificio}
              lang={lang} t={t}
            />
          )}

          {tab === 'consultar' && <TabConsultar todos={todos} setTab={setTab} t={t} lang={lang} />}

          {tab === 'reportar' && <TabReportar todos={todos} setTab={setTab} lang={lang} t={t} />}

          {tab === 'solicitar' && (
            <div className="text-center py-8">
              <p className="text-2xl mb-3">📮</p>
              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
                {t('¿No encuentras un edificio en el directorio? Solicita que lo incluyamos.',
                   "Can't find a building in the directory? Request it and we'll add it.",
                   'Não encontrou um edifício no diretório? Solicite que o incluamos.')}
              </p>
              <Link to="/solicitar-info-edificio"
                className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl text-sm no-underline"
                style={{ background: '#B45309', color: '#fff' }}>
                📮 {t('Solicitar información de un edificio', 'Request building information', 'Solicitar informações de um edifício')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <PopupAvisame
        avisameEdificio={avisameEdificio} cerrarAvisame={cerrarAvisame}
        avisameNombre={avisameNombre} setAvisameNombre={setAvisameNombre}
        avisameEmail={avisameEmail} setAvisameEmail={setAvisameEmail}
        avisameEnviando={avisameEnviando} avisameOk={avisameOk}
        handleAvisame={handleAvisame} t={t}
      />
    </div>
  );
}