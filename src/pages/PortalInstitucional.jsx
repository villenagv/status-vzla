import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, Edit3, Save, X, Phone, Globe, MapPin, Users, Boxes, AlertTriangle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';

const ESTADOS = [
  { val: 'abierto', es: '✅ Abierto', en: '✅ Open', badge: 'bg-green-100 text-green-800' },
  { val: 'saturado', es: '⚠️ Saturado', en: '⚠️ Saturated', badge: 'bg-orange-100 text-orange-700' },
  { val: 'cerrado', es: '🔒 Cerrado', en: '🔒 Closed', badge: 'bg-gray-200 text-gray-700' },
  { val: 'necesita_suministros', es: '📦 Necesita suministros', en: '📦 Needs supplies', badge: 'bg-blue-100 text-blue-700' },
  { val: 'necesita_voluntarios', es: '🙋 Necesita voluntarios', en: '🙋 Needs volunteers', badge: 'bg-purple-100 text-purple-700' },
];

const SERVICIOS = [
  { val: 'agua', es: 'Agua potable', en: 'Drinking water' },
  { val: 'comida', es: 'Comida', en: 'Food' },
  { val: 'camas', es: 'Camas/dormitorio', en: 'Beds/dormitory' },
  { val: 'medico', es: 'Atención médica', en: 'Medical care' },
  { val: 'electricidad', es: 'Electricidad', en: 'Electricity' },
  { val: 'baños', es: 'Baños', en: 'Bathrooms' },
  { val: 'comunicacion', es: 'Comunicación/WiFi', en: 'Communication/WiFi' },
  { val: 'transporte', es: 'Transporte', en: 'Transportation' },
];

const NECESIDADES = [
  { val: 'agua', es: 'Agua', en: 'Water' },
  { val: 'alimentos', es: 'Alimentos', en: 'Food' },
  { val: 'medicamentos', es: 'Medicamentos', en: 'Medications' },
  { val: 'ropa', es: 'Ropa/frazadas', en: 'Clothing/blankets' },
  { val: 'voluntarios', es: 'Voluntarios', en: 'Volunteers' },
  { val: 'generador', es: 'Generador/combustible', en: 'Generator/fuel' },
  { val: 'colchones', es: 'Colchones', en: 'Mattresses' },
];

