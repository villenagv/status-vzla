import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, Plus, Edit3, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';

const ESTADO_OP_OPTS = [
  { val: 'abierto', es: '✅ Abierto', en: '✅ Open' },
  { val: 'saturado', es: '⚠️ Saturado', en: '⚠️ Saturated' },
  { val: 'cerrado', es: '🔒 Cerrado', en: '🔒 Closed' },
  { val: 'necesita_suministros', es: '📦 Necesita suministros', en: '📦 Needs supplies' },
  { val: 'necesita_voluntarios', es: '🙋 Necesita voluntarios', en: '🙋 Needs volunteers' },
];

export default function PortalInstitucional() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('puntos');
  const [puntos, setPuntos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const mis = await base44.entities.PuntosAyuda.filter({ created_by_id: u.id });
        setPuntos(mis);
      } catch {
        window.location.href = '/login';
      } finally {
        setCargando(false);
      }
    };
    init();
  }, []);

  const actualizarEstado = async (punto, nuevoEstado) => {
    setGuardando(true);
    try {
      const updated = await base44.entities.PuntosAyuda.update(punto.id, {
        estado_operativo: nuevoEstado,
        ultima_actualizacion: new Date().toISOString(),
      });
      setPuntos(prev => prev.map(p => p.id === punto.id ? { ...p, ...updated } : p));
      setMensaje(es ? 'Estado actualizado.' : 'Status updated.');
      setTimeout(() => setMensaje(''), 3000);
    } catch {
      setMensaje(es ? 'Error al guardar.' : 'Error saving.');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarCapacidad = async (punto, personas) => {
    setGuardando(true);
    try {
      const updated = await base44.entities.PuntosAyuda.update(punto.id, {
        personas_actuales: Number(personas),
        ultima_actualizacion: new Date().toISOString(),
      });
      setPuntos(prev => prev.map(p => p.id === punto.id ? { ...p, ...updated } : p));
      setEditando(null);
      setMensaje(es ? 'Datos actualizados.' : 'Data updated.');
      setTimeout(() => setMensaje(''), 3000);
    } catch {
      setMensaje(es ? 'Error al guardar.' : 'Error saving.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            🏥
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1A1F2E] truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{es ? 'Portal Institucional' : 'Institutional Portal'}</p>
          </div>
          <button onClick={() => base44.auth.logout('/')} className="text-gray-400 hover:text-[#B83A52] p-2">
            <LogOut size={18} />
          </button>
        </div>

        {mensaje && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700 mb-3">{mensaje}</div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[#EDEBE8] mb-4 bg-white text-sm">
          {[
            { key: 'puntos', es: '🏥 Mis puntos', en: '🏥 My points' },
            { key: 'nuevo', es: '+ Nuevo punto', en: '+ New point' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 font-medium transition-colors ${tab === t.key ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
            >{es ? t.es : t.en}</button>
          ))}
        </div>

        {/* Mis puntos */}
        {tab === 'puntos' && (
          <div className="space-y-4">
            {puntos.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-3">{es ? 'No tienes puntos registrados.' : 'No points registered yet.'}</p>
                <button onClick={() => setTab('nuevo')} className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                  {es ? 'Registrar primer punto' : 'Register first point'}
                </button>
              </div>
            )}
            {puntos.map(punto => (
              <div key={punto.id} className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1A1F2E]">{punto.nombre_lugar}</p>
                    <p className="text-xs text-gray-500">{punto.tipo_lugar} · {punto.ciudad}, {punto.estado_region}</p>
                  </div>
                </div>

                {/* Estado operativo */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">{es ? 'Estado actual:' : 'Current status:'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ESTADO_OP_OPTS.map(opt => (
                      <button
                        key={opt.val}
                        disabled={guardando}
                        onClick={() => actualizarEstado(punto, opt.val)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium transition-colors ${
                          punto.estado_operativo === opt.val
                            ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]'
                            : 'bg-white border-[#EDEBE8] text-gray-600 hover:border-[#1A1F2E]'
                        }`}
                      >{es ? opt.es : opt.en}</button>
                    ))}
                  </div>
                </div>

                {/* Capacidad */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">
                    {es ? 'Personas actuales:' : 'Current occupancy:'} <span className="text-[#1A1F2E]">{punto.personas_actuales ?? '—'}</span>
                    {punto.capacidad_maxima ? ` / ${punto.capacidad_maxima}` : ''}
                  </p>
                  {editando === punto.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        defaultValue={punto.personas_actuales || ''}
                        id={`cap-${punto.id}`}
                        className="border border-[#EDEBE8] rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-[#1A1F2E]"
                      />
                      <button
                        disabled={guardando}
                        onClick={() => {
                          const val = document.getElementById(`cap-${punto.id}`).value;
                          actualizarCapacidad(punto, val);
                        }}
                        className="bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                      >
                        {es ? 'Guardar' : 'Save'}
                      </button>
                      <button onClick={() => setEditando(null)} className="text-gray-400 px-2 text-sm">{es ? 'Cancelar' : 'Cancel'}</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditando(punto.id)} className="flex items-center gap-1 text-xs text-[#D48C2E] hover:underline">
                      <Edit3 size={12} /> {es ? 'Actualizar número' : 'Update count'}
                    </button>
                  )}
                </div>

                {punto.ultima_actualizacion && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <RefreshCw size={10} /> {es ? 'Última actualización:' : 'Last update:'} {new Date(punto.ultima_actualizacion).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nuevo punto */}
        {tab === 'nuevo' && (
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4">
            <p className="text-sm text-gray-600 mb-3">
              {es ? 'Para registrar un nuevo punto de ayuda, usa el formulario completo:' : 'To register a new help point, use the full form:'}
            </p>
            <Link
              to="/institucional"
              className="block text-center bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              🏥 {es ? 'Ir al formulario de registro' : 'Go to registration form'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}