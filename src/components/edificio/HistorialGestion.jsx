import { useState, useEffect } from 'react';
import { Settings, ClipboardCheck, Clock, FileText, Search, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * HistorialGestion
 * Línea de tiempo de GESTIÓN para la ficha pública del edificio.
 * Reúne lo que el equipo técnico/voluntarios han hecho con el reporte:
 *  - Triaje rápido realizado (online)
 *  - Inspección presencial solicitada / realizada
 *  - Motivo por el que una inspección sigue pendiente
 *  - Notas de especialistas guardadas en ActualizacionesSitios (fuente: especialista)
 *
 * No muestra datos privados de contacto. Solo el rastro operativo público.
 *
 * Props: edificio (ReportesDano), es (bool idioma)
 */

const SEVERIDAD_LBL = {
  leve:     { es: 'Leve',    en: 'Minor'    },
  moderado: { es: 'Moderado', en: 'Moderate' },
  grave:    { es: 'Grave',   en: 'Severe'   },
  critico:  { es: 'Crítico', en: 'Critical' },
};
const TIPO_DANO_LBL = {
  sin_danos:   { es: 'Sin daños',              en: 'No damage'             },
  estetico:    { es: 'Solo estético',          en: 'Cosmetic only'         },
  estructural: { es: 'Estructural',            en: 'Structural'            },
  ambos:       { es: 'Estético y estructural', en: 'Cosmetic & structural' },
};
const MOTIVO_PEND_LBL = {
  sin_contacto:         { es: 'No se logró contacto con el reportante', en: 'Could not reach the reporter'    },
  acceso_no_autorizado: { es: 'Acceso no autorizado',                   en: 'Access not authorized'           },
  zona_insegura:        { es: 'Zona insegura',                          en: 'Unsafe area'                     },
  reprogramada:         { es: 'Inspección reprogramada',                en: 'Inspection rescheduled'          },
  esperando_maquinaria: { es: 'Esperando maquinaria',                   en: 'Waiting for machinery'           },
  otro:                 { es: 'Otro motivo',                            en: 'Other reason'                    },
};

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d} día${d > 1 ? 's' : ''}` : `${d} day${d > 1 ? 's' : ''} ago`;
  if (h > 0) return es ? `hace ${h} hora${h > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''} ago`;
  if (m < 1) return es ? 'ahora mismo' : 'just now';
  return es ? `hace ${m} min` : `${m} min ago`;
}

export default function HistorialGestion({ edificio, es }) {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!edificio?.id) { setCargando(false); return; }
    base44.entities.ActualizacionesSitios
      .filter({ sitio_id: edificio.id, fuente: 'especialista' }, '-created_date', 30)
      .then(d => setNotas(d || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [edificio?.id]);

  // Construimos eventos de gestión a partir de los campos del propio edificio
  const eventos = [];

  if (edificio.requiere_inspeccion_presencial) {
    eventos.push({
      key: 'solicitud',
      icon: <Search size={14} />, color: '#1D4ED8', bg: '#EFF6FF',
      titulo: es ? 'Inspección presencial solicitada' : 'On-site inspection requested',
      detalle: es ? 'Este edificio entró en la cola de inspección técnica.' : 'This building entered the technical inspection queue.',
      fecha: edificio.updated_date,
    });
  }

  if (edificio.triage_riesgo && edificio.triage_riesgo !== 'sin_clasificar') {
    const riesgoLbl = {
      riesgo_colapso:  { es: 'Riesgo de colapso', en: 'Collapse risk' },
      riesgo_moderado: { es: 'Riesgo moderado',   en: 'Moderate risk' },
      solo_estetico:   { es: 'Solo estético',     en: 'Cosmetic only' },
    }[edificio.triage_riesgo];
    eventos.push({
      key: 'triage',
      icon: <Settings size={14} />, color: '#7C3AED', bg: '#F5F3FF',
      titulo: es ? 'Triaje técnico realizado' : 'Technical triage completed',
      detalle: `${es ? 'Clasificación:' : 'Classification:'} ${riesgoLbl ? (es ? riesgoLbl.es : riesgoLbl.en) : edificio.triage_riesgo}${edificio.triage_notas ? ` · ${edificio.triage_notas}` : ''}`,
      autor: edificio.triage_por,
      fecha: edificio.triage_fecha,
    });
  }

  const motivoPend = edificio.inspeccion_estado_pendiente && edificio.inspeccion_estado_pendiente !== 'ninguno' ? edificio.inspeccion_estado_pendiente : '';
  if (motivoPend && edificio.triage_estado !== 'inspeccionado') {
    const lbl = MOTIVO_PEND_LBL[motivoPend];
    eventos.push({
      key: 'pendiente',
      icon: <Clock size={14} />, color: '#B45309', bg: '#FFFBEB',
      titulo: es ? 'Inspección pendiente' : 'Inspection pending',
      detalle: `${lbl ? (es ? lbl.es : lbl.en) : motivoPend}${edificio.inspeccion_motivo_pendiente ? ` — ${edificio.inspeccion_motivo_pendiente}` : ''}`,
      fecha: edificio.updated_date,
    });
  }

  if (edificio.triage_estado === 'inspeccionado') {
    const sev = SEVERIDAD_LBL[edificio.inspeccion_severidad];
    const tipo = TIPO_DANO_LBL[edificio.inspeccion_tipo_dano];
    eventos.push({
      key: 'inspeccion',
      icon: <ClipboardCheck size={14} />, color: '#15803D', bg: '#F0FDF4',
      titulo: es ? 'Inspección presencial realizada' : 'On-site inspection completed',
      detalle: [
        sev && sev !== undefined ? `${es ? 'Severidad:' : 'Severity:'} ${es ? sev.es : sev.en}` : null,
        tipo && tipo !== undefined ? `${es ? 'Tipo de daño:' : 'Damage type:'} ${es ? tipo.es : tipo.en}` : null,
        edificio.inspeccion_notas || null,
      ].filter(Boolean).join(' · '),
      autor: edificio.inspeccion_por,
      fecha: edificio.inspeccion_fecha,
    });
  }

  // Notas de especialistas (limpiamos el prefijo [NOTA ...])
  notas.forEach(n => {
    eventos.push({
      key: `nota-${n.id}`,
      icon: <FileText size={14} />, color: '#374151', bg: '#F9FAFB',
      titulo: es ? 'Nota del equipo técnico' : 'Technical team note',
      detalle: (n.descripcion || '').replace(/^\[NOTA[^\]]*\]\s*/i, ''),
      autor: n.reportante_nombre,
      fecha: n.created_date,
    });
  });

  // Orden por fecha (más reciente primero)
  eventos.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

  if (cargando) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin text-gray-400" />
        <p className="text-xs text-gray-400">{es ? 'Cargando historial de gestión...' : 'Loading management history...'}</p>
      </div>
    );
  }

  if (eventos.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={15} className="text-indigo-600" />
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          ⚙️ {es ? 'Historial de gestión e inspecciones' : 'Management & inspection history'}
        </h2>
      </div>
      <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
        {es ? 'Acciones del equipo técnico y voluntarios: triaje, inspecciones y notas oficiales.'
             : 'Actions by the technical team and volunteers: triage, inspections, and official notes.'}
      </p>

      <div className="space-y-2">
        {eventos.map(ev => (
          <div key={ev.key} className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: ev.bg, color: ev.color }}>
              {ev.icon}
            </div>
            <div className="flex-1 border rounded-xl px-3 py-2" style={{ background: ev.bg, borderColor: `${ev.color}22` }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold" style={{ color: ev.color }}>{ev.titulo}</p>
                {ev.fecha && <span className="text-[10px] text-gray-400 flex-shrink-0">{tiempoRelativo(ev.fecha, es)}</span>}
              </div>
              {ev.detalle && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{ev.detalle}</p>}
              {ev.autor && <p className="text-[10px] text-gray-400 mt-0.5">👤 {ev.autor}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}