function BadgeEstado({ val, es }) {
  const opt = ESTADOS.find(o => o.val === val);
  if (!opt) return null;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badge}`}>{es ? opt.es : opt.en}</span>;
}

function EditarPunto({ punto, es, onSave, onCancel, guardando }) {
  const [form, setForm] = useState({
    estado_operativo: punto.estado_operativo || 'abierto',
    personas_actuales: punto.personas_actuales ?? '',
    capacidad_maxima: punto.capacidad_maxima || '',
    espacio_disponible: punto.espacio_disponible || '',
    servicios_disponibles: punto.servicios_disponibles || [],
    necesidades_urgentes: punto.necesidades_urgentes || [],
    telefono_publico: punto.telefono_publico || '',
    whatsapp: punto.whatsapp || '',
    nota_horario: punto.nota_horario || '',
    opera_24h: punto.opera_24h || false,
  });

  const toggle = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">{es ? 'Estado operativo:' : 'Operational status:'}</p>
        <div className="flex flex-wrap gap-1.5">
          {ESTADOS.map(opt => (
            <button key={opt.val} type="button" onClick={() => setForm(f => ({ ...f, estado_operativo: opt.val }))}
              className={`px-3 py-1.5 rounded-xl text-xs border font-medium transition-colors ${form.estado_operativo === opt.val ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}>
              {es ? opt.es : opt.en}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">{es ? 'Personas actuales' : 'Current occupancy'}</label>
          <input type="number" value={form.personas_actuales} onChange={e => setForm(f => ({ ...f, personas_actuales: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">{es ? 'Capacidad máxima' : 'Max capacity'}</label>
          <input type="number" value={form.capacidad_maxima} onChange={e => setForm(f => ({ ...f, capacidad_maxima: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="100" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">{es ? 'Espacio disponible' : 'Available space'}</label>
        <input type="text" value={form.espacio_disponible} onChange={e => setForm(f => ({ ...f, espacio_disponible: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder={es ? 'Ej: Salón principal' : 'E.g. Main hall'} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">{es ? 'Servicios disponibles:' : 'Available services:'}</p>
        <div className="flex flex-wrap gap-1.5">
          {SERVICIOS.map(s => (
            <button key={s.val} type="button" onClick={() => setForm(f => ({ ...f, servicios_disponibles: toggle(f.servicios_disponibles, s.val) }))}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${form.servicios_disponibles.includes(s.val) ? 'bg-green-700 text-white border-green-700' : 'bg-white border-gray-200 text-gray-600'}`}>
              {es ? s.es : s.en}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">{es ? 'Necesidades urgentes:' : 'Urgent needs:'}</p>
        <div className="flex flex-wrap gap-1.5">
          {NECESIDADES.map(n => (
            <button key={n.val} type="button" onClick={() => setForm(f => ({ ...f, necesidades_urgentes: toggle(f.necesidades_urgentes, n.val) }))}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${form.necesidades_urgentes.includes(n.val) ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-600'}`}>
              {es ? n.es : n.en}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">{es ? 'Teléfono público' : 'Public phone'}</label>
          <input type="tel" value={form.telefono_publico} onChange={e => setForm(f => ({ ...f, telefono_publico: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="+58 412..." />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">WhatsApp</label>
          <input type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder="+58 412..." />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">{es ? 'Nota de horario' : 'Schedule note'}</label>
        <input type="text" value={form.nota_horario} onChange={e => setForm(f => ({ ...f, nota_horario: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-900" placeholder={es ? 'Ej: Lun-Vie 8am-6pm' : 'E.g. Mon-Fri 8am-6pm'} />
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={form.opera_24h} onChange={e => setForm(f => ({ ...f, opera_24h: e.target.checked }))} className="rounded border-gray-300" />
          <span className="text-xs text-gray-600">{es ? 'Opera las 24 horas' : 'Open 24 hours'}</span>
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(form)} disabled={guardando}
          className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {es ? 'Guardar cambios' : 'Save changes'}
        </button>
        <button onClick={onCancel} className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">{es ? 'Cancelar' : 'Cancel'}</button>
      </div>
    </div>
  );
}

export default function PortalInstitucional() {
  const { lang } = useLang();
  const es = lang === 'es';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('puntos');
  const [puntos, setPuntos] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');
  const [historial, setHistorial] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        if (!u) { navigate('/login', { replace: true }); return; }
        setUser(u);
        const mis = await base44.entities.PuntosAyuda.filter({ created_by_id: u.id });
        setPuntos(mis);
      } catch {
        navigate('/login', { replace: true });
      } finally { setCargando(false); }
    };
    init();
  }, [navigate]);

  const showMsg = (m, ok = true) => { setMsg({ text: m, ok }); setTimeout(() => setMsg(''), 3000); };

  const cargarHistorial = async (puntoId) => {
    if (historial[puntoId]) return;
    const acts = await base44.entities.ActualizacionesSitios.filter({ sitio_id: puntoId, tipo_sitio: 'ayuda' });
    setHistorial(prev => ({ ...prev, [puntoId]: acts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)) }));
  };

  const expandir = async (puntoId) => {
    if (expandido === puntoId) {
      setExpandido(null);
    } else {
      setExpandido(puntoId);
      await cargarHistorial(puntoId);
    }
    setEditando(null);
  };

  const guardarCambios = async (punto, form) => {
    setGuardando(true);
    try {
      const estadoAnterior = punto.estado_operativo;
      const updated = await base44.entities.PuntosAyuda.update(punto.id, {
        ...form,
        personas_actuales: form.personas_actuales !== '' ? Number(form.personas_actuales) : null,
        capacidad_maxima: form.capacidad_maxima || null,
        ultima_actualizacion: new Date().toISOString(),
      });
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: punto.id,
        tipo_sitio: 'ayuda',
        tipo_actualizacion: 'actualizacion_manual',
        descripcion: es
          ? `Estado: ${form.estado_operativo}. Ocupación: ${form.personas_actuales || '—'}/${form.capacidad_maxima || '—'}`
          : `Status: ${form.estado_operativo}. Occupancy: ${form.personas_actuales || '—'}/${form.capacidad_maxima || '—'}`,
        estado_anterior: estadoAnterior,
        estado_nuevo: form.estado_operativo,
        reportado_por: user?.full_name || user?.email || 'institución',
        nivel_verificacion: 'institucion',
      });
      setPuntos(prev => prev.map(p => p.id === punto.id ? { ...p, ...updated } : p));
      setHistorial(prev => ({ ...prev, [punto.id]: null }));
      setEditando(null);
      showMsg(es ? '✅ Punto actualizado correctamente.' : '✅ Point updated successfully.');
    } catch {
      showMsg(es ? 'Error al guardar. Intenta de nuevo.' : 'Error saving. Try again.', false);
    }
    setGuardando(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
    </div>
  );
  if (!user) return null;

  const totalPersonas = puntos.reduce((s, p) => s + (p.personas_actuales || 0), 0);
  const conNecesidades = puntos.filter(p => p.necesidades_urgentes?.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Institutional Header */}
      <header className="bg-green-800 text-white px-4 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1"><ChevronLeft size={18} className="opacity-60" /> <span className="text-sm">{es ? 'Inicio' : 'Home'}</span></Link>
        <span className="text-sm font-semibold">🏥 {es ? 'Portal Institucional' : 'Institutional Portal'}</span>
        <button onClick={() => base44.auth.logout('/')} className="flex items-center gap-1 text-sm text-green-200 hover:text-green-100"><LogOut size={15} /> {es ? 'Salir' : 'Logout'}</button>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-5">
        {msg && (
          <div className={`rounded-xl px-4 py-2.5 text-sm mb-3 border ${msg.ok !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* Perfil de institución */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center text-white text-xl flex-shrink-0">🏥</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500">{es ? 'Portal Institucional' : 'Institutional Portal'}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{puntos.length} {es ? 'punto(s) registrado(s)' : 'point(s) registered'}</p>
          </div>
        </div>

        {/* Stats institucionales */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-3 text-center">
            <Users size={18} className="mx-auto text-green-600 mb-1" />
            <p className="text-lg font-black text-green-600">{totalPersonas}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{es ? 'Personas' : 'People'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-3 text-center">
            <Boxes size={18} className="mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-black text-blue-600">{puntos.reduce((s, p) => s + Number(p.capacidad_maxima || 0), 0)}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{es ? 'Capacidad' : 'Capacity'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-3 text-center">
            <AlertTriangle size={18} className="mx-auto text-red-600 mb-1" />
            <p className="text-lg font-black text-red-600">{conNecesidades}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{es ? 'Necesitan' : 'Need help'}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link to="/institucional" className="flex items-center gap-2 justify-center bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl text-sm font-bold no-underline transition-colors">
            + {es ? 'Nuevo punto' : 'New point'}
          </Link>
          <Link to="/portal-institucional?tab=cargar" className="flex items-center gap-2 justify-center border-2 border-green-700 text-green-700 hover:bg-green-50 py-3 rounded-xl text-sm font-bold no-underline transition-colors">
            📋 {es ? 'Cargar lista' : 'Upload list'}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-100 mb-4 bg-white">
          <button onClick={() => setTab('puntos')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'puntos' ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🏥 {es ? 'Mis puntos' : 'My points'}
          </button>
          <button onClick={() => setTab('nuevo')} className={`flex-1 py-3 text-sm font-semibold ${tab === 'nuevo' ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            + {es ? 'Nuevo punto' : 'New point'}
          </button>
        </div>

        {/* Mis puntos */}
        {tab === 'puntos' && (
          <div className="space-y-3">
            {puntos.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-3">{es ? 'No tienes puntos registrados.' : 'No points registered yet.'}</p>
                <Link to="/institucional" className="bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold no-underline">{es ? 'Registrar primer punto' : 'Register first point'}</Link>
              </div>
            )}
            {puntos.map(punto => (
              <div key={punto.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => expandir(punto.id)} className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{punto.nombre_lugar}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={11} /> {punto.tipo_lugar} · {punto.ciudad}, {punto.estado_region}</p>
                      {punto.personas_actuales != null && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Users size={11} /> {punto.personas_actuales}{punto.capacidad_maxima ? `/${punto.capacidad_maxima}` : ''} {es ? 'personas' : 'people'}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <BadgeEstado val={punto.estado_operativo} es={es} />
                      <span className="text-[10px] text-gray-400">{expandido === punto.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {expandido === punto.id && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {editando === punto.id ? (
                      <EditarPunto punto={punto} es={es} guardando={guardando} onSave={(form) => guardarCambios(punto, form)} onCancel={() => setEditando(null)} />
                    ) : (
                      <>
                        <div className="space-y-2">
                          {punto.espacio_disponible && <p className="text-xs text-gray-600">📋 {punto.espacio_disponible}</p>}
                          {punto.servicios_disponibles?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{es ? 'Servicios' : 'Services'}</p>
                              <div className="flex flex-wrap gap-1">
                                {punto.servicios_disponibles.map(s => {
                                  const opt = SERVICIOS.find(o => o.val === s);
                                  return <span key={s} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">{opt ? (es ? opt.es : opt.en) : s}</span>;
                                })}
                              </div>
                            </div>
                          )}
                          {punto.necesidades_urgentes?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1">{es ? 'Necesidades urgentes' : 'Urgent needs'}</p>
                              <div className="flex flex-wrap gap-1">
                                {punto.necesidades_urgentes.map(n => {
                                  const opt = NECESIDADES.find(o => o.val === n);
                                  return <span key={n} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">{opt ? (es ? opt.es : opt.en) : n}</span>;
                                })}
                              </div>
                            </div>
                          )}
                          {(punto.telefono_publico || punto.whatsapp) && (
                            <div className="flex gap-3 mt-2">
                              {punto.telefono_publico && (
                                <a href={`tel:${punto.telefono_publico}`} className="flex items-center gap-1 text-xs text-gray-900 hover:underline"><Phone size={12} /> {punto.telefono_publico}</a>
                              )}
                              {punto.whatsapp && (
                                <a href={`https://wa.me/${punto.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-700 hover:underline">💬 WhatsApp</a>
                              )}
                            </div>
                          )}
                          {punto.nota_horario && <p className="text-xs text-gray-500">🕐 {punto.nota_horario}{punto.opera_24h ? (es ? ' · 24 horas' : ' · 24 hours') : ''}</p>}
                          {punto.ultima_actualizacion && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><RefreshCw size={10} /> {es ? 'Actualizado:' : 'Updated:'} {new Date(punto.ultima_actualizacion).toLocaleString()}</p>
                          )}
                        </div>

                        <button onClick={() => setEditando(punto.id)} className="w-full flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900 font-bold py-3 rounded-xl text-sm hover:bg-gray-900 hover:text-white transition-colors">
                          <Edit3 size={15} /> {es ? 'Actualizar información' : 'Update information'}
                        </button>

                        {historial[punto.id]?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{es ? 'Historial de actualizaciones' : 'Update history'}</p>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {historial[punto.id].map(h => (
                                <div key={h.id} className="text-xs bg-gray-50 rounded-lg px-3 py-2">
                                  <p className="text-gray-700">{h.descripcion}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(h.created_date).toLocaleString()} · {h.reportado_por}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {historial[punto.id]?.length === 0 && <p className="text-xs text-gray-400 text-center py-1">{es ? 'Sin actualizaciones previas.' : 'No previous updates.'}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nuevo punto */}
        {tab === 'nuevo' && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">{es ? 'Registrar nuevo punto de ayuda' : 'Register new help point'}</p>
            <p className="text-xs text-gray-500 mb-4">{es ? 'Completa el formulario con los datos del refugio, hospital, comedor u otro punto de ayuda.' : 'Fill out details of the shelter, hospital, food center or other help point.'}</p>
            <Link to="/institucional" className="block text-center bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors no-underline">
              🏥 {es ? 'Ir al formulario de registro' : 'Go to registration form'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}