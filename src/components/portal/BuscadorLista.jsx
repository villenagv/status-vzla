import { Search, X } from 'lucide-react';

// Buscador de texto reutilizable para listas del portal de voluntarios/especialistas.
export default function BuscadorLista({ value, onChange, es, placeholder }) {
  return (
    <div className="relative mb-3">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || (es ? 'Buscar por nombre, dirección, ciudad, código...' : 'Search by name, address, city, code...')}
        className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer">
          <X size={14} />
        </button>
      )}
    </div>
  );
}