import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import SolicitarInspeccion from '@/components/inspeccion/SolicitarInspeccion';

export default function SolicitarInspeccionPage() {
  const { lang } = useLang();
  const es = lang === 'es';

  // Si viene ?edificio=ID precargamos todos los datos de esa ficha
  const params = new URLSearchParams(window.location.search);
  const edificioId = params.get('edificio');
  const [prefill, setPrefill] = useState({});
  const [cargando, setCargando] = useState(!!edificioId);

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
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3">
          <ChevronLeft size={15} /> {es ? 'Inicio' : 'Home'}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-1">📸 {es ? 'Pedir inspección de daños' : 'Request a damage inspection'}</h1>
        <p className="text-sm text-gray-600 mb-5">
          {es
            ? 'Reporta una estructura dañada y solicita que un voluntario técnico la revise.'
            : 'Report a damaged structure and request a technical volunteer to review it.'}
        </p>

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