import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Download, Map as MapIcon, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminReportesFiltros from './AdminReportesFiltros';
import AdminReporteRow from './AdminReporteRow';

const LOTE = 50;

export default function AdminReportes({ es = true }) {
  const [reportes, setReportes] = useState([]);
  const [voluntarios, setVoluntarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [limite, setLimite] = useState(LOTE);
  const [filtros, setFiltros] = useState({
    estado_verificacion: 'todos', prioridad: 'todas', nivel_dano: 'todos',
    ciudad: '', solo_urgentes: false, solo_incompletos: false, desde: '', hasta: '',
  });

  useEffect(() => {
    base44.entities.PerfilProfesional.filter({ estado_aprobacion: 'aprobado' }).then(setVoluntarios).catch(() => {});
  }, []);

  const cargar = () => {
    setCargando(true);
    base44.entities.ReportesDano.list('-created_date', limite)
      .then(setReportes)
      .catch(() => setReportes([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [limite]);

  const filtrados = useMemo(() => {
    return reportes.filter(r => {
      if (filtros.estado_verificacion !== 'todos' && (r.estado_verificacion || 'recibido') !== filtros.estado_verificacion) return false;
      if (filtros.prioridad !== 'todas' && (r.prioridad || 'normal') !== filtros.prioridad) return false;
      if (filtros.nivel_dano !== 'todos' && (r.nivel_dano || 'no_evaluado') !== filtros.nivel_dano) return false;
      if (filtros.ciudad.trim() && !`${r.ciudad || ''} ${r.estado_region || ''}`.toLowerCase().includes(filtros.ciudad.trim().toLowerCase())) return false;
      if (filtros.solo_urgentes) {
        const urgente = r.prioridad === 'critica' || ['si', 'posible', 'voces'].includes(r.personas_atrapadas);
        if (!urgente) return false;
      }
      if (filtros.solo_incompletos) {
        const incompleto = (r.nivel_dano || 'no_evaluado') === 'no_evaluado' || !r.direccion;
        if (!incompleto) return false;
      }
      if (filtros.desde && new Date(r.created_date) < new Date(filtros.desde)) return false;
      if (filtros.hasta && new Date(r.created_date) > new Date(filtros.hasta + 'T23:59:59')) return false;
      return true;
    });
  }, [reportes, filtros]);

  const ejecutar = async (id, accion, data) => {
    try {
      const res = await base44.functions.invoke('gestionarReporte', { reporte_id: id, accion, data });
      const actualizado = res?.data?.reporte;
      if (actualizado) setReportes(prev => prev.map(r => r.id === id ? { ...r, ...actualizado } : r));
    } catch {}
  };

  const cambiarEstado = (id, estado_verificacion) => ejecutar(id, 'cambiar_estado', { estado_verificacion });
  const asignarVoluntario = (id, voluntario_asignado_id, voluntario_asignado_nombre) => ejecutar(id, 'asignar_voluntario', { voluntario_asignado_id, voluntario_asignado_nombre });
  const cerrarReporte = (id) => ejecutar(id, 'cerrar');
  const togglePrivado = (id, es_privado) => ejecutar(id, 'marcar_privado', { es_privado });

  const exportarCsv = () => {
    const campos = ['codigo_reporte', 'nombre_lugar', 'ciudad', 'estado_region', 'tipo_estructura', 'nivel_dano', 'prioridad', 'estado_verificacion', 'voluntario_asignado_nombre', 'created_date'];
    const filas = [campos.join(',')].concat(
      filtrados.map(r => campos.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))
    );
    const blob = new Blob([filas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reportes_cris.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-xs text-gray-500">{filtrados.length} {es ? 'reportes visibles' : 'visible reports'}</p>
        <div className="flex gap-2">
          <button onClick={cargar} disabled={cargando} className="text-xs font-bold px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 flex items-center gap-1">
            <RefreshCw size={12} className={cargando ? 'animate-spin' : ''} /> {es ? 'Recargar' : 'Reload'}
          </button>
          <Link to="/mapa-danos" className="text-xs font-bold px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 flex items-center gap-1 no-underline">
            <MapIcon size={12} /> {es ? 'Ver mapa' : 'View map'}
          </Link>
          <button onClick={exportarCsv} disabled={!filtrados.length} className="text-xs font-bold px-3 py-2 rounded-lg bg-gray-900 text-white flex items-center gap-1 disabled:opacity-40">
            <Download size={12} /> {es ? 'Exportar CSV' : 'Export CSV'}
          </button>
        </div>
      </div>

      <AdminReportesFiltros filtros={filtros} setFiltros={setFiltros} es={es} />

      {cargando ? (
        <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-gray-300 mx-auto" /></div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(r => (
            <AdminReporteRow key={r.id} reporte={r} voluntarios={voluntarios} es={es}
              onCambiarEstado={cambiarEstado} onAsignarVoluntario={asignarVoluntario}
              onCerrar={cerrarReporte} onTogglePrivado={togglePrivado} />
          ))}
          {filtrados.length === 0 && (
            <div className="text-center py-10 text-sm text-gray-400">{es ? 'No hay reportes con estos filtros.' : 'No reports match these filters.'}</div>
          )}
        </div>
      )}

      {reportes.length >= limite && (
        <button onClick={() => setLimite(l => l + LOTE)} className="w-full mt-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 bg-white">
          {es ? 'Ver más resultados' : 'Load more results'}
        </button>
      )}
    </div>
  );
}