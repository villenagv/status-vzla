import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import PersonasCentro from './PersonasCentro';
import DanosCentro from './DanosCentro';

const ESTADOS = ['abierto', 'saturado', 'cerrado', 'recibe_personas', 'recibe_heridos', 'requiere_actualizacion'];

export default function CentroAdminCard({ centro, detalle, es, onEstado }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState('');

  const cambiarEstado = async (estado) => {
    setSaving(estado);
    await onEstado(centro.id, estado);
    setSaving('');
  };

  const riesgo = detalle.danos.some(d => ['grave', 'critico', 'colapsado', 'no_evaluado'].includes(d.nivel_dano));

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-[#1A1F2E] text-sm truncate">{centro.nombre_lugar}</p>
          <p className="text-xs text-gray-400">{centro.tipo_lugar} · {centro.ciudad}, {centro.estado_region}</p>
        </div>
        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full px-2 py-1">{centro.estado_operativo || 'no_verificado'}</span>
      </div>

      {riesgo && <p className="mt-2 text-xs font-black text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">⛔ {es ? 'NO ENTRAR hasta verificación' : 'DO NOT ENTER until verified'}</p>}

      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="bg-gray-50 rounded-xl px-2 py-2 text-center"><p className="font-black text-lg">{detalle.personas.length}</p><p className="text-[10px] text-gray-500">{es ? 'Personas' : 'People'}</p></div>
        <div className="bg-red-50 rounded-xl px-2 py-2 text-center"><p className="font-black text-lg text-red-700">{detalle.danos.length}</p><p className="text-[10px] text-red-600">{es ? 'Daños' : 'Damage'}</p></div>
        <div className="bg-amber-50 rounded-xl px-2 py-2 text-center"><p className="font-black text-lg text-amber-700">{detalle.actualizaciones.length}</p><p className="text-[10px] text-amber-600">{es ? 'Eventos' : 'Events'}</p></div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {ESTADOS.map(e => <button key={e} onClick={() => cambiarEstado(e)} disabled={saving || centro.estado_operativo === e} className={`text-[10px] font-bold px-2 py-1 rounded-full border ${centro.estado_operativo === e ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white text-gray-600 border-[#EDEBE8]'}`}>{saving === e ? <Loader2 size={10} className="animate-spin" /> : e}</button>)}
      </div>

      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between border border-[#EDEBE8] rounded-xl px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50">
        {es ? 'Ver listados, personas y daños' : 'View lists, people and damage'} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && <div className="mt-3 space-y-3"><PersonasCentro personas={detalle.personas} es={es} /><DanosCentro danos={detalle.danos} actualizaciones={detalle.actualizaciones} operativos={detalle.operativos} es={es} /></div>}
    </div>
  );
}