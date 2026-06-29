import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Misma paleta que EstadoOperativo / SERVICIO_CONFIG
const RESCATE_CFG = {
  no_presente:              { bg: '#f9fafb', border: '#e5e7eb', color: '#6b7280', dot: '⚫', es: 'Sin equipo en sitio',    en: 'No team on site'          },
  en_camino:                { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', dot: '🚐', es: 'Equipo en camino',       en: 'Team en route'            },
  trabajando:               { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', dot: '🔴', es: 'Equipo activo en sitio', en: 'Team actively on site'    },
  finalizado:               { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', dot: '✅', es: 'Operación finalizada',   en: 'Operation finished'       },
  requiere_apoyo_adicional: { bg: '#fef2f2', border: '#ef4444', color: '#b91c1c', dot: '🆘', es: '¡NECESITA MÁS APOYO!',  en: 'NEEDS MORE SUPPORT!'      },
  no_confirmado:            { bg: '#f9fafb', border: '#e5e7eb', color: '#6b7280', dot: '⚪', es: 'Sin confirmar',          en: 'Unconfirmed'              },
};

const MAQUINARIA_CFG = {
  no_requerida:             { color: '#16a34a', dot: '✅', es: 'No se necesita maquinaria',               en: 'No machinery needed'             },
  requerida_no_disponible:  { color: '#b91c1c', dot: '🆘', es: 'MAQUINARIA REQUERIDA — sin disponibilidad', en: 'MACHINERY NEEDED — not available' },
  en_camino:                { color: '#1d4ed8', dot: '🚛', es: 'Maquinaria en camino',                     en: 'Machinery en route'              },
  en_sitio:                 { color: '#16a34a', dot: '✅', es: 'Maquinaria ya en sitio',                   en: 'Machinery on site'               },
  no_confirmado:            { color: '#6b7280', dot: '⚪', es: 'Sin confirmar',                            en: 'Unconfirmed'                     },
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

  // Sin datos: mismo estilo que ServicioChip con no_confirmado
  if (!tieneRescate && !tieneMaquinaria && !tieneRecursos && !tieneTiposMaq) {
    return (
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          🚒 {es ? 'Respuesta en sitio' : 'On-site response'}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: 0 }}>
          ⚪ {es ? 'Sin información de equipos de rescate aún.' : 'No rescue team information yet.'}
        </p>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: '3px 0 0', lineHeight: 1.5 }}>
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
      background: necesitaApoyo ? '#fef2f2' : '#f9fafb',
      border: `2px solid ${necesitaApoyo ? '#ef4444' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: '10px 14px',
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: necesitaApoyo ? '#b91c1c' : '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        🚒 {es ? 'Respuesta en sitio' : 'On-site response'}
      </p>

      {/* Estado rescate — mismo layout que ServicioChip */}
      {tieneRescate && (
        <div style={{ background: rescateCfg.bg, border: `1.5px solid ${rescateCfg.border}`, borderRadius: 10, padding: '8px 12px', marginBottom: (tieneMaquinaria || tieneRecursos || tieneTiposMaq) ? 8 : 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: rescateCfg.color, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {es ? 'Equipo de rescate' : 'Rescue team'}
          </p>
          <p style={{ fontSize: 14, fontWeight: 800, color: rescateCfg.color, margin: 0 }}>
            {rescateCfg.dot} {es ? rescateCfg.es : rescateCfg.en}
          </p>
          {estado.rescate_institucion && (
            <p style={{ fontSize: 11, color: '#4b5563', margin: '4px 0 0' }}>🏛️ {estado.rescate_institucion}</p>
          )}
          {estado.rescate_notas && (
            <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', fontStyle: 'italic' }}>{estado.rescate_notas}</p>
          )}
        </div>
      )}

      {/* Estado maquinaria */}
      {tieneMaquinaria && (
        <div style={{
          background: '#fffbeb',
          border: `1.5px solid ${estado.estado_maquinaria === 'requerida_no_disponible' ? '#ef4444' : '#fde68a'}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: (tieneRecursos || tieneTiposMaq) ? 8 : 0,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#b45309', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🏗️ {es ? 'Maquinaria pesada' : 'Heavy machinery'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 800, color: maqCfg.color, margin: 0 }}>
            {maqCfg.dot} {es ? maqCfg.es : maqCfg.en}
          </p>
          {tieneTiposMaq && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {estado.tipos_maquinaria_req.map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 600, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 20, padding: '2px 8px' }}>
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recursos adicionales */}
      {tieneRecursos && (
        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📦 {es ? 'Recursos adicionales requeridos' : 'Additional resources needed'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {estado.recursos_adicionales_req.map(r => (
              <span key={r} style={{ fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 8px' }}>
                {r.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}