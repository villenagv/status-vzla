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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <OfflineBanner offline={offline} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {/* Encabezado */}
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-2">
            <ChevronLeft size={15} /> {t('Inicio', 'Home', 'Início')}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">🏗️ {t('Edificios y estructuras', 'Buildings & structures', 'Edifícios e estruturas')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('Directorio de edificios reportados · Consulta y reporta daños.', 'Directory of reported buildings · Check and report damage.', 'Diretório de edifícios reportados · Consulte e reporte danos.')}</p>
        </div>

        {/* Banner guía */}
        <Link to="/guia-edificios" className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 mb-4 no-underline">
          <span className="text-xl flex-shrink-0">📖</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white leading-tight">{t('¿Sabes cómo evaluar un edificio dañado?', 'Do you know how to evaluate a damaged building?', 'Sabe como avaliar um edifício danificado?')}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{t('Ver guía de seguridad estructural →', 'View structural safety guide →', 'Ver guia de segurança estrutural →')}</p>
          </div>
          <span className="text-gray-500 text-sm flex-shrink-0">›</span>
        </Link>

        {/* Alerta */}
        <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 font-medium leading-relaxed">
            {t('No entres a estructuras dañadas. Si hay grietas graves, gas, cables o atrapados — llama a Protección Civil (171) o Bomberos.',
               'Do not enter damaged structures. If there are cracks, gas, wires or trapped people — call Civil Protection (171) or Firefighters.',
               'Não entre em estruturas danificadas. Se houver rachaduras graves, gás, fios ou pessoas presas — ligue para Proteção Civil (171).')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {[
            { key: 'directorio', label: t('📋 Directorio', '📋 Directory', '📋 Diretório') },
            { key: 'consultar',  label: t('🔍 Buscar',    '🔍 Search',    '🔍 Buscar')    },
            { key: 'reportar',   label: t('🚨 Reportar',  '🚨 Report',    '🚨 Reportar')  },
            { key: 'solicitar',  label: t('📋 Solicitar', '📋 Request',   '📋 Solicitar') },
          ].map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${tab === tb.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Contenido por tab */}
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
            <p className="text-2xl mb-3">📋</p>
            <p className="text-sm text-gray-500 mb-4">
              {t('¿No encuentras un edificio en el directorio? Solicita que lo incluyamos.',
                 "Can't find a building in the directory? Request it and we'll add it.",
                 'Não encontrou um edifício no diretório? Solicite que o incluamos.')}
            </p>
            <Link to="/solicitar-info-edificio"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 rounded-xl text-sm no-underline transition-colors">
              📋 {t('Solicitar información de un edificio', 'Request building information', 'Solicitar informações de um edifício')}
            </Link>
          </div>
        )}
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