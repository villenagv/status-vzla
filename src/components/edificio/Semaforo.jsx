import { DANO_CONFIG } from './edificioDetalleConfig';

export default function Semaforo({ nivel, es, personas_atrapadas }) {
  const cfg = DANO_CONFIG[nivel] || DANO_CONFIG.no_evaluado;
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(nivel);
  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: cfg.border }}>
      <div className="flex items-center gap-4 p-4" style={{ background: cfg.bg }}>
        <span className="text-5xl flex-shrink-0">{cfg.semaforo}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>
            {es ? 'Estado del edificio' : 'Building status'}
          </p>
          <p className="text-xl font-black leading-tight" style={{ color: cfg.color }}>{es ? cfg.label.es : cfg.label.en}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.color }}>
            🚪 {es ? cfg.acceso.es : cfg.acceso.en}
          </p>
        </div>
        {noEntrar && (
          <div className="flex-shrink-0 bg-red-600 text-white text-xs font-black px-3 py-2 rounded-xl text-center leading-tight">
            🚫<br />{es ? 'NO\nENTRAR' : 'DO NOT\nENTER'}
          </div>
        )}
      </div>
      {/* Barra de personas atrapadas si aplica */}
      {(personas_atrapadas === 'si' || personas_atrapadas === 'voces') && (
        <div className="bg-red-600 px-4 py-2 flex items-center gap-2">
          <span className="text-white text-xs font-black">
            🆘 {personas_atrapadas === 'si' ? (es ? '¡PERSONAS ATRAPADAS CONFIRMADO!' : 'TRAPPED PEOPLE CONFIRMED!') : (es ? 'SE ESCUCHAN VOCES / GOLPES' : 'VOICES / KNOCKING HEARD')}
          </span>
        </div>
      )}
    </div>
  );
}