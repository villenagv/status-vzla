import { useState } from 'react';
import { Trash2, Edit3, Check, X } from 'lucide-react';

const CONDICION_LABEL = {
  a_salvo: { es: 'A salvo', en: 'Safe', color: 'bg-green-100 text-green-800' },
  herido_leve: { es: 'Herido leve', en: 'Minor injury', color: 'bg-yellow-100 text-yellow-800' },
  herido_grave: { es: 'Herido grave', en: 'Serious injury', color: 'bg-orange-100 text-orange-800' },
  fallecido_reportado: { es: 'Fallecido rep.', en: 'Death reported', color: 'bg-gray-200 text-gray-700' },
  no_identificado: { es: 'No identificado', en: 'Unidentified', color: 'bg-purple-100 text-purple-700' },
  no_sabe: { es: 'No sabe', en: 'Unknown', color: 'bg-gray-100 text-gray-500' },
};

const CONDICIONES = Object.keys(CONDICION_LABEL);

function FilaEditable({ persona, idx, es, onChange, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [local, setLocal] = useState({ ...persona });

  const guardar = () => { onChange(idx, local); setEditando(false); };
  const cancelar = () => { setLocal({ ...persona }); setEditando(false); };
  const cond = CONDICION_LABEL[persona.condicion] || CONDICION_LABEL.no_sabe;

  if (editando) return (
    <tr className="bg-blue-50">
      <td className="px-2 py-2 text-xs text-gray-400">{idx + 1}</td>
      <td className="px-2 py-2"><input value={local.nombre_completo} onChange={e => setLocal(p => ({ ...p, nombre_completo: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></td>
      <td className="px-2 py-2"><input value={local.fecha_nacimiento || ''} onChange={e => setLocal(p => ({ ...p, fecha_nacimiento: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" placeholder="DD/MM/AAAA" /></td>
      <td className="px-2 py-2"><input value={local.telefono_contacto || ''} onChange={e => setLocal(p => ({ ...p, telefono_contacto: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></td>
      <td className="px-2 py-2">
        <select value={local.condicion} onChange={e => setLocal(p => ({ ...p, condicion: e.target.value }))} className="border rounded px-1 py-1 text-xs">
          {CONDICIONES.map(c => <option key={c} value={c}>{es ? CONDICION_LABEL[c].es : CONDICION_LABEL[c].en}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <select value={local.sera_trasladado || 'no_sabe'} onChange={e => setLocal(p => ({ ...p, sera_trasladado: e.target.value }))} className="border rounded px-1 py-1 text-xs w-full">
          <option value="si">{es ? 'Sí' : 'Yes'}</option>
          <option value="no">No</option>
          <option value="no_sabe">{es ? 'No sé' : 'Unknown'}</option>
        </select>
        {local.sera_trasladado === 'si' && (
          <input value={local.destino_traslado || ''} onChange={e => setLocal(p => ({ ...p, destino_traslado: e.target.value }))} placeholder={es ? 'Destino...' : 'Destination...'} className="w-full border rounded px-2 py-1 text-xs mt-1" />
        )}
        {local.sera_trasladado === 'si' && (
          <input value={local.telefono_destino || ''} onChange={e => setLocal(p => ({ ...p, telefono_destino: e.target.value }))} placeholder={es ? 'Tel. destino...' : 'Dest. phone...'} className="w-full border rounded px-2 py-1 text-xs mt-1" />
        )}
      </td>
      <td className="px-2 py-2"><input value={local.observaciones || ''} onChange={e => setLocal(p => ({ ...p, observaciones: e.target.value }))} className="w-full border rounded px-2 py-1 text-xs" /></td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <button onClick={guardar} className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200"><Check size={12} /></button>
          <button onClick={cancelar} className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={12} /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-2 py-2 text-xs text-gray-400">{idx + 1}</td>
      <td className="px-2 py-2 text-xs font-semibold text-[#1A1F2E]">{persona.nombre_completo || '—'}</td>
      <td className="px-2 py-2 text-xs text-gray-600">{persona.fecha_nacimiento || '—'}</td>
      <td className="px-2 py-2 text-xs text-gray-600">{persona.telefono_contacto || '—'}</td>
      <td className="px-2 py-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cond.color}`}>
          {es ? cond.es : cond.en}
        </span>
      </td>
      <td className="px-2 py-2 text-xs">
        {persona.sera_trasladado === 'si'
          ? <span className="text-blue-700 font-semibold">🚑 {persona.destino_traslado || (es ? 'Sí — sin destino' : 'Yes — no dest.')}{persona.telefono_destino ? ` · ${persona.telefono_destino}` : ''}</span>
          : persona.sera_trasladado === 'no'
            ? <span className="text-gray-400">{es ? 'No' : 'No'}</span>
            : <span className="text-gray-400">{es ? 'No sabe' : 'Unknown'}</span>}
      </td>
      <td className="px-2 py-2 text-xs text-gray-500 max-w-[100px] truncate">{persona.observaciones || '—'}</td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <button onClick={() => setEditando(true)} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"><Edit3 size={12} /></button>
          <button onClick={() => onDelete(idx)} className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function TablaPersonas({ personas, es, onChange, onDelete }) {
  if (!personas || personas.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#EDEBE8]">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-[#1A1F2E] text-white text-[11px] uppercase tracking-wide">
          <tr>
            <th className="px-2 py-2 w-8">#</th>
            <th className="px-2 py-2">{es ? 'Nombre' : 'Name'}</th>
            <th className="px-2 py-2">{es ? 'F. Nacimiento' : 'Birth Date'}</th>
            <th className="px-2 py-2">{es ? 'Teléfono' : 'Phone'}</th>
            <th className="px-2 py-2">{es ? 'Condición' : 'Condition'}</th>
            <th className="px-2 py-2">{es ? 'Traslado' : 'Transfer'}</th>
            <th className="px-2 py-2">{es ? 'Observaciones' : 'Notes'}</th>
            <th className="px-2 py-2">{es ? 'Acciones' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {personas.map((p, i) => (
            <FilaEditable key={i} persona={p} idx={i} es={es} onChange={onChange} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}