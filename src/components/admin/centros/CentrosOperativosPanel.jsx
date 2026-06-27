import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import StatMini from './StatMini';
import CentroAdminCard from './CentroAdminCard';

const norm = v => (v || '').toString().toLowerCase().trim();
const includesAny = (text, values) => values.some(v => norm(v) && norm(text).includes(norm(v)));

export default function CentrosOperativosPanel() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [data, setData] = useState({ centros: [], registradas: [], encontradas: [], danos: [], infra: [], actualizaciones: [], operativos: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const cargar = async () => {
    setLoading(true);
    const [centros, registradas, encontradas, danos, infra, actualizaciones, operativos] = await Promise.all([
      base44.entities.PuntosAyuda.list('-updated_date', 300),
      base44.entities.PersonaRegistrada.list('-created_date', 600),
      base44.entities.PersonasEncontradas.list('-created_date', 600),
      base44.entities.ReportesDano.list('-created_date', 300),
      base44.entities.InfraestructuraSos.list('-created_date', 300).catch(() => []),
      base44.entities.ActualizacionesSitios.list('-created_date', 300),
      base44.entities.EstadoOperativoEdificio.list('-updated_date', 300).catch(() => []),
    ]);
    setData({ centros, registradas, encontradas, danos, infra, actualizaciones, operativos });
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const detalleCentro = (c) => {
    const claves = [c.nombre_lugar, c.direccion, c.ciudad].filter(Boolean);
    const registradas = data.registradas.filter(p => p.institucion_id === c.id || norm(p.institucion_nombre) === norm(c.nombre_lugar));
    const encontradas = data.encontradas.filter(p => norm(p.nombre_lugar) === norm(c.nombre_lugar) || includesAny(p.ubicacion_actual, claves));
    const danos = data.danos.filter(d => includesAny(`${d.nombre_lugar} ${d.direccion} ${d.referencia}`, claves));
    const infra = data.infra.filter(d => includesAny(`${d.direccion} ${d.referencia} ${d.ciudad}`, claves));
    const actualizaciones = data.actualizaciones.filter(a => a.sitio_id === c.id || includesAny(a.descripcion, claves));
    const operativos = data.operativos.filter(o => o.edificio_id === c.id);
    return {
      personas: [...registradas.map(p => ({ key: `r-${p.id}`, nombre: p.nombre_completo, condicion: p.condicion, origen: p.institucion_nombre || 'Lista institucional' })), ...encontradas.map(p => ({ key: `e-${p.id}`, nombre: p.nombre_o_descripcion, condicion: p.condicion, origen: p.nombre_lugar || 'Reporte encontrado' }))],
      danos: [...danos, ...infra], actualizaciones, operativos,
    };
  };

  const centros = data.centros.filter(c => !query || includesAny(`${c.nombre_lugar} ${c.ciudad} ${c.estado_region} ${c.tipo_lugar}`, [query]));

  const actualizarEstado = async (id, estado) => {
    await base44.entities.PuntosAyuda.update(id, { estado_operativo: estado, requiere_actualizacion: estado === 'requiere_actualizacion' });
    setData(prev => ({ ...prev, centros: prev.centros.map(c => c.id === id ? { ...c, estado_operativo: estado, requiere_actualizacion: estado === 'requiere_actualizacion' } : c) }));
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>;

  return <div className="space-y-5"><div className="bg-white rounded-2xl border border-gray-200 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-gray-900">{es ? 'Centros operativos' : 'Operational centers'}</h2><p className="text-sm text-gray-500">{es ? 'Administra centros, listados institucionales, personas vinculadas y daños.' : 'Manage centers, institutional lists, linked people and damage.'}</p></div><button onClick={cargar} className="text-xs font-bold text-gray-500 flex items-center gap-1"><RefreshCw size={13} />{es ? 'Actualizar' : 'Refresh'}</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><StatMini label={es ? 'Centros' : 'Centers'} value={data.centros.length} /><StatMini label={es ? 'Personas en listas' : 'People in lists'} value={data.registradas.length} tone="green" /><StatMini label={es ? 'Daños' : 'Damage'} value={data.danos.length + data.infra.length} tone="red" /><StatMini label={es ? 'Saturados' : 'Saturated'} value={data.centros.filter(c => c.estado_operativo === 'saturado').length} tone="amber" /></div><div className="mt-4 flex gap-2"><input value={query} onChange={e => setQuery(e.target.value)} placeholder={es ? 'Buscar centro, ciudad o tipo...' : 'Search center, city or type...'} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" /><Link to="/registro-institucional" className="bg-[#1A1F2E] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center">{es ? 'Subir listado' : 'Upload list'}</Link></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{centros.map(c => <CentroAdminCard key={c.id} centro={c} detalle={detalleCentro(c)} es={es} onEstado={actualizarEstado} />)}</div>{centros.length === 0 && <p className="text-center text-sm text-gray-400 py-8">{es ? 'No hay centros con ese filtro.' : 'No centers match this filter.'}</p>}</div>;
}