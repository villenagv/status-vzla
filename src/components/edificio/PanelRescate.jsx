import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

// Colores adaptados a fondo CLARO (tarjeta de edificio siempre tiene bg claro o rojo oscuro)
// Usamos system colors legibles sobre #F8FAFC y #1A0505
const RESCATE_CFG = {
  no_presente:              { bg: '#F3F4F6', border: '#D1D5DB', color: '#374151', dot: '⚫', es: 'Sin equipo en sitio',     en: 'No team on site'           },
  en_camino:                { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', dot: '🚐', es: 'Equipo en camino',        en: 'Team en route'             },
  trabajando:               { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', dot: '🔴', es: 'Equipo activo en sitio',  en: 'Team actively on site'     },
  finalizado:               { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', dot: '✅', es: 'Operación finalizada',    en: 'Operation finished'        },
  requiere_apoyo_adicional: { bg: '#FEF2F2', border: '#EF4444', color: '#B91C1C', dot: '🆘', es: '¡NECESITA MÁS APOYO!',   en: 'NEEDS MORE SUPPORT!'       },
  no_confirmado:            { bg: '#F9FAFB', border: '#E5E7EB', color: '#6B7280', dot: '⚪', es: 'Sin confirmar',           en: 'Unconfirmed'               },
};

const MAQUINARIA_CFG = {
  no_requerida:             { color: '#15803D', dot: '✅', es: 'No se necesita maquinaria',              en: 'No machinery needed'             },
  requerida_no_disponible:  { color: '#B91C1C', dot: '🆘', es: 'MAQUINARIA REQUERIDA — sin disponibilidad', en: 'MACHINERY NEEDED — not available' },
  en_camino:                { color: '#1D4ED8', dot: '🚛', es: 'Maquinaria en camino',                    en: 'Machinery en route'              },
  en_sitio:                 { color: '#15803D', dot: '✅', es: 'Maquinaria ya en sitio',                  en: 'Machinery on site'               },
  no_confirmado:            { color: '#6B7280', dot: '⚪', es: 'Sin confirmar',                           en: 'Unconfirmed'                     },
};

export default function PanelRescate({ edificioId, es }) {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!edificioId) return;
    base44.entities.EstadoOperativoEdificio.filter({ edificio_id: edificioId }, '-created_date', 1)
      .then(r => { if (r?.length > 0) setEstado(r[0]); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [edificioId]);

  if (cargando) return null;

  const tieneRescate = estado?.estado_rescate && estado.estado_rescate !== 'no_confirmado';
  const tieneMaquinaria = estado?.estado_maquinaria && estado.estado_maquinaria !== 'no_confirmado';
  const tieneRecursos = estado?.recursos_adicionales_req?.length > 0;
  const tieneTiposMaq = estado?.tipos_maquinaria_req?.length > 0;

  // Sin datos: bloque gris neutro informativo (legible sobre cualquier fondo)
  if (!tieneRescate && !tieneMaquinaria && !tieneRecursos && !tieneTiposMaq) {
    return (
      <div style={{
        background: '#F3F4F6',
        border: '1px solid #D1D5DB',
        borderRadius: 12,
        padding: '10px 14px',
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          🚒 {es ? 'Respuesta en sitio' : 'On-site response'}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>
          ⚪ {es ? 'Sin información de equipos de rescate aún.' : 'No rescue team information yet.'}
        </p>
        <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0', lineHeight: 1.5 }}>
          {es
            ? 'Usa "Estado operativo → Equipos de rescate" para reportar si hay rescatistas.'
            : 'Use "Operational status → Rescue teams" to report if there are rescue teams.'}
        </p>
      </div>
    );
  }

  const rescateCfg = RESCATE_CFG[estado?.estado_rescate] || RESCATE_CFG.no_confirmado;
  const maqCfg = MAQUINARIA_CFG[estado?.estado_maquinaria] || MAQUINARIA_CFG.no_confirmado;
  const necesitaApoyo = estado?.estado_rescate === 'requiere_apoyo_adicional' || estado?.estado_maquinaria === 'requerida_no_disponible';

  return (
    <div style={{
      background: necesitaApoyo ? '#FEF2F2' : '#F9FAFB',
      border: `2px solid ${necesitaApoyo ? '#EF4444' : '#E5E7EB'}`,
      borderRadius: 12,
      padding: '10px 14px',
    }}>
      {/* Encabezado */}
      <p style={{ fontSize: 10, fontWeight: 700, color: necesitaApoyo ? '#B91C1C' : '#6B7280', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        🚒 {es ? 'Respuesta en sitio' : 'On-site response'}
      </p>

      {/* Estado rescate */}
      {tieneRescate && (
        <div style={{
          background: rescateCfg.bg,
          border: `1.5px solid ${rescateCfg.border}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: tieneMaquinaria || tieneRecursos || tieneTiposMaq ? 8 : 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: rescateCfg.color, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {es ? 'Equipo de rescate' : 'Rescue team'}
          </p>
          <p style={{ fontSize: 14, fontWeight: 800, color: rescateCfg.color, margin: 0 }}>
            {rescateCfg.dot} {es ? rescateCfg.es : rescateCfg.en}
          </p>
          {estado.rescate_institucion && (
            <p style={{ fontSize: 11, color: '#4B5563', margin: '4px 0 0' }}>🏛️ {estado.rescate_institucion}</p>
          )}
          {estado.rescate_notas && (
            <p style={{ fontSize: 11, color: '#6B7280', margin: '3px 0 0', fontStyle: 'italic' }}>{estado.rescate_notas}</p>
          )}
        </div>
      )}

      {/* Estado maquinaria */}
      {tieneMaquinaria && (
        <div style={{
          background: '#FFFBEB',
          border: `1.5px solid ${estado.estado_maquinaria === 'requerida_no_disponible' ? '#EF4444' : '#D97706'}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: (tieneRecursos || tieneTiposMaq) ? 8 : 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#B45309', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🏗️ {es ? 'Maquinaria pesada' : 'Heavy machinery'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 800, color: maqCfg.color, margin: 0 }}>
            {maqCfg.dot} {es ? maqCfg.es : maqCfg.en}
          </p>
          {tieneTiposMaq && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {estado.tipos_maquinaria_req.map(t => (
                <span key={t} style={{
                  fontSize: 10, fontWeight: 700,
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FCD34D',
                  borderRadius: 20, padding: '2px 8px',
                }}>{t.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recursos adicionales */}
      {tieneRecursos && (
        <div style={{
          background: '#EFF6FF',
          border: '1.5px solid #BFDBFE',
          borderRadius: 10,
          padding: '8px 12px',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📦 {es ? 'Recursos adicionales requeridos' : 'Additional resources needed'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {estado.recursos_adicionales_req.map(r => (
              <span key={r} style={{
                fontSize: 10, fontWeight: 700,
                background: '#DBEAFE',
                color: '#1E40AF',
                border: '1px solid #BFDBFE',
                borderRadius: 20, padding: '2px 8px',
              }}>{r.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}