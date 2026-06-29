import { useState } from 'react';
import { useInspeccionQueue } from '@/lib/useInspeccionQueue';
import InspeccionOfflineForm from './InspeccionOfflineForm';
import CajaSalidaInspecciones from './CajaSalidaInspecciones';

export default function InspeccionCampo({ perfil, es }) {
  const queue = useInspeccionQueue();
  const [vista, setVista] = useState('nueva');

  const guardar = (data, fotos) => {
    queue.agregar(data, fotos);
    setVista('caja');
  };

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-amber-800 mb-0.5">⚠️ {es ? 'No entres a estructuras dañadas' : 'Do not enter damaged structures'}</p>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          {es ? 'Si hay grietas graves, colapso parcial, olor a gas, cables caídos, incendio o personas atrapadas, espera a Protección Civil, Bomberos o rescatistas.'
              : 'If there are major cracks, partial collapse, gas smell, fallen wires, fire, or trapped people, wait for Civil Protection, firefighters, or rescue teams.'}
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-4">
        <button onClick={() => setVista('nueva')}
          className={`flex-1 text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${vista === 'nueva' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300'}`}>
          {es ? '➕ Nueva inspección' : '➕ New inspection'}
        </button>
        <button onClick={() => setVista('caja')}
          className={`flex-1 text-xs font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${vista === 'caja' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300'}`}>
          {es ? `📥 Caja de salida (${queue.pendientes.length})` : `📥 Outbox (${queue.pendientes.length})`}
        </button>
      </div>

      {vista === 'nueva'
        ? <InspeccionOfflineForm es={es} perfil={perfil} onGuardar={guardar} />
        : <CajaSalidaInspecciones es={es} queue={queue} />}
    </div>
  );
}