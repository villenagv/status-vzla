import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TriageRapido from './TriageRapido';
import ColaInspeccion from './ColaInspeccion';
import TareasEspecialista from './TareasEspecialista';
import InspeccionCampo from './InspeccionCampo';
import TriajeMasivo from '@/components/admin/TriajeMasivo';

export default function CentroTriage({ perfil, es, vistaInicial = 'triage', isAdmin = false }) {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState(vistaInicial);

  const cargar = () => {
    setCargando(true);
    base44.entities.ReportesDano.list('-created_date', 200)
      .then(d => setReportes(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const onTriaged = (id, riesgo, reqInsp, prioridad) => {
    setReportes(prev => prev.map(r => r.id === id ? {
      ...r, triage_riesgo: riesgo, requiere_inspeccion_presencial: reqInsp, prioridad,
      triage_estado: reqInsp ? 'en_cola_inspeccion' : 'clasificado',
    } : r));
  };

  const onActualizado = (id, data) => {
    setReportes(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const porTriar = reportes.filter(r => (r.triage_riesgo || 'sin_clasificar') === 'sin_clasificar').length;
  const enCola = reportes.filter(r => r.requiere_inspeccion_presencial && r.triage_estado !== 'inspeccionado').length;

  const VISTAS = [
    { key: 'campo',  es: '📵 Inspección de campo', en: '📵 Field inspection' },
    { key: 'triage', es: `🔍 Triaje rápido (${porTriar})`, en: `🔍 Quick triage (${porTriar})` },
    { key: 'cola',   es: `📋 Inspección presencial (${enCola})`, en: `📋 On-site inspection (${enCola})` },
    { key: 'eval',   es: '🏛️ Evaluación detallada', en: '🏛️ Detailed assessment' },
    ...(isAdmin ? [{ key: 'masivo', es: '🃏 Triaje masivo', en: '🃏 Bulk triage' }] : []),
  ];

  return (
    <div>
      {/* Selector de vista */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <div className="flex gap-1.5 flex-1">
          {VISTAS.map(v => (
            <button key={v.key} onClick={() => setVista(v.key)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border whitespace-nowrap cursor-pointer transition-colors ${vista === v.key ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
              {es ? v.es : v.en}
            </button>
          ))}
        </div>
        <button onClick={cargar} disabled={cargando} className="text-gray-400 hover:text-gray-700 p-1.5 flex-shrink-0">
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin text-gray-400 mx-auto" /></div>
      ) : (
        <>
          {vista === 'campo' && <InspeccionCampo perfil={perfil} es={es} />}
          {vista === 'triage' && <TriageRapido perfil={perfil} es={es} reportes={reportes} onTriaged={onTriaged} />}
          {vista === 'cola' && <ColaInspeccion perfil={perfil} es={es} reportes={reportes} onActualizado={onActualizado} />}
          {vista === 'eval' && <TareasEspecialista perfil={perfil} es={es} />}
          {vista === 'masivo' && isAdmin && <TriajeMasivo />}
        </>
      )}
    </div>
  );
}