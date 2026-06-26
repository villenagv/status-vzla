import { AlertTriangle, User, CheckCircle, Plus } from 'lucide-react';

/**
 * Modal para resolver posibles duplicados de personas.
 * Props:
 *  - persona: { nombre_completo, condicion, fecha_nacimiento, ... } — fila nueva
 *  - coincidencias: array de PersonaCRIS o PersonaRegistrada ya existentes
 *  - es: boolean
 *  - onDecision: fn({ accion: 'mismo'|'nuevo'|'ignorar', coincidenciaId? })
 */
export default function DialogoDuplicado({ persona, coincidencias, es, onDecision }) {
  if (!persona) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={17} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1F2E]">
              {es ? '¿Es la misma persona?' : 'Is this the same person?'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              {es
                ? `"${persona.nombre_completo}" ya aparece en el sistema. Indica si es la misma persona o si es un registro nuevo.`
                : `"${persona.nombre_completo}" already exists in the system. Indicate if it's the same person or a new record.`}
            </p>
          </div>
        </div>

        {/* Persona nueva */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
            {es ? 'Nuevo registro (del archivo)' : 'New record (from file)'}
          </p>
          <p className="text-xs font-semibold text-[#1A1F2E]">{persona.nombre_completo}</p>
          {persona.fecha_nacimiento && (
            <p className="text-[11px] text-gray-500">{es ? 'Nac:' : 'DOB:'} {persona.fecha_nacimiento}</p>
          )}
          {persona.condicion && (
            <p className="text-[11px] text-gray-500">{es ? 'Condición:' : 'Condition:'} {persona.condicion}</p>
          )}
        </div>

        {/* Coincidencias existentes */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
            {es ? `${coincidencias.length} posible${coincidencias.length > 1 ? 's' : ''} coincidencia${coincidencias.length > 1 ? 's' : ''} en el sistema:` : `${coincidencias.length} possible match${coincidencias.length > 1 ? 'es' : ''} in the system:`}
          </p>
          {coincidencias.map((c, i) => (
            <div key={c.id || i} className="border border-[#EDEBE8] rounded-xl px-3 py-2.5 space-y-2">
              <div className="flex items-start gap-2">
                <User size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1F2E] truncate">{c.nombre_completo || c.nombre}</p>
                  {(c.ciudad || c.estado_region) && (
                    <p className="text-[11px] text-gray-500">{[c.ciudad, c.estado_region].filter(Boolean).join(', ')}</p>
                  )}
                  {(c.condicion || c.estado_actual) && (
                    <p className="text-[11px] text-gray-500">{es ? 'Estado:' : 'Status:'} {c.condicion || c.estado_actual}</p>
                  )}
                  {(c.institucion_nombre) && (
                    <p className="text-[11px] text-gray-400">{es ? 'Inst:' : 'Inst:'} {c.institucion_nombre}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDecision({ accion: 'mismo', coincidenciaId: c.id })}
                className="w-full flex items-center justify-center gap-1.5 bg-orange-500 text-white font-bold py-2 rounded-lg text-xs"
              >
                <CheckCircle size={12} />
                {es ? 'Sí, es la misma persona — actualizar' : 'Yes, same person — update'}
              </button>
            </div>
          ))}
        </div>

        {/* Acciones globales */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[#EDEBE8]">
          <button
            onClick={() => onDecision({ accion: 'nuevo' })}
            className="w-full flex items-center justify-center gap-1.5 border-2 border-[#1A1F2E] text-[#1A1F2E] font-bold py-2.5 rounded-xl text-sm"
          >
            <Plus size={14} />
            {es ? 'No, crear como persona nueva' : 'No, create as new person'}
          </button>
          <button
            onClick={() => onDecision({ accion: 'ignorar' })}
            className="w-full text-xs text-gray-400 underline py-1 cursor-pointer"
          >
            {es ? 'Omitir este registro' : 'Skip this record'}
          </button>
        </div>
      </div>
    </div>
  );
}