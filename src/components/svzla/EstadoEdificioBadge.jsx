import { useLang } from '@/lib/LangContext';

const DANO_NIVELES = {
  no_evaluado: { order: 0, es: 'Daño por evaluar', en: 'Damage not evaluated', fill: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' },
  leve:        { order: 1, es: 'Daño leve',         en: 'Minor damage',        fill: 'bg-yellow-500',  bg: 'bg-yellow-100', text: 'text-yellow-800' },
  moderado:    { order: 2, es: 'Daño moderado',      en: 'Moderate damage',     fill: 'bg-orange-500',  bg: 'bg-orange-100', text: 'text-orange-700' },
  grave:       { order: 3, es: 'DAÑO GRAVE',         en: 'SEVERE DAMAGE',       fill: 'bg-red-600',     bg: 'bg-red-100',   text: 'text-red-700' },
  critico:     { order: 4, es: 'CRÍTICO',            en: 'CRITICAL',            fill: 'bg-red-800',     bg: 'bg-red-200',   text: 'text-red-800' },
  colapsado:   { order: 5, es: 'COLABSADO',          en: 'COLLAPSED',           fill: 'bg-gray-800',    bg: 'bg-gray-700',  text: 'text-white' },
};

export function nivelDanoOrder(nivel) {
  return DANO_NIVELES[nivel]?.order ?? 0;
}

export function esCritico(nivel) {
  return ['grave', 'critico', 'colapsado'].includes(nivel);
}

export function esNoEvaluado(nivel) {
  return !nivel || nivel === 'no_evaluado';
}

export default function EstadoEdificioBadge({ nivelDano, noEntry, personasAtrapadas, className = '' }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const cfg = DANO_NIVELES[nivelDano] || DANO_NIVELES.no_evaluado;
  const critical = esCritico(nivelDano) || noEntry;

  // Advertencia "NO ENTRAR" para grave/crítico/colapsado/no evaluado
  if (noEntry || critical || esNoEvaluado(nivelDano)) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.bg} ${critical ? 'animate-pulse' : ''} ${className}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.fill}`} />
        <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.text}`}>
          🚫 {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
        </span>
        {personasAtrapadas && <span className="text-[9px] font-bold text-red-700">🆘</span>}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.fill}`} />
      {es ? cfg.es : cfg.en}
    </span>
  );
}