import { useState, useMemo } from 'react';
import TarjetaPanelEspecialista from './TarjetaPanelEspecialista';
import BuscadorLista from './BuscadorLista';
import { EVAL_CONFIG, DANO_TIPO_OPTS } from './evaluacionConfig';

// Panel de Voluntarios y Profesionales (Período 6): permite filtrar reportes
// por prioridad, ubicación, tipo de daño y estatus de evaluación, y actuar
// sobre cada uno (comentar, marcar evaluación, verificar, derivar).
export default function PanelEspecialista({ perfil, es, reportes, onActualizado }) {
  const [fPrioridad, setFPrioridad] = useState('todas');
  const [fCiudad, setFCiudad] = useState('todas');
  const [fDano, setFDano] = useState('todos');
  const [fEstatus, setFEstatus] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(10);

  const ciudades = useMemo(() => [...new Set(reportes.map(r => r.ciudad).filter(Boolean))].sort(), [reportes]);

  const filtrados = useMemo(() => reportes.filter(r => {
    if (fPrioridad !== 'todas' && (r.prioridad || 'normal') !== fPrioridad) return false;
    if (fCiudad !== 'todas' && r.ciudad !== fCiudad) return false;
    if (fDano !== 'todos' && (r.nivel_dano || 'no_evaluado') !== fDano) return false;
    if (fEstatus !== 'todos' && (r.tipo_evaluacion || 'pendiente_asignacion') !== fEstatus) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const match = [r.nombre_lugar, r.direccion, r.ciudad, r.codigo_reporte, r.tipo_estructura]
        .some(v => (v || '').toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  }), [reportes, fPrioridad, fCiudad, fDano, fEstatus, busqueda]);

  const selectCls = "border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white";

  return (
    <div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-purple-800 mb-0.5">🗂️ {es ? 'Panel de voluntarios y profesionales' : 'Volunteers & professionals panel'}</p>
        <p className="text-xs text-purple-700 leading-relaxed">
          {es ? 'Filtra, revisa y clasifica reportes. Diferencia entre evaluación digital y evaluación presencial.'
               : 'Filter, review and classify reports. Distinguish between digital and on-site evaluation.'}
        </p>
      </div>

      <BuscadorLista value={busqueda} onChange={v => { setBusqueda(v); setPagina(10); }} es={es} />

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <select value={fPrioridad} onChange={e => { setFPrioridad(e.target.value); setPagina(10); }} className={selectCls}>
          <option value="todas">{es ? 'Toda prioridad' : 'Any priority'}</option>
          <option value="critica">{es ? 'Crítica' : 'Critical'}</option>
          <option value="alta">{es ? 'Alta' : 'High'}</option>
          <option value="normal">{es ? 'Normal' : 'Normal'}</option>
        </select>
        <select value={fCiudad} onChange={e => { setFCiudad(e.target.value); setPagina(10); }} className={selectCls}>
          <option value="todas">{es ? 'Toda ubicación' : 'Any location'}</option>
          {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fDano} onChange={e => { setFDano(e.target.value); setPagina(10); }} className={selectCls}>
          <option value="todos">{es ? 'Todo tipo de daño' : 'Any damage type'}</option>
          {DANO_TIPO_OPTS.map(o => <option key={o.val} value={o.val}>{es ? o.es : o.en}</option>)}
        </select>
        <select value={fEstatus} onChange={e => { setFEstatus(e.target.value); setPagina(10); }} className={selectCls}>
          <option value="todos">{es ? 'Todo estatus' : 'Any status'}</option>
          {Object.entries(EVAL_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.icon} {es ? cfg.label.es : cfg.label.en}</option>
          ))}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm text-gray-500">{es ? 'No hay reportes con estos filtros.' : 'No reports match these filters.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{filtrados.length} {es ? 'reporte(s)' : 'report(s)'}</p>
          {filtrados.slice(0, pagina).map(r => (
            <TarjetaPanelEspecialista key={r.id} reporte={r} es={es} perfil={perfil} onActualizado={onActualizado} />
          ))}
          {filtrados.length > pagina && (
            <button onClick={() => setPagina(v => v + 10)}
              className="w-full py-3 text-sm text-blue-700 border border-blue-200 bg-white rounded-xl cursor-pointer hover:bg-blue-50">
              {es ? `Ver ${Math.min(10, filtrados.length - pagina)} más →` : `Load ${Math.min(10, filtrados.length - pagina)} more →`}
            </button>
          )}
        </>
      )}
    </div>
  );
}