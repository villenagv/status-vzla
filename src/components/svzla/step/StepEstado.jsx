import { useState } from 'react';

export default function StepEstado({ form, setVal, es }) {
  const OPCIONES = [
    { val: 'a_salvo',            es: '✅ Estoy bien', en: '✅ I am OK' },
    { val: 'herido_consciente',  es: '🟡 Estoy herido/a, pero consciente', en: '🟡 Injured but conscious' },
    { val: 'herido_atencion',    es: '🔴 Herido/a y necesito atención médica', en: '🔴 Injured, need medical attention' },
    { val: 'atrapado',           es: '🆘 Estoy atrapado/a', en: '🆘 I am trapped' },
    { val: 'no_puedo_caminar',   es: '♿ No puedo caminar', en: '♿ Cannot walk' },
    { val: 'inconsciente',       es: '💤 Estoy inconsciente (alguien reporta por mí)', en: '💤 Unconscious (someone reporting for me)' },
    { val: 'con_ninos',          es: '👶 Estoy con niños', en: '👶 I am with children' },
    { val: 'con_adultos',        es: '👴 Estoy con adultos mayores', en: '👴 I am with elderly people' },
    { val: 'con_discapacidad',   es: '♿ Con persona con discapacidad', en: '♿ With disabled person' },
    { val: 'no_sabe',            es: '❓ No sé / no puedo responder bien', en: '❓ I don\'t know / can\'t answer' },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
      <p className="text-xs text-gray-500 mb-1">{es ? 'Responde solo si tienes la información' : 'Answer only if you have the information'}</p>
      {OPCIONES.map(o => {
        const active = form.estado_fisico === o.val;
        const peligro = ['herido_atencion', 'atrapado', 'inconsciente'].includes(o.val);
        return (
          <button key={o.val} type="button" onClick={() => setVal('estado_fisico', o.val)}
            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border-2 text-left cursor-pointer transition-colors ${
              active ? (peligro ? 'bg-red-600 text-white border-red-600' : 'bg-gray-900 text-white border-gray-900') 
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
            }`}>
            {es ? o.es : o.en}
          </button>
        );
      })}

      {/* Acompañantes si marca "con cuidado" */}
      {form.estado_fisico === 'con_ninos' && (
        <div className="mt-2 grid grid-cols-1 gap-2">
          <div><label className="text-xs font-medium text-gray-600">{es ? '¿Cuántos niños?' : 'How many children?'}</label><input type="text" inputMode="numeric" value={form.ninos_cantidad || ''} onChange={e => setVal('ninos_cantidad', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900 mt-1" placeholder="0" /></div>
        </div>
      )}
    </div>
  );
}