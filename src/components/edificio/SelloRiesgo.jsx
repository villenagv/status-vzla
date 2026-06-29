import ImagenProxy from '@/components/svzla/ImagenProxy';

/**
 * SelloRiesgo
 * Insignia visual oficial que se muestra en la ficha de un edificio una vez
 * que un especialista lo clasifica en el triaje. Mapea el campo `triage_riesgo`
 * (o `nivel_dano` como respaldo) a uno de los tres sellos aprobados.
 *
 * Props:
 *  - riesgo: 'riesgo_colapso' | 'riesgo_moderado' | 'solo_estetico' (triage_riesgo)
 *  - nivelDano: respaldo cuando no hay triage_riesgo ('leve'|'moderado'|'grave'|'critico'|'colapsado')
 *  - size: px del sello (default 72)
 *  - es: idioma
 *  - mostrarTexto: muestra etiqueta debajo del sello (default false)
 */

export const SELLOS = {
  solo_estetico: {
    url: 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/6aaef027d_leve.png',
    es: 'Daños leves', en: 'Minor damage',
  },
  riesgo_moderado: {
    url: 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/f506fefef_moderado.png',
    es: 'Daños moderados', en: 'Moderate damage',
  },
  riesgo_colapso: {
    url: 'https://media.base44.com/images/public/6a3ddf29c9e933d4c38e9646/c6581332b_colapso.png',
    es: 'Severo riesgo de colapso', en: 'Severe collapse risk',
  },
};

// Mapea la severidad confirmada en la inspección presencial → sello
const SEVERIDAD_A_SELLO = {
  leve: 'solo_estetico',
  moderado: 'riesgo_moderado',
  grave: 'riesgo_colapso',
  critico: 'riesgo_colapso',
};

/**
 * El sello solo se calcula cuando el edificio fue REALMENTE inspeccionado
 * (triage_estado === 'inspeccionado'). Antes de eso no hay insignia, aunque
 * exista una clasificación de triaje rápido o un nivel de daño reportado.
 *
 * @param {object} reporte - el reporte completo de ReportesDano
 */
export function selloKey(reporte) {
  if (!reporte || reporte.triage_estado !== 'inspeccionado') return null;
  // 1º preferimos la severidad confirmada en la inspección presencial
  const sev = reporte.inspeccion_severidad;
  if (sev && SEVERIDAD_A_SELLO[sev]) return SEVERIDAD_A_SELLO[sev];
  // 2º si no, el riesgo del triaje rápido
  if (reporte.triage_riesgo && SELLOS[reporte.triage_riesgo]) return reporte.triage_riesgo;
  return null;
}

export default function SelloRiesgo({ reporte, size = 72, es = true, mostrarTexto = false }) {
  const key = selloKey(reporte);
  if (!key) return null;
  const sello = SELLOS[key];

  return (
    <div className="flex flex-col items-center gap-1" title={es ? sello.es : sello.en}>
      <ImagenProxy
        src={sello.url}
        alt={es ? sello.es : sello.en}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
      {mostrarTexto && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-center" style={{ maxWidth: size + 30 }}>
          {es ? sello.es : sello.en}
        </span>
      )}
    </div>
  );
}