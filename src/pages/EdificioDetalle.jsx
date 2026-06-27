import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, AlertTriangle, Share2, Copy, Check, ShieldAlert, Loader2, ThumbsUp, Info, Eye, Camera, X, Bell, Users, BarChart2, Phone, Mail, Instagram } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import GaleriaFotos from '@/components/svzla/GaleriaFotos';
import EstadoOperativo from '@/components/edificio/EstadoOperativo';

// ─── Configs ────────────────────────────────────────────────────────────────
const DANO_CONFIG = {
  leve:       { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', semaforo: '🟡', label: { es: 'Daño leve',     en: 'Minor damage'   }, acceso: { es: 'Entrada con precaución', en: 'Enter with caution'         } },
  moderado:   { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', semaforo: '🟠', label: { es: 'Daño moderado', en: 'Moderate damage' }, acceso: { es: 'Entrada limitada',       en: 'Limited entry'              } },
  grave:      { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', semaforo: '🔴', label: { es: 'Daño grave',    en: 'Severe damage'  }, acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'               } },
  critico:    { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', semaforo: '🔴', label: { es: 'CRÍTICO',       en: 'CRITICAL'       }, acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER — DANGER'      } },
  colapsado:  { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', semaforo: '🔴', label: { es: 'COLAPSADO',     en: 'COLLAPSED'      }, acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER — COLLAPSED'   } },
  no_evaluado:{ color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', semaforo: '⚪', label: { es: 'Sin evaluar',   en: 'Not evaluated'  }, acceso: { es: 'Sin verificar',          en: 'Unverified'                 } },
};

