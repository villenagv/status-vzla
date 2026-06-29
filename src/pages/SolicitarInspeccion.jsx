import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, ExternalLink, WifiOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useOffline } from '@/lib/useOffline';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import OfflineBanner from '@/components/svzla/OfflineBanner';
import SolicitarInspeccion from '@/components/inspeccion/SolicitarInspeccion';

export default function SolicitarInspeccionPage() {
  const { lang } = useLang();
  const es = lang === 'es';
  const { offline } = useOffline();

  // Si viene ?edificio=ID precargamos todos los datos de esa ficha
  const params = new URLSearchParams(window.location.search);
  const edificioId = params.get('edificio');
  // Modo sin señal abierto en pestaña dedicada (?offline=1)
  const modoSinSenal = params.get('offline') === '1';
  const [prefill, setPrefill] = useState({});
  const [cargando, setCargando] = useState(!!edificioId);

  // Abre esta misma página en una pestaña nueva, en modo sin señal
  const abrirModoSinSenal = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('offline', '1');
    window.open(url.toString(), '_blank', 'noopener');
  };

  useEffect(() => {
    if (!edificioId) return;
    base44.entities.ReportesDano.get(edificioId)
      .then(r => {
        if (r) setPrefill({
          tipo_estructura: r.tipo_estructura,
          nombre_lugar: r.nombre_lugar,
          direccion: r.direccion,
          ciudad: r.ciudad,
          estado_region: r.estado_region,
          descripcion: r.descripcion,
          personas_atrapadas: r.personas_atrapadas,
          lat: r.lat, lng: r.lng,
        });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [edificioId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <OfflineBanner offline={offline} onRetry={() => window.location.reload()} />
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6" style={{ marginTop: offline ? 40 : 0 }}>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3">
          <ChevronLeft size={15} /> {es ? 'Inicio' : 'Home'}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-1">📸 {es ? 'Pedir inspección de daños' : 'Request a damage inspection'}</h1>
        <p className="text-sm text-gray-600 mb-4">
          {es
            ? 'Reporta una estructura dañada y solicita que un voluntario técnico la revise.'
            : 'Report a damaged structure and request a technical volunteer to review it.'}
        </p>

        {/* Botón visible: modo sin señal en otra pestaña */}
        {!modoSinSenal && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <WifiOff size={15} /> {es ? '¿Vas a una zona sin señal?' : 'Heading into an area with no signal?'}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed mb-3">
              {es
                ? 'Abre el modo sin señal en una pestaña aparte. Podrás llenar el reporte y tomar fotos sin internet; todo se guarda en tu teléfono y lo subes cuando recuperes conexión.'
                : 'Open offline mode in a separate tab. You can fill the report and take photos without internet; everything is saved on your phone and you upload it when the connection returns.'}
            </p>
            <button type="button" onClick={abrirModoSinSenal}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-3 rounded-xl cursor-pointer">
              <ExternalLink size={16} /> {es ? 'Abrir modo sin señal' : 'Open offline mode'}
            </button>
          </div>
        )}

        {modoSinSenal && (
          <div className="bg-amber-100 border border-amber-300 rounded-xl px-3 py-2.5 mb-5 flex items-center gap-2">
            <WifiOff size={15} className="text-amber-700 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-900 leading-relaxed">
              {es
                ? 'Modo sin señal activo. Llena el reporte aunque no tengas internet: se guarda en este teléfono y lo subes más tarde.'
                : 'Offline mode active. Fill the report even without internet: it is saved on this phone and you upload it later.'}
            </p>
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={26} /></div>
        ) : (
          <SolicitarInspeccion es={es} prefill={prefill} />
        )}
      </div>
      <Footer />
    </div>
  );
}