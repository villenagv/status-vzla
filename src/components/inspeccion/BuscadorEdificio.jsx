import { useState, useEffect, useRef } from 'react';
import { Loader2, Search, MapPin, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Busca reportes de edificio existentes mientras el usuario escribe el nombre.
 * Si encuentra coincidencias, las ofrece para precargar (evita duplicados).
 * onSeleccionar(reporte) → el formulario padre rellena sus campos.
 */
export default function BuscadorEdificio({ es, valor, onCambiarNombre, onSeleccionar, seleccionado }) {
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const timer = useRef(null);

  // Normaliza: minúsculas, sin acentos, sin espacios extra
  const norm = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  useEffect(() => {
    if (seleccionado) return; // ya eligió uno, no seguir buscando
    if (!valor || valor.trim().length < 3) {
      setResultados([]);
      setMostrar(false);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const todos = await base44.entities.ReportesDano.list('-created_date', 300);
        const q = norm(valor);
        // Palabras significativas de la búsqueda (ignora conectores muy cortos)
        const palabras = q.split(' ').filter(p => p.length >= 3);
        const coincidencias = (todos || []).filter(r => {
          const texto = norm(`${r.nombre_lugar || ''} ${r.direccion || ''} ${r.referencia || ''}`);
          if (!texto) return false;
          // 1) coincidencia directa de la frase completa
          if (texto.includes(q)) return true;
          // 2) que cada palabra significativa esté contenida en alguna parte del texto
          return palabras.length > 0 && palabras.every(p => texto.includes(p));
        }).slice(0, 6);
        setResultados(coincidencias);
        setMostrar(coincidencias.length > 0);
      } catch {
        setResultados([]);
      }
      setBuscando(false);
    }, 500);
    return () => clearTimeout(timer.current);
  }, [valor, seleccionado]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={valor}
          onChange={e => { onCambiarNombre(e.target.value); if (seleccionado) onSeleccionar(null); }}
          placeholder={es ? 'Nombre del lugar (ej: Residencias El Ávila)' : 'Place name (e.g. El Ávila Building)'}
          className="w-full bg-white text-black border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {buscando && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>

      {seleccionado && (
        <div className="mt-2 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <CheckCircle2 size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-800 leading-relaxed">
            {es
              ? 'Usaremos la ficha existente. Tus fotos y notas se sumarán a este edificio (sin crear un duplicado).'
              : 'We will use the existing record. Your photos and notes will be added to this building (no duplicate created).'}
          </p>
        </div>
      )}

      {mostrar && !seleccionado && (
        <div className="mt-2 bg-white border border-blue-200 rounded-xl overflow-hidden">
          <p className="text-[11px] font-bold text-blue-800 px-3 py-2 bg-blue-50 border-b border-blue-100">
            {es ? '¿Te refieres a uno de estos? Selecciónalo para no duplicar:' : 'Did you mean one of these? Select to avoid duplicates:'}
          </p>
          {resultados.map(r => (
            <button key={r.id} type="button" onClick={() => { onSeleccionar(r); setMostrar(false); }}
              className="w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-blue-50 cursor-pointer">
              <p className="text-sm font-semibold text-gray-900">{r.nombre_lugar || (es ? 'Sin nombre' : 'No name')}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={11} /> {[r.direccion, r.ciudad].filter(Boolean).join(' · ') || (es ? 'Sin dirección' : 'No address')}
              </p>
            </button>
          ))}
          <button type="button" onClick={() => setMostrar(false)}
            className="w-full text-center px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer">
            {es ? 'Ninguno — es un edificio nuevo' : 'None — it\'s a new building'}
          </button>
        </div>
      )}
    </div>
  );
}