const ACCION_ESTILOS = {
  tengo_actualizacion:   { icon: '🔄', color: '#CA6F1E' },
  confirmo_mismo_estado: { icon: '✅', color: '#2E7D32' },
  informacion_incorrecta:{ icon: '⚠️', color: '#D4621A' },
  reportar_urgencia:     { icon: '🚨', color: '#C0392B' },
  nuevo_nivel_dano:      { icon: '📍', color: '#2471A3' },
  personas_atrapadas:    { icon: '🆘', color: '#C0392B' },
  persona_herida_recuperada: { icon: '🩹', color: '#B45309' },
  persona_fallecida_recuperada: { icon: '⚫', color: '#4B5563' },
  riesgo_marcado:        { icon: '💨', color: '#D4621A' },
  estado_cambiado:       { icon: '📋', color: '#555555' },
  verificado:            { icon: '🏛️', color: '#00838F' },
};
const ACCION_LABELS = {
  tengo_actualizacion:   { es: 'Nueva actualización',        en: 'New update'             },
  confirmo_mismo_estado: { es: 'Estado confirmado',          en: 'Status confirmed'       },
  informacion_incorrecta:{ es: 'Reportado como incorrecto',  en: 'Reported as incorrect'  },
  reportar_urgencia:     { es: 'Urgencia reportada',         en: 'Urgency reported'       },
  nuevo_nivel_dano:      { es: 'Nivel de daño actualizado',  en: 'Damage level updated'   },
  personas_atrapadas:    { es: 'Personas atrapadas',         en: 'Trapped people'         },
  persona_herida_recuperada: { es: 'Persona herida recuperada', en: 'Injured person recovered' },
  persona_fallecida_recuperada: { es: 'Persona fallecida recuperada', en: 'Deceased person recovered' },
  riesgo_marcado:        { es: 'Riesgo marcado',             en: 'Hazard marked'          },
  estado_cambiado:       { es: 'Estado cambiado',            en: 'Status changed'         },
  verificado:            { es: 'Verificado por institución', en: 'Verified by institution'},
};

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d} día${d > 1 ? 's' : ''}` : `${d} day${d > 1 ? 's' : ''} ago`;
  if (h > 0) return es ? `hace ${h} hora${h > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''} ago`;
  return es ? `hace ${m} min` : `${m} min ago`;
}

// ─── Semáforo visual ────────────────────────────────────────────────────────
function Semaforo({ nivel, es }) {
  const cfg = DANO_CONFIG[nivel] || DANO_CONFIG.no_evaluado;
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(nivel);
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border-2" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <span className="text-5xl">{cfg.semaforo}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
          {es ? 'Estado del edificio' : 'Building status'}
        </p>
        <p className="text-lg font-black" style={{ color: cfg.color }}>{es ? cfg.label.es : cfg.label.en}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.color }}>
          🚪 {es ? cfg.acceso.es : cfg.acceso.en}
        </p>
        {noEntrar && (
          <span className="inline-block mt-1 text-xs font-black text-white bg-red-600 px-2 py-0.5 rounded-full">
            🚫 {es ? 'NO ENTRAR' : 'DO NOT ENTER'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function EdificioDetalle() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const { lang } = useLang();
  const es = lang === 'es';

  const [edificio, setEdificio] = useState(null);
  const [actualizaciones, setActualizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorId, setErrorId] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Suscripción
  const [subEmail, setSubEmail] = useState('');
  const [subNombre, setSubNombre] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [suscribiendo, setSuscribiendo] = useState(false);

  // Formulario actualización
  const [editando, setEditando] = useState(false);
  const [updateForm, setUpdateForm] = useState({ tipo: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, desc: '', nombre: '', contacto: '', telefono: '', red_social: '' });
  const [enviando, setEnviando] = useState(false);
  const [updateFotos, setUpdateFotos] = useState([]);

  // UI
  const [expandida, setExpandida] = useState(false);

  // Solicitudes
  const [solicitudes, setSolicitudes] = useState([]);
  const [conozco, setConozco] = useState(null);
  const [respConozco, setRespConozco] = useState({ nombre: '', desc: '' });
  const [enviandoResp, setEnviandoResp] = useState(false);

  useEffect(() => {
    if (!id) { setCargando(false); setErrorId(true); return; }
    base44.entities.ReportesDano.get(id).then(e => {
      if (!e) { setErrorId(true); return; }
      setEdificio(e);
      return Promise.all([
        base44.entities.ActualizacionesSitios.filter({ sitio_id: id }, '-created_date', 30),
        base44.entities.SolicitudesInfoEdificio.filter({ ciudad: e.ciudad, estado_solicitud: 'pendiente' }, '-created_date', 10),
      ]).then(([ups, ss]) => {
        if (ups) setActualizaciones(ups);
        if (ss) setSolicitudes(ss.filter(s => s.nombre_lugar && !s.reporte_encontrado_id));
      });
    }).catch(() => setErrorId(true)).finally(() => setCargando(false));
  }, [id]);

  const suscribirse = async () => {
    if (!subEmail.trim() || !id) return;
    setSuscribiendo(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({
        reporte_id: id, tipo_reporte: 'dano',
        telefono_whatsapp: subEmail.trim(), // almacenamos email aquí
        nombre_suscriptor: subNombre.trim(),
        activo: true,
      });
      setSuscrito(true);
    } catch {}
    setSuscribiendo(false);
  };

  const compartir = () => {
    if (!edificio) return;
    const cfg = DANO_CONFIG[edificio.nivel_dano] || DANO_CONFIG.no_evaluado;
    const peligro = ['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano) ? `🔴 ${es ? '¡NO ENTRAR!' : 'DO NOT ENTER!'} ` : '';
    const texto = `${peligro}🏗️ ${edificio.nombre_lugar || 'Edificio'} — ${cfg.label[es ? 'es' : 'en']} · ${edificio.direccion || ''}, ${edificio.ciudad || ''} ${window.location.href}`;
    if (navigator.share) navigator.share({ title: `StatusVzla · ${edificio.nombre_lugar}`, text: texto });
    else { navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }
  };

  const confirmarIgual = async () => {
    if (!id) return;
    await base44.entities.ActualizacionesSitios.create({ sitio_id: id, tipo_sitio: 'edificio', tipo_accion: 'confirmo_mismo_estado', fuente: 'ciudadano' });
    setActualizaciones(prev => [{ id: Date.now(), tipo_accion: 'confirmo_mismo_estado', created_date: new Date().toISOString() }, ...prev]);
  };

  const subirUpdateFoto = async (file) => {
    const fid = Date.now();
    setUpdateFotos(prev => [...prev, { id: fid, url: null, uploading: true }]);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUpdateFotos(p => p.map(f => f.id === fid ? { ...f, url: file_url, uploading: false } : f));
    } catch { setUpdateFotos(p => p.filter(f => f.id !== fid)); }
  };

  const handleUpdate = async () => {
    if (!id || !edificio || !updateForm.tipo) return;
    setEnviando(true);
    try {
      const nivel = updateForm.nivel || edificio.nivel_dano;
      const atrapados = updateForm.atrapados || edificio.personas_atrapadas || 'no_sabe';
      const prioridad = (nivel === 'critico' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces') ? 'critica' : nivel === 'grave' ? 'alta' : 'normal';
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: id, tipo_sitio: 'edificio', tipo_accion: updateForm.tipo,
        descripcion: updateForm.desc,
        nivel_dano_anterior: edificio.nivel_dano, nivel_dano_nuevo: updateForm.nivel || undefined,
        personas_atrapadas_anterior: edificio.personas_atrapadas, personas_atrapadas_nuevo: updateForm.atrapados || undefined,
        reportante_nombre: updateForm.nombre, reportante_contacto: updateForm.contacto || updateForm.telefono,
        es_sensible: ['persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(updateForm.tipo),
        fuente: 'ciudadano',
      });
      const updateData = {};
      if (updateForm.nivel) updateData.nivel_dano = updateForm.nivel;
      if (updateForm.atrapados) updateData.personas_atrapadas = updateForm.atrapados;
      if (updateForm.gas) updateData.riesgo_gas = true;
      if (updateForm.elect) updateData.riesgo_electrico = true;
      if (updateForm.inc) updateData.riesgo_incendio = true;
      updateData.prioridad = prioridad;
      if (updateForm.desc) updateData.descripcion = updateForm.desc;
      const fotosNuevas = updateFotos.filter(f => f.url).map(f => f.url);
      if (fotosNuevas.length > 0) updateData.foto_urls = [...(edificio.foto_urls || []), ...fotosNuevas].slice(0, 5);
      const updated = await base44.entities.ReportesDano.update(id, updateData);
      setEdificio(updated);
      setActualizaciones(prev => [{ id: Date.now(), tipo_accion: updateForm.tipo, descripcion: updateForm.desc, nivel_dano_anterior: edificio.nivel_dano, nivel_dano_nuevo: updateForm.nivel, created_date: new Date().toISOString() }, ...prev]);
      await base44.functions.invoke('notificarActualizacionEdificio', {
        edificio_id: id,
        tipo_accion: updateForm.tipo,
        nivel_dano: updateForm.nivel || edificio.nivel_dano,
        direccion: edificio.direccion,
        nombre_lugar: edificio.nombre_lugar,
        descripcion: updateForm.desc,
        reportante_nombre: updateForm.nombre || '',
        reportante_telefono: updateForm.telefono || '',
        telefono_contacto: updateForm.contacto || '',
        lang,
      }).catch(() => {});
      setEditando(false);
      setUpdateForm({ tipo: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, desc: '', nombre: '', contacto: '', telefono: '', red_social: '' });
      setUpdateFotos([]);
    } catch { alert(es ? 'Error al enviar.' : 'Error sending.'); }
    setEnviando(false);
  };

  // ─── Loading / Error ─────────────────────────────────────────────────────
  if (cargando) return (
    <div className="min-h-screen bg-white flex flex-col"><TopBar />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-gray-400" size={32} /><p className="text-sm text-gray-400">{es ? 'Cargando ficha...' : 'Loading record...'}</p></div>
      </div>
    </div>
  );

  if (errorId || !edificio) return (
    <div className="min-h-screen bg-white flex flex-col"><TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
        <p className="text-5xl">🏗️</p>
        <p className="font-semibold text-gray-700">{es ? 'Edificio no encontrado.' : 'Building not found.'}</p>
        <Link to="/edificios" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold no-underline text-sm">← {es ? 'Volver al directorio' : 'Back to directory'}</Link>
      </div>
    </div>
  );

  const cfg = DANO_CONFIG[edificio?.nivel_dano] || DANO_CONFIG.no_evaluado;
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(edificio?.nivel_dano);
  const esCritico = noEntrar || edificio?.personas_atrapadas === 'si' || edificio?.prioridad === 'critica';
  const totalReportes = actualizaciones.length + 1;
  const reportesPersonas = actualizaciones.filter(a => ['personas_atrapadas', 'persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(a.tipo_accion));
  const reportesAtrapados = reportesPersonas.filter(a => a.tipo_accion === 'personas_atrapadas');
  const reportesHeridos = reportesPersonas.filter(a => a.tipo_accion === 'persona_herida_recuperada');
  const reportesFallecidos = reportesPersonas.filter(a => a.tipo_accion === 'persona_fallecida_recuperada');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">

        <Link to="/edificios" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {es ? 'Directorio de edificios' : 'Buildings directory'}
        </Link>

        {/* ── ENCABEZADO FICHA VIVA — clic abre/cierra todo el detalle ── */}
        <div
          className={`bg-white border-2 rounded-2xl p-4 mb-3 cursor-pointer select-none transition-all ${esCritico ? 'border-red-300' : 'border-gray-200'}`}
          onClick={() => setExpandida(v => !v)}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{es ? 'Ficha de edificio' : 'Building record'}</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{edificio.nombre_lugar || edificio.tipo_estructura || (es ? 'Edificio sin nombre' : 'Unnamed building')}</h1>
              {edificio.tipo_estructura && <p className="text-[10px] text-gray-400 mt-0.5">{edificio.tipo_estructura.replace(/_/g, ' ')}</p>}
              {(edificio.direccion || edificio.ciudad) && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin size={10} className="flex-shrink-0" />
                  {[edificio.direccion, edificio.ciudad, edificio.estado_region].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <BarChart2 size={12} />{totalReportes} {es ? 'reportes' : 'reports'}
              </div>
              <p className="text-[10px] text-gray-400">{tiempoRelativo(edificio.updated_date || edificio.created_date, es)}</p>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 mt-1">
                {expandida ? (es ? '▲ Contraer' : '▲ Collapse') : (es ? '▼ Ver todo' : '▼ Expand')}
              </span>
            </div>
          </div>

          {/* Semáforo — siempre visible */}
          <Semaforo nivel={edificio.nivel_dano} es={es} />

          {/* Métricas rápidas — siempre visibles */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-lg font-black text-gray-800">{totalReportes}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{es ? 'Reportes' : 'Reports'}</p>
            </div>
            <div className={`text-center p-2 rounded-xl border ${edificio.personas_atrapadas === 'si' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-lg font-black">{edificio.personas_atrapadas === 'si' ? '🚨' : edificio.personas_atrapadas === 'voces' ? '👂' : edificio.personas_atrapadas === 'no' ? '✅' : '❓'}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{es ? 'Atrapados' : 'Trapped'}</p>
            </div>
            <div className={`text-center p-2 rounded-xl border ${esCritico ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-lg font-black">{esCritico ? '🔴' : '🟡'}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{es ? 'Prioridad' : 'Priority'}</p>
            </div>
          </div>

          {/* Riesgos activos — siempre visibles si existen */}
          {(edificio.riesgo_gas || edificio.riesgo_electrico || edificio.riesgo_incendio || edificio.riesgo_colapso) && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-100">
              {edificio.riesgo_gas && <span className="text-[11px] bg-orange-100 text-orange-800 px-2 py-1 rounded-full border border-orange-200 font-semibold">💨 Gas</span>}
              {edificio.riesgo_electrico && <span className="text-[11px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200 font-semibold">⚡ {es ? 'Eléctrico' : 'Electrical'}</span>}
              {edificio.riesgo_incendio && <span className="text-[11px] bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200 font-semibold">🔥 {es ? 'Incendio' : 'Fire'}</span>}
              {edificio.riesgo_colapso && <span className="text-[11px] bg-gray-200 text-gray-700 px-2 py-1 rounded-full border border-gray-300 font-semibold">💥 {es ? 'Colapso' : 'Collapse'}</span>}
            </div>
          )}

          {!expandida && (
            <p className="text-[10px] text-gray-400 text-center mt-3 border-t border-gray-100 pt-2">
              👆 {es ? 'Toca para ver servicios, historial y más información' : 'Tap to see services, history and more info'}
            </p>
          )}
        </div>

        {/* ── CONTENIDO EXPANDIBLE ── */}
        {expandida && (
        <>

        {/* ── AVISO NO-ENTRAR ── */}
        {noEntrar && (
          <div className="flex gap-3 bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-3">
            <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-800">🚫 {es ? '¡NO ENTRAR! Estructura NO SEGURA.' : 'DO NOT ENTER! Structure NOT SAFE.'}</p>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {es ? 'Espera a Protección Civil (171), Bomberos o rescatistas autorizados.' : 'Wait for Civil Protection (171), Firefighters or authorized rescue teams.'}
              </p>
            </div>
          </div>
        )}

        {/* ── ANTI-EXTORSIÓN ── */}
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.' : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
          </p>
        </div>

        {/* ── DATOS UBICACIÓN ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">📍 {es ? 'Ubicación' : 'Location'}</p>
          {edificio.direccion && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{edificio.direccion}{edificio.ciudad ? ` · ${edificio.ciudad}` : ''}{edificio.estado_region ? `, ${edificio.estado_region}` : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={12} className="flex-shrink-0" />
            <span>{es ? 'Reportado' : 'Reported'} {tiempoRelativo(edificio.created_date, es)}</span>
          </div>
          {edificio.descripcion && <p className="text-sm text-gray-700 pt-2 border-t border-gray-100">{edificio.descripcion}</p>}
        </div>

        {/* ── ESTADO OPERATIVO ── */}
        <EstadoOperativo edificioId={id} es={es} />

        {/* ── FOTOS ── */}
        {edificio.foto_urls?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">📷 {es ? 'Fotos del edificio' : 'Building photos'}</p>
            <GaleriaFotos urls={edificio.foto_urls} />
          </div>
        )}

        {/* ── PERSONAS / CUERPOS REPORTADOS EN EL SITIO ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">👥 {es ? 'Personas reportadas aquí' : 'People reported here'}</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {es ? 'Historial sensible según actualizaciones ciudadanas o institucionales.' : 'Sensitive history based on citizen or institutional updates.'}
              </p>
            </div>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
              {reportesPersonas.length} {es ? 'eventos' : 'events'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center bg-red-50 border border-red-100 rounded-xl p-2">
              <p className="text-lg font-black text-red-700">{reportesAtrapados.length}</p>
              <p className="text-[10px] text-red-700 leading-tight">{es ? 'Atrapados' : 'Trapped'}</p>
            </div>
            <div className="text-center bg-amber-50 border border-amber-100 rounded-xl p-2">
              <p className="text-lg font-black text-amber-700">{reportesHeridos.length}</p>
              <p className="text-[10px] text-amber-700 leading-tight">{es ? 'Heridos recuperados' : 'Injured recovered'}</p>
            </div>
            <div className="text-center bg-gray-100 border border-gray-200 rounded-xl p-2">
              <p className="text-lg font-black text-gray-700">{reportesFallecidos.length}</p>
              <p className="text-[10px] text-gray-600 leading-tight">{es ? 'Fallecidos recuperados' : 'Deceased recovered'}</p>
            </div>
          </div>

          {reportesPersonas.length > 0 ? (
            <div className="space-y-2">
              {reportesPersonas.slice(0, 5).map(a => {
                const s = ACCION_ESTILOS[a.tipo_accion] || { icon: '📋', color: '#555' };
                const lbl = ACCION_LABELS[a.tipo_accion];
                return (
                  <div key={`persona-${a.id}`} className="border border-gray-100 rounded-xl px-3 py-2 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold" style={{ color: s.color }}>{s.icon} {lbl ? (es ? lbl.es : lbl.en) : a.tipo_accion}</p>
                      <span className="text-[10px] text-gray-400">{tiempoRelativo(a.created_date, es)}</span>
                    </div>
                    {a.descripcion && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.descripcion}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              {es ? 'Aún no hay reportes de personas atrapadas, heridas recuperadas o fallecidos recuperados en esta ficha.' : 'No trapped, injured recovered, or deceased recovered reports yet on this record.'}
            </p>
          )}
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 leading-relaxed">
            ⚠️ {es ? 'No publiques nombres, documentos ni datos médicos sensibles en reportes públicos.' : 'Do not publish names, IDs, or sensitive medical details in public reports.'}
          </p>
        </div>

        </>
        )} {/* fin expandida */}

        {/* ── TRES BOTONES PRINCIPALES — siempre visibles ── */}
        <div className="grid grid-cols-1 gap-2 mb-4">
          <button onClick={() => setEditando(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl cursor-pointer text-sm transition-colors">
            <Eye size={15} /> {es ? 'Agregar actualización sobre este edificio' : 'Add an update about this building'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={confirmarIgual}
              className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-2xl cursor-pointer text-xs transition-colors">
              <ThumbsUp size={13} /> {es ? 'Sigue igual' : 'Still the same'}
            </button>
            <button onClick={() => { setUpdateForm(f => ({ ...f, tipo: 'informacion_incorrecta' })); setEditando(true); }}
              className="flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-2xl cursor-pointer text-xs transition-colors">
              <Info size={13} /> {es ? 'Info incorrecta' : 'Wrong info'}
            </button>
          </div>
        </div>

        {/* ── FORMULARIO ACTUALIZACIÓN ── */}
        {editando && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">✏️ {es ? 'Tu actualización' : 'Your update'}</h2>
              <button onClick={() => setEditando(false)} className="text-xs text-gray-400 underline cursor-pointer">{es ? 'Cancelar' : 'Cancel'}</button>
            </div>

            {/* Tipo */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { val: 'tengo_actualizacion', es: '🔄 Tengo info nueva', en: '🔄 New info' },
                { val: 'reportar_urgencia',   es: '🚨 Urgencia',         en: '🚨 Emergency' },
                { val: 'personas_atrapadas',  es: '🆘 Hay atrapados',    en: '🆘 Trapped'   },
                { val: 'persona_herida_recuperada', es: '🩹 Recuperaron herido', en: '🩹 Injured recovered' },
                { val: 'persona_fallecida_recuperada', es: '⚫ Recuperaron fallecido', en: '⚫ Deceased recovered' },
                { val: 'riesgo_marcado',      es: '💨 Nuevo riesgo',     en: '💨 New hazard' },
              ].map(t => (
                <button key={t.val} onClick={() => setUpdateForm(f => ({ ...f, tipo: t.val }))}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${updateForm.tipo === t.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                  {es ? t.es : t.en}
                </button>
              ))}
            </div>

            {/* Nivel daño */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">{es ? 'Nivel de daño actual' : 'Current damage level'}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[{ val: 'leve', es: '🟡 Leve', en: '🟡 Minor' }, { val: 'moderado', es: '🟠 Moderado', en: '🟠 Moderate' }, { val: 'grave', es: '🔴 Grave', en: '🔴 Severe' }, { val: 'critico', es: '🔴 Crítico', en: '🔴 Critical' }, { val: 'colapsado', es: '💥 Colapsado', en: '💥 Collapsed' }, { val: '', es: '—', en: '—' }].map(n => (
                  <button key={n.val} onClick={() => setUpdateForm(f => ({ ...f, nivel: n.val }))}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.nivel === n.val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {es ? n.es : n.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Atrapados */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">{es ? '¿Personas atrapadas?' : 'Trapped people?'}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ val: 'si', es: '🚨 Sí', en: '🚨 Yes' }, { val: 'voces', es: '👂 Voces/golpes', en: '👂 Voices/knocks' }, { val: 'no', es: '✅ No', en: '✅ No' }, { val: 'no_sabe', es: '❓ No sé', en: '❓ Unknown' }].map(a => (
                  <button key={a.val} onClick={() => setUpdateForm(f => ({ ...f, atrapados: a.val }))}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.atrapados === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {es ? a.es : a.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Riesgos */}
            <div className="grid grid-cols-3 gap-1.5">
              {[{ k: 'gas', icon: '💨', label: 'Gas' }, { k: 'elect', icon: '⚡', label: es ? 'Eléctrico' : 'Electrical' }, { k: 'inc', icon: '🔥', label: es ? 'Incendio' : 'Fire' }].map(r => (
                <button key={r.k} onClick={() => setUpdateForm(f => ({ ...f, [r.k]: !f[r.k] }))}
                  className={`py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm[r.k] ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>

            {/* Descripción */}
            <textarea rows={2} value={updateForm.desc} onChange={e => setUpdateForm(f => ({ ...f, desc: e.target.value }))}
              placeholder={['persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(updateForm.tipo) ? (es ? 'Describe sin datos sensibles: cuántas personas, quién las recuperó y a dónde fueron llevadas...' : 'Describe without sensitive details: how many people, who recovered them, and where they were taken...') : (es ? 'Describe lo que viste o sabes...' : 'Describe what you saw or know...')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none placeholder-gray-400 focus:outline-none focus:border-blue-400" />

            {/* Datos de contacto del reportante */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-gray-500">🔒 {es ? 'Tus datos (privados, no se publican)' : 'Your info (private, not published)'}</p>
              <input value={updateForm.nombre} onChange={e => setUpdateForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder={es ? 'Nombre (opcional)' : 'Name (optional)'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 bg-white focus:outline-none focus:border-blue-400" />
              <input value={updateForm.telefono} onChange={e => setUpdateForm(f => ({ ...f, telefono: e.target.value }))}
                placeholder={es ? 'Teléfono / WhatsApp (opcional)' : 'Phone / WhatsApp (optional)'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 bg-white focus:outline-none focus:border-blue-400" />
              <input value={updateForm.contacto} onChange={e => setUpdateForm(f => ({ ...f, contacto: e.target.value }))}
                placeholder={es ? 'Email (opcional)' : 'Email (optional)'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 bg-white focus:outline-none focus:border-blue-400" />
              <input value={updateForm.red_social} onChange={e => setUpdateForm(f => ({ ...f, red_social: e.target.value }))}
                placeholder={es ? 'Red social: @usuario (opcional)' : 'Social media: @handle (optional)'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400 bg-white focus:outline-none focus:border-blue-400" />
            </div>

            {/* Fotos */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">📷 {es ? 'Fotos (opcional, desde lugar seguro)' : 'Photos (optional, from safe location)'}</p>
              <div className="flex flex-wrap gap-2">
                {updateFotos.map(f => (
                  <div key={f.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {f.url && <img src={f.url} alt="" className="w-full h-full object-cover" />}
                    {f.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                    {f.url && <button onClick={() => setUpdateFotos(p => p.filter(x => x.id !== f.id))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={8} /></button>}
                  </div>
                ))}
                {updateFotos.length < 5 && (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50">
                    <Camera size={16} className="text-gray-400" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => { Array.from(e.target.files || []).slice(0, 5).forEach(subirUpdateFoto); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>

            <button onClick={handleUpdate} disabled={enviando || !updateForm.tipo || updateFotos.some(f => f.uploading)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3.5 rounded-2xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 transition-colors">
              {enviando ? <Loader2 className="animate-spin" size={15} /> : '📡'} {es ? 'Enviar actualización' : 'Send update'}
            </button>
          </div>
        )}

        {/* ── CONTENIDO SECUNDARIO EXPANDIBLE ── */}
        {expandida && (<>

        {/* ── LÍNEA DE TIEMPO ── */}
        {actualizaciones.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">🕐 {es ? 'Historial de actualizaciones' : 'Update history'}</h2>
            <div className="space-y-2">
              {actualizaciones.map((a) => {
                const s = ACCION_ESTILOS[a.tipo_accion] || { icon: '📋', color: '#555' };
                const lbl = ACCION_LABELS[a.tipo_accion];
                return (
                  <div key={a.id} className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: s.color }} />
                    <div className="flex-1 border border-gray-100 rounded-xl px-3 py-2 bg-gray-50">
                      <div className="flex items-center gap-1">
                        <span>{s.icon}</span>
                        <p className="text-xs font-semibold" style={{ color: s.color }}>{lbl ? (es ? lbl.es : lbl.en) : a.tipo_accion}</p>
                      </div>
                      {a.descripcion && <p className="text-xs text-gray-600 mt-0.5">{a.descripcion}</p>}
                      {a.nivel_dano_anterior && a.nivel_dano_nuevo && a.nivel_dano_anterior !== a.nivel_dano_nuevo && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{es ? 'Daño:' : 'Damage:'} {a.nivel_dano_anterior} → {a.nivel_dano_nuevo}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{tiempoRelativo(a.created_date, es)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SUSCRIPCIÓN ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800">{es ? 'Recibir actualizaciones por email' : 'Get email updates'}</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">{es ? 'Te avisamos si cambia el estado, hay nueva información o reportan recuperación de personas heridas o fallecidas. Sin cuenta necesaria.' : 'We notify you if the status changes, there is new info, or injured/deceased people are reported recovered. No account needed.'}</p>
          {suscrito ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-green-700">✅ {es ? '¡Suscrito! Te avisaremos por email.' : 'Subscribed! We will notify you by email.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <input value={subNombre} onChange={e => setSubNombre(e.target.value)}
                placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400" />
              <div className="flex gap-2">
                <input value={subEmail} onChange={e => setSubEmail(e.target.value)}
                  placeholder={es ? 'Tu email...' : 'Your email...'}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                <button onClick={suscribirse} disabled={suscribiendo || !subEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40 cursor-pointer transition-colors">
                  {es ? 'Avisarme' : 'Notify me'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── ¿CONOCES ESTE EDIFICIO? ── */}
        {solicitudes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-2">
              <Users size={14} className="text-purple-700 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-800">{es ? 'Vecinos buscando información' : 'Neighbors looking for info'}</p>
                <p className="text-[11px] text-purple-600">{es ? '¿Conoces alguno de estos edificios en la zona?' : 'Do you know any of these buildings in the area?'}</p>
              </div>
            </div>
            <div className="space-y-2">
              {solicitudes.slice(0, 3).map(s => (
                <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.nombre_lugar}</p>
                      <p className="text-xs text-gray-500">📍 {s.direccion || (es ? 'Sin dirección' : 'No address')} · {s.ciudad}</p>
                    </div>
                    <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">{es ? 'Sin datos' : 'No data'}</span>
                  </div>
                  {conozco === s.id ? (
                    <div className="space-y-2 pt-2 border-t border-amber-200">
                      <textarea rows={2} value={respConozco.desc} onChange={e => setRespConozco(p => ({ ...p, desc: e.target.value }))}
                        placeholder={es ? 'Cuéntanos qué sabes...' : 'Tell us what you know...'}
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm resize-none placeholder-gray-400 focus:outline-none" />
                      <input value={respConozco.nombre} onChange={e => setRespConozco(p => ({ ...p, nombre: e.target.value }))}
                        placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none" />
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          setEnviandoResp(true);
                          try {
                            await base44.entities.ActualizacionesSitios.create({ sitio_id: s.id, tipo_sitio: 'edificio', tipo_accion: 'tengo_actualizacion', descripcion: respConozco.desc || (es ? 'Ciudadano conoce este edificio' : 'Citizen knows this building'), reportante_nombre: respConozco.nombre, fuente: 'ciudadano' });
                            setSolicitudes(prev => prev.filter(x => x.id !== s.id));
                          } catch {}
                          setEnviandoResp(false); setConozco(null); setRespConozco({ nombre: '', desc: '' });
                        }} disabled={enviandoResp}
                          className="flex-1 bg-purple-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer">
                          {enviandoResp ? <Loader2 className="animate-spin inline" size={13} /> : '📨'} {es ? 'Aportar información' : 'Share info'}
                        </button>
                        <button onClick={() => setConozco(null)} className="text-xs text-gray-400 underline cursor-pointer">{es ? 'Cancelar' : 'Cancel'}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConozco(s.id)} className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl cursor-pointer transition-colors">
                      👁️ {es ? 'Yo conozco este edificio' : 'I know this building'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COMPARTIR ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{es ? 'Compartir esta ficha' : 'Share this record'}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={compartir} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition-colors">
              <Share2 size={13} /> WhatsApp
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-xs font-bold py-3 rounded-xl cursor-pointer transition-colors">
              {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copiado ? (es ? 'Copiado' : 'Copied') : (es ? 'Copiar enlace' : 'Copy link')}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed mb-4">
          {es ? 'Esta plataforma es una herramienta ciudadana y no partidista. La información proviene de ciudadanos y no ha sido verificada de manera independiente.' : 'This platform is a citizen and non-partisan tool. Information comes from citizens and has not been independently verified.'}
        </p>

        </>)} {/* fin expandida secundario */}
      </div>
      <Footer />
    </div>
  );
}