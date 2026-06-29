import { Loader2, Camera, X } from 'lucide-react';

/**
 * Grupo de fotos para un paso de la guía fotográfica.
 * Muestra instrucciones, miniaturas y un botón de carga.
 * fotos: array de { url, subiendo } · onAgregar(files) · onQuitar(index)
 */
export default function GrupoFotos({ grupo, es, fotos, subiendo, onAgregar, onQuitar, disabled }) {
  const txt = es ? grupo.es : grupo.en;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl flex-shrink-0">{grupo.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">
            {txt.titulo}
            {grupo.obligatorio && <span className="ml-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full align-middle">{es ? 'Obligatoria' : 'Required'}</span>}
          </p>
          <p className="text-xs text-gray-500">{txt.sub}</p>
        </div>
      </div>

      <ul className="space-y-1 mb-3">
        {txt.instrucciones.map((ins, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-gray-700 leading-relaxed">
            <span className="text-blue-500 flex-shrink-0">•</span>
            <span>{ins}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f, i) => (
          <div key={i} className="relative">
            {f.subiendo ? (
              <div className="w-full h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <img src={f.url} alt="" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
            )}
            <button onClick={() => onQuitar(i)} type="button"
              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">
              <X size={11} />
            </button>
          </div>
        ))}
        <label className={`h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 ${disabled ? 'opacity-40' : 'cursor-pointer hover:border-blue-400'}`}>
          {subiendo ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          <span className="text-[10px] mt-1">{es ? 'Agregar' : 'Add'}</span>
          <input type="file" accept="image/*" capture="environment" multiple disabled={disabled}
            onChange={e => { onAgregar(Array.from(e.target.files || [])); e.target.value = ''; }} className="hidden" />
        </label>
      </div>
    </div>
  );
}