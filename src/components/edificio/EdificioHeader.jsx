import { MapPin, Bell, Shield, BarChart2 } from 'lucide-react';
import EdificioImagen from '@/components/svzla/EdificioImagen';
import PanelRescate from '@/components/edificio/PanelRescate';
import Semaforo from '@/components/edificio/Semaforo';
import { TIPO_LABELS, tiempoRelativo } from './edificioDetalleConfig';

export default function EdificioHeader({
  edificio, id, es, t, lang, esCritico, totalReportes, totalSuscriptores,
  reportesAtrapados, reportesHeridos, reportesFallecidos,
}) {
  return (
    <div className={`rounded-2xl overflow-hidden mb-3 border-2 ${esCritico ? 'border-red-400' : 'border-gray-300'}`} style={{ background: esCritico ? '#1A0505' : '#F8FAFC' }}>
      <EdificioImagen
        fotoUrls={edificio.foto_urls || []}
        tipoEstructura={edificio.tipo_estructura}
        nivelDano={edificio.nivel_dano}
        reporte={edificio}
        height={260}
        lang={lang}
        sinFotoNudge
        mostrarMiniaturasExtra
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{TIPO_LABELS[edificio.tipo_estructura] || '🏗️'}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: esCritico ? '#FCA5A5' : '#6B7280' }}>{t('Ficha de edificio', 'Building record', 'Ficha de edifício')}</p>
                <h1 className="text-lg font-bold leading-tight truncate" style={{ color: esCritico ? '#FFFFFF' : '#111827' }}>
                  {edificio.nombre_lugar || edificio.tipo_estructura?.replace(/_/g, ' ') || t('Edificio sin nombre', 'Unnamed building', 'Edifício sem nome')}
                </h1>
              </div>
            </div>
            {edificio.tipo_estructura && (
              <p className="text-[11px] capitalize ml-9" style={{ color: esCritico ? '#FCA5A5' : '#6B7280' }}>{edificio.tipo_estructura.replace(/_/g, ' ')}</p>
            )}
            {(edificio.direccion || edificio.ciudad) && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: esCritico ? '#C0C8D2' : '#6B7280' }}>
                <MapPin size={10} className="flex-shrink-0" style={{ color: esCritico ? '#FCA5A5' : '#9CA3AF' }} />
                {[edificio.direccion, edificio.ciudad, edificio.estado_region].filter(Boolean).join(' · ')}
              </p>
            )}
            {/* Acceso vial */}
            {edificio.acceso_calle && edificio.acceso_calle !== 'no_verificado' && (
              <p className="text-xs mt-1 flex items-center gap-1">
                {{
                  normal:        <span className="font-semibold" style={{ color: '#15803D' }}>✅ {t('Calle libre', 'Street clear', 'Rua livre')}</span>,
                  dificultad:    <span className="font-semibold" style={{ color: '#B45309' }}>⚠️ {t('Acceso con dificultad', 'Access with difficulty', 'Acesso com dificuldade')}</span>,
                  solo_peatonal: <span className="font-semibold" style={{ color: '#B45309' }}>🚶 {t('Solo a pie', 'On foot only', 'Somente a pé')}</span>,
                  bloqueada:     <span className="font-semibold" style={{ color: '#B91C1C' }}>🚫 {t('Calle bloqueada', 'Street blocked', 'Rua bloqueada')}</span>,
                  insegura:      <span className="font-semibold" style={{ color: '#B91C1C' }}>☠️ {t('Vía insegura', 'Dangerous road', 'Via perigosa')}</span>,
                  no_sabe:       <span className="font-semibold" style={{ color: '#6B7280' }}>❓ {t('Acceso no confirmado', 'Access unknown', 'Acesso desconhecido')}</span>,
                }[edificio.acceso_calle] || null}
              </p>
            )}
          </div>
          {/* Métricas rápidas */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4B5563' }}>
              <BarChart2 size={12} />{totalReportes} {t('reportes', 'reports', 'relatórios')}
            </div>
            {totalSuscriptores !== null && totalSuscriptores > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#2563EB' }}>
                <Bell size={10} />{totalSuscriptores} {t('siguiendo', 'following', 'seguindo')}
              </div>
            )}
            <p className="text-[10px]" style={{ color: '#6B7280' }}>🕐 {tiempoRelativo(edificio.updated_date || edificio.created_date, es)}</p>
            {edificio.nivel_verificacion === 'institucional' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ color: '#0F766E', background: '#CCFBF1', border: '1px solid #99F6E4' }}>
                <Shield size={8} /> {t('Verificado', 'Verified', 'Verificado')}
              </span>
            )}
          </div>
        </div>

        {/* Semáforo siempre visible */}
        <Semaforo nivel={edificio.nivel_dano} es={es} personas_atrapadas={edificio.personas_atrapadas} />

        {/* ── PANEL DE RESCATE — entre semáforo y contadores ── */}
        <div className="mt-3">
          <PanelRescate edificioId={id} es={es} />
        </div>

        {/* Riesgos activos */}
        {(edificio.riesgo_gas || edificio.riesgo_electrico || edificio.riesgo_incendio || edificio.riesgo_colapso) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {edificio.riesgo_gas       && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(251,146,60,0.18)', color: '#FCD34D', border: '1px solid rgba(251,146,60,0.45)' }}>💨 {t('Gas', 'Gas', 'Gás')}</span>}
            {edificio.riesgo_electrico && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(234,179,8,0.18)', color: '#FDE68A', border: '1px solid rgba(234,179,8,0.45)' }}>⚡ {t('Eléctrico', 'Electrical', 'Elétrico')}</span>}
            {edificio.riesgo_incendio  && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(220,38,38,0.18)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.45)' }}>🔥 {t('Incendio', 'Fire', 'Incêndio')}</span>}
            {edificio.riesgo_colapso   && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(107,114,128,0.18)', color: '#D1D5DB', border: '1px solid rgba(107,114,128,0.45)' }}>💥 {t('Colapso', 'Collapse', 'Colapso')}</span>}
          </div>
        )}

        {/* Resumen contadores personas */}
        {(reportesAtrapados.length > 0 || reportesHeridos.length > 0 || reportesFallecidos.length > 0) && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
            <div className="text-center p-2 rounded-xl" style={{
              background: reportesAtrapados.length > 0 ? '#FEF2F2' : '#F9FAFB',
              border: `1px solid ${reportesAtrapados.length > 0 ? '#FECACA' : '#E5E7EB'}`,
            }}>
              <p className="text-base font-black" style={{ color: reportesAtrapados.length > 0 ? '#B91C1C' : '#6B7280' }}>{reportesAtrapados.length}</p>
              <p className="text-[9px] leading-tight" style={{ color: reportesAtrapados.length > 0 ? '#DC2626' : '#9CA3AF' }}>{t('Atrapados', 'Trapped', 'Presos')}</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{
              background: reportesHeridos.length > 0 ? '#FFFBEB' : '#F9FAFB',
              border: `1px solid ${reportesHeridos.length > 0 ? '#FCD34D' : '#E5E7EB'}`,
            }}>
              <p className="text-base font-black" style={{ color: reportesHeridos.length > 0 ? '#B45309' : '#6B7280' }}>{reportesHeridos.length}</p>
              <p className="text-[9px] leading-tight" style={{ color: reportesHeridos.length > 0 ? '#D97706' : '#9CA3AF' }}>{t('Heridos recup.', 'Injured recov.', 'Feridos recup.')}</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <p className="text-base font-black" style={{ color: '#374151' }}>{reportesFallecidos.length}</p>
              <p className="text-[9px] leading-tight" style={{ color: '#6B7280' }}>{t('Fallecidos recup.', 'Deceased recov.', 'Falecidos recup.')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}