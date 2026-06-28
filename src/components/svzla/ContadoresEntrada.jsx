import { useEffect, useState } from 'react';
import { getContadores } from '@/lib/counters';
import { useLang } from '@/lib/LangContext';

export default function ContadoresEntrada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getContadores().then(d => { if (!cancelled) setDatos(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!datos) return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );

  const t = (e, en, p) => pt ? (p || e) : es ? e : en;

  const items = [
    {
      val: datos.personas_buscando,
      icon: '🔍',
      label: t('Buscando', 'Searching', 'Buscando'),
      hint: t(`+${datos.personas_registradas} hosp.`, `+${datos.personas_registradas} hosp.`),
      color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100',
    },
    {
      val: datos.criticos,
      icon: '🚨',
      label: t('Alertas críticas', 'Critical alerts', 'Alertas críticas'),
      color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', pulse: datos.criticos > 0,
    },
    {
      val: datos.atrapados,
      icon: '🆘',
      label: t('Atrapados', 'Trapped', 'Presos'),
      color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200', pulse: datos.atrapados > 0,
    },
    {
      val: datos.personas_encontradas,
      icon: '✅',
      label: t('Encontradas', 'Found', 'Encontradas'),
      color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-100',
    },
    {
      val: datos.total_edificios,
      icon: '🏗️',
      label: t('Edificios', 'Buildings', 'Edifícios'),
      hint: t(`${datos.graves} graves`, `${datos.graves} severe`),
      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100',
    },
    {
      val: datos.puntos_abiertos,
      icon: '🏥',
      label: t('Puntos abiertos', 'Open centers', 'Pontos abertos'),
      color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {items.map((item, i) => (
        <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-3 text-center flex flex-col items-center gap-0.5`}>
          <div className="flex items-center gap-1">
            <span className="text-base">{item.icon}</span>
            {item.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <span className={`text-xl font-bold ${item.color}`}>{item.val}</span>
          <span className="text-[10px] text-gray-500 leading-tight text-center">{item.label}</span>
          {item.hint && <span className="text-[9px] text-gray-400 leading-tight text-center">{item.hint}</span>}
        </div>
      ))}
    </div>
  );
}