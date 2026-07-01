const ESTADOS = ['todos', 'recibido', 'verificado', 'duplicado', 'falso', 'resuelto'];
const PRIORIDADES = ['todas', 'normal', 'alta', 'critica'];
const DANOS = ['todos', 'no_evaluado', 'leve', 'moderado', 'grave', 'critico', 'colapsado'];

export default function AdminReportesFiltros({ filtros, setFiltros, es }) {
  const set = (k, v) => setFiltros(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
      <select value={filtros.estado_verificacion} onChange={e => set('estado_verificacion', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
        {ESTADOS.map(v => <option key={v} value={v}>{es ? 'Estatus: ' : 'Status: '}{v}</option>)}
      </select>
      <select value={filtros.prioridad} onChange={e => set('prioridad', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
        {PRIORIDADES.map(v => <option key={v} value={v}>{es ? 'Prioridad: ' : 'Priority: '}{v}</option>)}
      </select>
      <select value={filtros.nivel_dano} onChange={e => set('nivel_dano', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
        {DANOS.map(v => <option key={v} value={v}>{es ? 'Daño: ' : 'Damage: '}{v}</option>)}
      </select>
      <input value={filtros.ciudad} onChange={e => set('ciudad', e.target.value)}
        placeholder={es ? 'Ciudad / municipio' : 'City / municipality'}
        className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white" />
      <label className="col-span-2 md:col-span-1 flex items-center gap-2 text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
        <input type="checkbox" checked={filtros.solo_urgentes} onChange={e => set('solo_urgentes', e.target.checked)} />
        🚨 {es ? 'Solo urgentes' : 'Urgent only'}
      </label>
      <label className="col-span-2 md:col-span-1 flex items-center gap-2 text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
        <input type="checkbox" checked={filtros.solo_incompletos} onChange={e => set('solo_incompletos', e.target.checked)} />
        ⚠️ {es ? 'Solo incompletos' : 'Incomplete only'}
      </label>
      <input type="date" value={filtros.desde} onChange={e => set('desde', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white" />
      <input type="date" value={filtros.hasta} onChange={e => set('hasta', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white" />
    </div>
  );
}