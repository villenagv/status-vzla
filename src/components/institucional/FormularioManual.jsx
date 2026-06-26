import { useState } from 'react';
import { Plus } from 'lucide-react';

const CONDICIONES = [
  { val: 'a_salvo', es: 'A salvo', en: 'Safe' },
  { val: 'herido_leve', es: 'Herido leve', en: 'Minor injury' },
  { val: 'herido_grave', es: 'Herido grave', en: 'Serious injury' },
  { val: 'fallecido_reportado', es: 'Fallecido reportado', en: 'Death reported' },
  { val: 'no_identificado', es: 'No identificado', en: 'Unidentified' },
  { val: 'no_sabe', es: 'No sé / No disponible', en: 'Unknown / N/A' },
];

const EMPTY = { nombre_completo: '', fecha_nacimiento: '', telefono_contacto: '', condicion: 'a_salvo', sera_trasladado: 'no_sabe', destino_traslado: '', telefono_destino: '', observaciones: '' };

export default function FormularioManual({ es, onAgregar }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const agregar = () => {
    if (!form.nombre_completo.trim()) return;
    onAgregar({ ...form });
    setForm(EMPTY);
  };

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-[#1A1F2E]">
        ➕ {es ? 'Agregar persona manualmente' : 'Add person manually'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Nombre completo' : 'Full name'} *</label>
          <input
            value={form.nombre_completo}
            onChange={e => set('nombre_completo', e.target.value)}
            placeholder={es ? 'Ej: María González' : 'E.g: María González'}
            className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Fecha de nacimiento' : 'Date of birth'}</label>
          <input
            value={form.fecha_nacimiento}
            onChange={e => set('fecha_nacimiento', e.target.value)}
            placeholder="DD/MM/AAAA"
            className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Teléfono de contacto' : 'Contact phone'}</label>
          <input
            value={form.telefono_contacto}
            onChange={e => set('telefono_contacto', e.target.value)}
            placeholder="+58..."
            className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Condición' : 'Condition'}</label>
          <select
            value={form.condicion}
            onChange={e => set('condicion', e.target.value)}
            className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]"
          >
            {CONDICIONES.map(c => <option key={c.val} value={c.val}>{es ? c.es : c.en}</option>)}
          </select>
        </div>
      </div>
      {/* Traslado */}
      <div className="bg-[#F0F4FD] border border-[#B0C4E8] rounded-xl p-3 space-y-2">
        <label className="block text-xs font-semibold text-[#1A1F2E]">
          🚑 {es ? '¿Será trasladado/a a hospital o centro?' : 'Will be transferred to hospital or center?'}
        </label>
        <div className="flex gap-2">
          {[
            { val: 'si', es: 'Sí', en: 'Yes' },
            { val: 'no', es: 'No', en: 'No' },
            { val: 'no_sabe', es: 'No sé', en: 'Unknown' },
          ].map(o => (
            <button key={o.val} type="button" onClick={() => set('sera_trasladado', o.val)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${form.sera_trasladado === o.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>
              {es ? o.es : o.en}
            </button>
          ))}
        </div>
        {form.sera_trasladado === 'si' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div>
              <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Destino (hospital o centro)' : 'Destination (hospital or center)'}</label>
              <input value={form.destino_traslado} onChange={e => set('destino_traslado', e.target.value)}
                placeholder={es ? 'Ej: Hospital Vargas' : 'E.g: Hospital Vargas'}
                className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1A1F2E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Teléfono del destino' : 'Destination phone'}</label>
              <input value={form.telefono_destino} onChange={e => set('telefono_destino', e.target.value)}
                placeholder="+58..."
                className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1A1F2E]" />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1A1F2E] mb-1">{es ? 'Observaciones' : 'Notes'}</label>
        <input
          value={form.observaciones}
          onChange={e => set('observaciones', e.target.value)}
          placeholder={es ? 'Cualquier dato adicional...' : 'Any additional info...'}
          className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A1F2E]"
        />
      </div>
      <button
        onClick={agregar}
        disabled={!form.nombre_completo.trim()}
        className="flex items-center gap-2 bg-[#1A1F2E] disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2d3549] transition-colors"
      >
        <Plus size={15} /> {es ? 'Agregar a la lista' : 'Add to list'}
      </button>
    </div>
  );
}