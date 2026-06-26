import { LayoutList, Table2, Grid3x3 } from 'lucide-react';

const VISTAS = [
  { val: 'lista', icon: LayoutList, label: { es: 'Lista compacta', en: 'Compact list' } },
  { val: 'tabla', icon: Table2, label: { es: 'Tabla detalle', en: 'Detail table' } },
  { val: 'grid', icon: Grid3x3, label: { es: 'Grid con fotos', en: 'Photo grid' } },
];

export function VistaToggler({ vista, setVista, es }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {VISTAS.map((v) => {
        const act = vista === v.val;
        return (
          <button key={v.val} onClick={() => setVista(v.val)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
              act ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            title={es ? v.label.es : v.label.en}>
            <v.icon size={13} />
            <span className="hidden sm:inline">{es ? v.label.es : v.label.en}</span>
          </button>
        );
      })}
    </div>
  );
}