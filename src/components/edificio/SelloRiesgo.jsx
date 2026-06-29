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

// Respaldo: nivel_dano → sello, cuando el triaje aún no lo clasificó por riesgo
const NIVEL_A_SELLO = {
  leve: 'solo_estetico',
  moderado: 'riesgo_moderado',
  grave: 'riesgo_colapso',
  critico: 'riesgo_colapso',
  colapsado: 'riesgo_colapso',
};

export function selloKey(riesgo, nivelDano) {
  if (riesgo && SELLOS[riesgo]) return riesgo;
  if (nivelDano && NIVEL_A_SELLO[nivelDano]) return NIVEL_A_SELLO[nivelDano];
  return null;
}

export default function SelloRiesgo({ riesgo, nivelDano, size = 72, es = true, mostrarTexto = false }) {
  const key = selloKey(riesgo, nivelDano);
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