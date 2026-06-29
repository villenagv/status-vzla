import { Link } from 'react-router-dom';
import { Search, ClipboardCheck } from 'lucide-react';

/**
 * AlertaBuscaInspector
 * Aparece en la ficha pública de un edificio cuando el triaje técnico determinó
 * que necesita una inspección presencial (requiere_inspeccion_presencial = true)
 * y aún NO ha sido inspeccionado (triage_estado !== 'inspeccionado').
 *
 * Muestra el nivel de riesgo del triaje y un botón para que un especialista
 * tome la inspección desde el centro de inspecciones.
 *
 * Props: edificio (ReportesDano), es (bool idioma)
 */

const RIESGO = {
  riesgo_colapso:  { icon: '💥', es: 'Riesgo de colapso', en: 'Collapse risk',  color: '#7F1D1D' },
  riesgo_moderado: { icon: '🟠', es: 'Riesgo moderado',   en: 'Moderate risk',  color: '#C2410C' },
  solo_estetico:   { icon: '🟢', es: 'Daño leve',         en: 'Minor damage',   color: '#15803D' },
};

export default function AlertaBuscaInspector({ edificio, es }) {
  if (!edificio?.requiere_inspeccion_presencial || edificio.triage_estado === 'inspeccionado') return null;

  const r = RIESGO[edificio.triage_riesgo] || null;

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
          <Search size={17} className="text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-amber-900">
            {es ? 'Buscamos quien tome esta inspección' : 'Looking for someone to take this inspection'}
          </p>
          {r && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full bg-white border border-amber-200" style={{ color: r.color }}>
              {r.icon} {es ? r.es : r.en}
            </span>
          )}
          <p className="text-xs text-amber-800 mt-2 leading-relaxed">
            {es ? 'El triaje técnico determinó que este edificio necesita una inspección presencial. Un ingeniero o arquitecto verificado puede tomarla.'
                 : 'Technical triage determined this building needs an on-site inspection. A verified engineer or architect can take it.'}
          </p>
        </div>
      </div>
      <Link to={`/inspecciones?edificio=${edificio.id}`}
        className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-3 rounded-xl no-underline transition-colors">
        <ClipboardCheck size={15} /> {es ? 'Tomar esta inspección' : 'Take this inspection'}
      </Link>
    </div>
  );
}