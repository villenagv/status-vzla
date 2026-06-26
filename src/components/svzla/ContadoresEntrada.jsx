import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

export default function ContadoresEntrada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [reportes, personas, puntos, encontrados] = await Promise.all([
          base44.entities.ReportesDano.list(),
          base44.entities.PersonasBuscadas.filter({ estado_caso: 'buscando' }),
          base44.entities.PuntosAyuda.filter({ estado_operativo: 'abierto' }),
          base44.entities.PersonasEncontradas.list(),
        ]);
        const criticos = reportes.filter(r => r.prioridad === 'critica').length;
        const conAtrapados = reportes.filter(r => r.personas_atrapadas === 'si' || r.personas_atrapadas === 'voces').length;
        setDatos({
          edificios: reportes.length,
          criticos,
          atrapados: conAtrapados,
          buscados: personas.length,
          encontrados: encontrados.length,
          puntos: puntos.length,
        });
      } catch {}
    };
    cargar();
  }, []);

  if (!datos) return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );

  const items = [
    {
      val: datos.edificios,
      icon: '🏗️',
      label: { es: 'Edificios reportados', en: 'Buildings reported' },
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      val: datos.criticos,
      icon: '🚨',
      label: { es: 'Alertas críticas', en: 'Critical alerts' },
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-100',
      pulse: datos.criticos > 0,
    },
    {
      val: datos.atrapados,
      icon: '🆘',
      label: { es: 'Personas atrapadas', en: 'Trapped people' },
      color: 'text-red-800',
      bg: 'bg-red-50',
      border: 'border-red-200',
      pulse: datos.atrapados > 0,
    },
    {
      val: datos.buscados,
      icon: '🔍',
      label: { es: 'Búsquedas activas', en: 'Active searches' },
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      val: datos.encontrados,
      icon: '✅',
      label: { es: 'Personas encontradas', en: 'People found' },
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      val: datos.puntos,
      icon: '🏥',
      label: { es: 'Puntos de ayuda', en: 'Help points' },
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
      {items.map((item, i) => (
        <div key={i} className={`${item.bg} border ${item.border} rounded-xl p-3 text-center flex flex-col items-center gap-1`}>
          <div className="flex items-center gap-1">
            <span className="text-base">{item.icon}</span>
            {item.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <span className={`text-xl font-bold ${item.color}`}>{item.val}</span>
          <span className="text-[10px] text-gray-500 leading-tight text-center">
            {es ? item.label.es : item.label.en}
          </span>
        </div>
      ))}
    </div>
  );
}