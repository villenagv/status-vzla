import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const RESCATE_CFG = {
  no_presente:              { bg: '#1C2128', border: '#30363D', color: '#C0C8D2', dot: '⚫', es: 'Sin equipo en sitio',     en: 'No team on site'           },
  en_camino:                { bg: '#0D2239', border: '#1D4ED8', color: '#93C5FD', dot: '🚐', es: 'Equipo en camino',        en: 'Team en route'             },
  trabajando:               { bg: '#1A0A0A', border: '#DC2626', color: '#FCA5A5', dot: '🔴', es: 'Equipo activo en sitio',  en: 'Team actively on site'     },
  finalizado:               { bg: '#0A1F0A', border: '#16A34A', color: '#86EFAC', dot: '✅', es: 'Operación finalizada',    en: 'Operation finished'        },
  requiere_apoyo_adicional: { bg: '#1A0A0A', border: '#EF4444', color: '#FCA5A5', dot: '🆘', es: '¡NECESITA MÁS APOYO!',   en: 'NEEDS MORE SUPPORT!'       },
  no_confirmado:            { bg: '#1C2128', border: '#30363D', color: '#9BA5B0', dot: '⚪', es: 'Sin confirmar',           en: 'Unconfirmed'               },
};

const MAQUINARIA_CFG = {
  no_requerida:             { color: '#86EFAC', dot: '✅', es: 'No se necesita maquinaria',      en: 'No machinery needed'       },
  requerida_no_disponible:  { color: '#FCA5A5', dot: '🆘', es: 'MAQUINARIA REQUERIDA — sin disponibilidad', en: 'MACHINERY NEEDED — not available' },
  en_camino:                { color: '#93C5FD', dot: '🚛', es: 'Maquinaria en camino',            en: 'Machinery en route'        },
  en_sitio:                 { color: '#86EFAC', dot: '✅', es: 'Maquinaria ya en sitio',          en: 'Machinery on site'         },
  no_confirmado:            { color: '#9BA5B0', dot: '⚪', es: 'Sin confirmar',                   en: 'Unconfirmed'               },
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

  // No mostrar si no hay ningún dato de rescate
  const tieneRescate = estado?.estado_rescate && estado.estado_rescate !== 'no_confirmado';
  const tieneMaquinaria = estado?.estado_maquinaria && estado.estado_maquinaria !== 'no_confirmado';
  const tieneRecursos = estado?.recursos_adicionales_req?.length > 0;
  const tieneTiposMaq = estado?.tipos_maquinaria_req?.length > 0;

  if (!tieneRescate && !tieneMaquinaria && !tieneRecursos && !tieneTiposMaq) {
    // Mostrar un bloque vacío pero informativo
    return (
      <div style={{
        background: '#161B22',
        border: '1px solid #30363D',
        borderRadius: 14,
        padding: '12px 16px',
        marginBottom: 10,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9BA5B0', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          🚒 {es ? 'Respuesta en sitio' : 'On-site response'}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#C0C8D2', margin: 0 }}>
          ⚪ {es ? 'Sin información de equipos de rescate aún.' : 'No rescue team information yet.'}
        </p>
        <p style={{ fontSize: 10, color: '#6B7280', margin: '3px 0 0' }}>
          {es ? '¿Sabes si hay rescatistas? Usa "Estado operativo → Equipos de rescate" para reportar.' : 'Know if there are rescuers? Use "Operational status → Rescue teams" to report.'}
        </p>
      </div>
    );
  }

  const rescateCfg = RESCATE_CFG[estado?.estado_rescate] || RESCATE_CFG.no_confirmado;
  const maqCfg = MAQUINARIA_CFG[estado?.estado_maquinaria] || MAQUINARIA_CFG.no_confirmado;

  const necesitaApoyo = estado?.estado_rescate === 'requiere_apoyo_adicional' || estado?.estado_maquinaria === 'requerida_no_disponible';

  return (
    <div style={{
      background: necesitaApoyo ? '#1A0505' : '#161B22',
      border: `2px solid ${necesitaApoyo ? '#EF4444' : '#30363D'}`,
      borderRadius: 14,
      padding: '12px 16px',
      marginBottom: 10,
      boxShadow: necesitaApoyo ? '0 0 0 1px rgba(239,68,68,0.20)' : 'none',
    }}>
      {/* Encabezado */}
      <p style={{ fontSize: 10, fontWeight: 700, color: necesitaApoyo ? '#FCA5A5' : '#9BA5B0', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        🚒 {es ? 'Respuesta en sitio' : 'On-site response'}
      </p>

      {/* Estado rescate */}
      {tieneRescate && (
        <div style={{
          background: rescateCfg.bg,
          border: `1.5px solid ${rescateCfg.border}`,
          borderRadius: 10,
          padding: '9px 12px',
          marginBottom: tieneMaquinaria || tieneRecursos || tieneTiposMaq ? 8 : 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: rescateCfg.color, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {es ? 'Equipo de rescate' : 'Rescue team'}
          </p>
          <p style={{ fontSize: 14, fontWeight: 800, color: rescateCfg.color, margin: 0 }}>
            {rescateCfg.dot} {es ? rescateCfg.es : rescateCfg.en}
          </p>
          {estado.rescate_institucion && (
            <p style={{ fontSize: 11, color: '#C0C8D2', margin: '4px 0 0' }}>🏛️ {estado.rescate_institucion}</p>
          )}
          {estado.rescate_notas && (
            <p style={{ fontSize: 11, color: '#9BA5B0', margin: '3px 0 0', fontStyle: 'italic' }}>{estado.rescate_notas}</p>
          )}
        </div>
      )}

      {/* Estado maquinaria */}
      {tieneMaquinaria && (
        <div style={{
          background: '#1C1200',
          border: `1.5px solid ${estado.estado_maquinaria === 'requerida_no_disponible' ? '#EF4444' : '#92400E'}`,
          borderRadius: 10,
          padding: '9px 12px',
          marginBottom: (tieneRecursos || tieneTiposMaq) ? 8 : 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#FCD34D', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🏗️ {es ? 'Maquinaria pesada' : 'Heavy machinery'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 800, color: maqCfg.color, margin: 0 }}>
            {maqCfg.dot} {es ? maqCfg.es : maqCfg.en}
          </p>
          {/* Tipos de maquinaria */}
          {tieneTiposMaq && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {estado.tipos_maquinaria_req.map(t => (
                <span key={t} style={{
                  fontSize: 10, fontWeight: 700,
                  background: 'rgba(251,146,60,0.15)',
                  color: '#FCD34D',
                  border: '1px solid rgba(251,146,60,0.35)',
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
          background: '#0D1B2A',
          border: '1.5px solid #1D4ED8',
          borderRadius: 10,
          padding: '9px 12px',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#93C5FD', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📦 {es ? 'Recursos adicionales requeridos' : 'Additional resources needed'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {estado.recursos_adicionales_req.map(r => (
              <span key={r} style={{
                fontSize: 10, fontWeight: 700,
                background: 'rgba(29,78,216,0.20)',
                color: '#93C5FD',
                border: '1px solid rgba(59,130,246,0.40)',
                borderRadius: 20, padding: '2px 8px',
              }}>{r.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}