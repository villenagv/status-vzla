import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, AlertTriangle, Share2, Copy, Check, ShieldAlert, Loader2, ThumbsUp, Info, Eye, Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import GaleriaFotos from '@/components/svzla/GaleriaFotos';

const DANO_CONFIG = {
  leve:       { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', label: { es: 'Daño leve',     en: 'Minor damage' },     acceso: { es: 'Entrada con precaución',       en: 'Enter with caution' } },
  moderado:   { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', label: { es: 'Daño moderado', en: 'Moderate damage' },  acceso: { es: 'Entrada limitada',             en: 'Limited entry' } },
  grave:      { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', label: { es: 'Daño grave',     en: 'Severe damage' },    acceso: { es: 'NO ENTRAR',                   en: 'DO NOT ENTER' } },
  critico:    { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', label: { es: 'CRÍTICO',         en: 'CRITICAL' },         acceso: { es: 'NO ENTRAR — PELIGRO EXTREMO', en: 'DO NOT ENTER — EXTREME DANGER' } },
  colapsado:  { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', label: { es: 'COLABSADO',      en: 'COLLAPSED' },        acceso: { es: 'NO ENTRAR — COLABSADO',       en: 'DO NOT ENTER — COLLAPSED' } },
  no_evaluado:{ color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', label: { es: 'Sin evaluar',    en: 'Not evaluated' },    acceso: { es: 'Precaución — sin verificar',   en: 'Caution — unverified' } },
};

const ACCION_ESTILOS = {
  tengo_actualizacion:   { icon: '🔄', cls: 'bg-amber-50 border-amber-200', color: '#CA6F1E' },
  confirmo_mismo_estado:  { icon: '✅', cls: 'bg-green-50 border-green-200', color: '#2E7D32' },
  informacion_incorrecta: { icon: '⚠️', cls: 'bg-orange-50 border-orange-200', color: '#D4621A' },
  reportar_urgencia:      { icon: '🚨', cls: 'bg-red-50 border-red-200', color: '#C0392B' },
  nuevo_nivel_dano:       { icon: '📍', cls: 'bg-blue-50 border-blue-200', color: '#2471A3' },
  personas_atrapadas:     { icon: '🆘', cls: 'bg-red-50 border-red-200', color: '#C0392B' },
  riesgo_marcado:         { icon: '💨', cls: 'bg-orange-50 border-orange-200', color: '#D4621A' },
  estado_cambiado:        { icon: '📋', cls: 'bg-gray-50 border-gray-200', color: '#555555' },
  verificado:             { icon: '🏛️', cls: 'bg-teal-50 border-teal-200', color: '#00838F' },
};

const ACCION_LABELS = {
  tengo_actualizacion:   { es: 'Nueva actualización',          en: 'New update' },
  confirmo_mismo_estado:  { es: 'Estado confirmado',           en: 'Status confirmed' },
  informacion_incorrecta: { es: 'Reportado como incorrecto',   en: 'Reported as incorrect' },
  reportar_urgencia:      { es: 'Urgencia reportada',          en: 'Urgency reported' },
  nuevo_nivel_dano:       { es: 'Nivel de daño actualizado',   en: 'Damage level updated' },
  personas_atrapadas:     { es: 'Personas atrapadas',          en: 'Trapped people' },
  riesgo_marcado:         { es: 'Riesgo marcado',              en: 'Hazard marked' },
  estado_cambiado:        { es: 'Estado cambiado',             en: 'Status changed' },
  verificado:             { es: 'Verificado por institución',  en: 'Verified by institution' },
};

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d} día${d > 1 ? 's' : ''}` : `${d} day${d > 1 ? 's' : ''} ago`;
  if (h > 0) return es ? `hace ${h} hora${h > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''} ago`;
  return es ? `hace ${m} min` : `${m} min ago`;
}

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function EdificioDetalle() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const error = params.get('error');
  const { lang } = useLang();
  const es = lang === 'es';

  const [edificio, setEdificio] = useState(null);
  const [actualizaciones, setActualizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [errorId, setErrorId] = useState(false);

  const [telSub, setTelSub] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [suscribiendo, setSuscribiendo] = useState(false);

  const [editando, setEditando] = useState(false);
  const [updateForm, setUpdateForm] = useState({ tipo: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, desc: '', nombre: '', contacto: '' });
  const [enviando, setEnviando] = useState(false);
  const [updateFotos, setUpdateFotos] = useState([]); // [{id, url, uploading}]

  // ── Solicitudes pendientes ──
  const [solicitudes, setSolicitudes] = useState([]);
  const [conozco, setConozco] = useState(null); // id de la solicitud que se está respondiendo
  const [respConozco, setRespConozco] = useState({ nombre: '', contacto: '', desc: '' });
  const [enviandoResp, setEnviandoResp] = useState(false);

  useEffect(() => {
    if (!id) { setCargando(false); setErrorId(true); return; }
    base44.entities.ReportesDano.get(id).then(e => {
      if (!e) { setErrorId(true); return; }
      setEdificio(e);
      return base44.entities.ActualizacionesSitios.filter({ sitio_id: id }, '-created_date', 30)
        .then(ups => {
          if (ups) setActualizaciones(ups);
          return base44.entities.SolicitudesInfoEdificio.filter({ ciudad: e.ciudad, estado_solicitud: 'pendiente' }, '-created_date', 10);
        }).then(ss => {
          if (ss) setSolicitudes(ss.filter(s => s.nombre_lugar && !s.reporte_encontrado_id));
        });
    }).catch(() => { setErrorId(true); })
      .finally(() => setCargando(false));
  }, [id]);

  const suscribirse = async () => {
    if (!telSub.trim() || !id) return;
    setSuscribiendo(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({ reporte_id: id, tipo_reporte: 'dano', telefono_whatsapp: telSub.trim(), activo: true });
      setSuscrito(true);
    } catch(err) {}
    setSuscribiendo(false);
  };

  const compartir = () => {
    if (!edificio) return;
    const cfg = DANO_CONFIG[edificio.nivel_dano] || DANO_CONFIG.no_evaluado;
    const peligro = ['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano) ? `🔴${es ? '¡NO ENTRAR!' : 'DO NOT ENTER!'} ` : '';
    const texto = `${peligro}🏗️ ${edificio.nombre_lugar || (es ? 'Edificio' : 'Building')} — ${cfg.label[es ? 'es' : 'en']} · ${edificio.direccion || ''}, ${edificio.ciudad || ''} ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: `CRIS · ${edificio.nombre_lugar || 'Edificio'}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      alert(es ? 'Texto copiado' : 'Text copied');
    }
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const setUpdate = (field) => (val) => setUpdateForm(f => ({ ...f, [field]: val }));

  const subirUpdateFoto = async (file) => {
    const id = Date.now();
    setUpdateFotos(prev => [...prev, { id, url: null, uploading: true }]);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setUpdateFotos(p => p.map(f => f.id === id ? { ...f, url: file_url, uploading: false } : f)); }
    catch { setUpdateFotos(p => p.filter(f => f.id !== id)); }
  };

  const confirmarIgual = async () => {
    if (!id) return;
    await base44.entities.ActualizacionesSitios.create({ sitio_id: id, tipo_sitio: 'edificio', tipo_accion: 'confirmo_mismo_estado', fuente: 'ciudadano' });
    window.location.href = `/edificio?id=${id}&codigo=${generarCodigo()}`;
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
        reportante_nombre: updateForm.nombre, reportante_contacto: updateForm.contacto, fuente: 'ciudadano'
      });
      const updateData = {};
      if (updateForm.nivel) updateData.nivel_dano = updateForm.nivel;
      if (updateForm.atrapados) updateData.personas_atrapadas = updateForm.atrapados;
      if (updateForm.gas) updateData.riesgo_gas = updateForm.gas;
      if (updateForm.elect) updateData.riesgo_electrico = updateForm.elect;
      if (updateForm.inc) updateData.riesgo_incendio = updateForm.inc;
      updateData.prioridad = prioridad;
      if (updateForm.desc) updateData.descripcion = updateForm.desc;
      // Agregar fotos nuevas a las existentes
      const fotosNuevas = updateFotos.filter(f => f.url).map(f => f.url);
      if (fotosNuevas.length > 0) updateData.foto_urls = [...(edificio.foto_urls || []), ...fotosNuevas];
      await base44.entities.ReportesDano.update(id, updateData);
      await base44.functions.invoke('notificarActualizacionEdificio', { edificio_id: id, nivel_dano: updateForm.nivel || edificio.nivel_dano, direccion: edificio.direccion, nombre_lugar: edificio.nombre_lugar, reportante_nombre: updateForm.nombre || '', lang }).catch(() => {});
      window.location.href = `/edificio?id=${id}&codigo=${generarCodigo()}`;
    } catch(err) { alert(es ? 'Error al enviar.' : 'Error sending.'); }
    setEnviando(false);
  };

  if (cargando) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-gray-400" size={32} />
          <p className="text-sm text-gray-400">{es ? 'Cargando ficha...' : 'Loading record...'}</p>
        </div>
      </div>
    </div>
  );

  if (errorId || !edificio) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
        {error === 'token_invalido' ? (
          <>
            <p className="text-5xl">🔗</p>
            <h2 className="text-xl font-semibold text-gray-900">{es ? 'Enlace expirado' : 'Link expired'}</h2>
            <p className="text-sm text-gray-500">{es ? 'El enlace de acceso ya no es válido.' : 'The access link is no longer valid.'}</p>
          </>
        ) : (
          <>
            <p className="text-5xl">🏗️</p>
            <p className="font-semibold text-gray-700">{es ? 'Edificio no encontrado.' : 'Building not found.'}</p>
          </>
        )}
        <Link to="/edificios" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold no-underline text-sm">← {es ? 'Volver al directorio' : 'Back to directory'}</Link>
      </div>
    </div>
  );

  const cfg = DANO_CONFIG[edificio.nivel_dano] || DANO_CONFIG.no_evaluado;
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/edificios" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800">
          <ChevronLeft size={16} /> {es ? 'Directorio de edificios' : 'Buildings directory'}
        </Link>

        {/* ── ENCABEZADO ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">{edificio.nombre_lugar || edificio.tipo_estructura || (es ? 'Edificio sin nombre' : 'Unnamed building')}</h1>
          <p className="text-[10px] text-gray-400 mb-2">{edificio.tipo_estructura?.replace(/_/g, ' ')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${noEntrar ? 'bg-red-600 text-white border-red-600' : ''}`} style={!noEntrar ? { color: cfg.color, borderColor: cfg.border, background: cfg.bg } : {}}>
              {cfg.label[es ? 'es' : 'en']} {noEntrar && '🚫'}
            </span>
            {edificio.personas_atrapadas === 'si' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚨 {es ? 'Atrapados' : 'Trapped'}</span>}
          </div>
        </div>

        {/* ── AVISO NO-ENTRAR ── */}
        {noEntrar && (
          <div className="flex gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
            <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-red-800">🚫 {es ? '¡NO ENTRAR! Estructura NO SEGURA.' : 'DO NOT ENTER! Structure NOT SAFE.'}</p>
              <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                {es ? 'Este edificio presenta daño grave, crítico o colapsado. No intentes entrar. Espera a Protección Civil (171), Bomberos o rescatistas autorizados.' : 'This building has severe, critical or collapsed damage. Do not attempt entry. Wait for Civil Protection (171), Firefighters or authorized rescue teams.'}
              </p>
            </div>
          </div>
        )}

        {/* ── ANTISTORSIÓN ── */}
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.' : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
          </p>
        </div>

        {/* ── DATOS ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-2.5">
          <h2 className="text-sm font-medium text-gray-700 mb-2">{es ? '📍 Información del edificio' : '📍 Building information'}</h2>
          {edificio.direccion && (
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{edificio.direccion} · {edificio.ciudad}{edificio.estado_region ? `, ${edificio.estado_region}` : ''}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Clock size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <span>{es ? 'Reportado' : 'Reported'} {tiempoRelativo(edificio.created_date, es)}{edificio.updated_date !== edificio.created_date ? ` · ${es ? 'Actualizado' : 'Updated'} ${tiempoRelativo(edificio.updated_date, es)}` : ''}</span>
          </div>
          {edificio.descripcion && <p className="text-sm text-gray-700 pt-2 border-t border-gray-100">{edificio.descripcion}</p>}
        </div>

        {/* ── FOTOS ── */}
        {edificio.foto_urls?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">{es ? '📷 Fotos del edificio' : '📷 Building photos'}</p>
            <GaleriaFotos urls={edificio.foto_urls} />
          </div>
        )}

        {/* ── RIESGOS ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-xs font-medium text-gray-700 mb-2">{es ? '⚡ Riesgos marcados' : '⚡ Marked hazards'}</h2>
          <div className="flex flex-wrap gap-1.5">
            {edificio.riesgo_gas && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">💨 Gas</span>}
            {edificio.riesgo_electrico && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">⚡ Eléctrico</span>}
            {edificio.riesgo_incendio && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-200">🔥 Incendio</span>}
            {edificio.riesgo_colapso && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full border border-gray-300">💥 Colapso</span>}
            {!edificio.riesgo_gas && !edificio.riesgo_electrico && !edificio.riesgo_incendio && !edificio.riesgo_colapso && (
              <span className="text-xs text-gray-300">—</span>)}
          </div>
        </div>

        {/* ── LÍNEA DE TIEMPO ── */}
        {actualizaciones.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">🕐 {es ? 'Historial de actualizaciones' : 'Update history'}</h2>
            <div className="space-y-2">
              {actualizaciones.map((a) => {
                const s = ACCION_ESTILOS[a.tipo_accion] || { icon: '📋', cls: 'bg-gray-50 border-gray-200', color: '#555' };
                const lbl = ACCION_LABELS[a.tipo_accion];
                const label = lbl ? (es ? lbl.es : lbl.en) : a.tipo_accion;
                return (
                  <div key={a.id} className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: s.color }} />
                    <div className={`flex-1 border rounded-lg px-3 py-2 ${s.cls}`}>
                      <div className="flex items-center gap-1">
                        <span>{s.icon}</span>
                        <p className="text-xs font-medium" style={{ color: s.color }}>{label}</p>
                      </div>
                      {a.descripcion && <p className="text-xs text-gray-600 mt-0.5">{a.descripcion}</p>}
                      {a.nivel_dano_anterior && a.nivel_dano_nuevo && a.nivel_dano_anterior !== a.nivel_dano_nuevo && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{es ? 'Daño:' : 'Damage:'} {a.nivel_dano_anterior} → {a.nivel_dano_nuevo}</p>)}
                      <p className="text-[10px] text-gray-400 mt-1">{tiempoRelativo(a.created_date, es)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACTUALIZAR ── */}
        {!editando ? (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{es ? '¿Qué sabes de este edificio?' : 'What do you know about this building?'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEditando(true)} className="flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-medium py-3 rounded-xl cursor-pointer"><Eye size={14} /> {es ? 'Lo vi — tengo info' : 'I saw it — have info'}</button>
              <button onClick={confirmarIgual} className="flex items-center justify-center gap-2 bg-green-700 text-white text-xs font-medium py-3 rounded-xl cursor-pointer"><ThumbsUp size={14} /> {es ? 'Sigue igual' : 'Still the same'}</button>
            </div>
            <button onClick={() => { setUpdateForm({ tipo: 'informacion_incorrecta', nombre: '', desc: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, contacto: '' }); setEditando(true); }} className="flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 text-xs font-bold py-3 rounded-xl cursor-pointer"><Info size={14} /> {es ? 'Información incorrecta' : 'Incorrect info'}</button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">{es ? '✏️ Tu actualización' : '✏️ Your update'}</h2>
              <button onClick={() => setEditando(false)} className="text-xs text-gray-400 underline cursor-pointer">{es ? 'Cancelar' : 'Cancel'}</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ val: 'tengo_actualizacion', es: 'Nueva información', en: 'New info' }, { val: 'reportar_urgencia', es: '🚨 Urgencia', en: '🚨 Urgency' }].map(t => (
                <button key={t.val} onClick={() => setUpdateForm(f => ({ ...f, tipo: t.val }))}
                  className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${updateForm.tipo === t.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {es ? t.es : t.en}</button>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">{es ? 'Nivel de daño actual' : 'Current damage level'}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ val: 'leve', es: 'Leve', en: 'Minor' }, { val: 'moderado', es: 'Moderado', en: 'Moderate' }, { val: 'grave', es: 'Grave', en: 'Severe' }, { val: 'critico', es: 'Crítico', en: 'Critical' }, { val: 'colapsado', es: 'Colapsado', en: 'Collapsed' }].map(n => (
                  <button key={n.val} onClick={() => setUpdateForm(f => ({ ...f, nivel: n.val }))}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${updateForm.nivel === n.val ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? n.es : n.en}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">{es ? 'Personas atrapadas' : 'Trapped people'}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ val: 'si', es: '🚨 Sí', en: '🚨 Yes' }, { val: 'voces', es: '👂 Voces/golpes', en: '👂 Voices/knots' }, { val: 'no', es: '✅ No', en: '✅ No' }, { val: 'no_sabe', es: '❓ No sé', en: '❓ Unknown' }].map(a => (
                  <button key={a.val} onClick={() => setUpdateForm(f => ({ ...f, atrapados: a.val }))}
                    className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${updateForm.atrapados === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {es ? a.es : a.en}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[{ key: 'gas', icon: '💨', label: 'Gas' }, { key: 'elect', icon: '⚡', label: 'Eléctrico' }, { key: 'inc', icon: '🔥', label: 'Incendio' }].map(r => (
                <button key={r.key} onClick={() => setUpdateForm(f => ({ ...f, [r.key]: !f[r.key] }))}
                  className={`py-2.5 rounded-lg text-xs font-semibold border cursor-pointer ${updateForm[r.key] ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-gray-200 text-gray-700'}`}>
                  {r.icon} {r.label}</button>
              ))}
            </div>
            <textarea rows={2} value={updateForm.desc} onChange={e => setUpdateForm(f => ({ ...f, desc: e.target.value }))}
              placeholder={es ? 'Describe lo que viste o sabes...' : 'Describe what you saw or know...'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none placeholder-gray-400" />
            <input value={updateForm.nombre} onChange={e => setUpdateForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm placeholder-gray-400" />
              <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">{es ? '📷 Agregar fotos (opcional)' : '📷 Add photos (optional)'}</p>
              <p className="text-[10px] text-gray-400 mb-2">{es ? 'Fotos desde un lugar seguro.' : 'Photos from a safe location.'}</p>
              <div className="flex flex-wrap gap-2">
                {updateFotos.map(f => (
                  <div key={f.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {f.url && <img src={f.url} alt="" className="w-full h-full object-cover" />}
                    {f.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-white" /></div>}
                    {f.url && (
                      <button onClick={() => setUpdateFotos(p => p.filter(x => x.id !== f.id))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer">
                        <X size={8} />
                      </button>
                    )}
                  </div>
                ))}
                {updateFotos.length < 5 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Camera size={16} className="text-gray-400" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = Array.from(e.target.files || []).slice(0, 5); f.forEach(subirUpdateFoto); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>
            <button onClick={handleUpdate} disabled={enviando || !updateForm.tipo || updateFotos.some(f => f.uploading)}
              className="w-full bg-blue-700 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
              {enviando ? <Loader2 className="animate-spin" size={15} /> : '📡'} {es ? 'Enviar actualización' : 'Send update'}
            </button>
          </div>
        )}

        {/* ── ¿CONOCES ESTE EDIFICIO? (solicitudes pendientes) ── */}
        {solicitudes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
              <span className="text-base">🧑‍🤝‍🧑</span>
              <div>
                <p className="text-xs font-bold text-purple-800">{es ? 'Ayúdanos a completar' : 'Help us complete'}</p>
                <p className="text-[11px] text-purple-600">{es ? 'Hay vecinos buscando información de edificios en esta zona.' : 'Neighbors are looking for information about buildings in this area.'}</p>
              </div>
            </div>
            <div className="space-y-2">
              {solicitudes.map(s => (
                <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.nombre_lugar}</p>
                      <p className="text-xs text-gray-500">📍 {s.direccion || (es ? 'Sin dirección' : 'No address')} · {s.ciudad}{s.estado_region ? `, ${s.estado_region}` : ''}</p>
                    </div>
                    <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">{es ? 'Sin datos' : 'No data'}</span>
                  </div>
                  {conozco === s.id && (
                    <div className="mt-2 pt-2 border-t border-amber-200 space-y-2">
                      <p className="text-xs font-medium text-amber-800">{es ? 'Cuéntanos qué sabes:' : 'Tell us what you know:'}</p>
                      <textarea rows={2} value={respConozco.desc} onChange={e => setRespConozco(p => ({ ...p, desc: e.target.value }))}
                        placeholder={es ? 'Ej: Vi grietas en la fachada, parece deshabitado...' : 'E.g: I saw cracks in the facade, seems unoccupied...'}
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm resize-none placeholder-gray-400" />
                      <input value={respConozco.nombre} onChange={e => setRespConozco(p => ({ ...p, nombre: e.target.value }))}
                        placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'} className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400" />
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          setEnviandoResp(true);
                          try {
                            await base44.entities.ActualizacionesSitios.create({
                              sitio_id: s.id, tipo_sitio: 'edificio', tipo_accion: 'tengo_actualizacion',
                              descripcion: respConozco.desc || (es ? 'Ciudadano reporta conocer este edificio' : 'Citizen reports knowing this building'),
                              reportante_nombre: respConozco.nombre, reportante_contacto: respConozco.contacto,
                              fuente: 'ciudadano', es_sensible: false,
                            });
                            setSolicitudes(prev => prev.filter(x => x.id !== s.id));
                          } catch {}
                          setEnviandoResp(false);
                          setConozco(null);
                          setRespConozco({ nombre: '', contacto: '', desc: '' });
                        }} disabled={enviandoResp}
                          className="flex-1 bg-purple-700 text-white text-sm font-bold py-2.5 rounded-lg disabled:opacity-40 cursor-pointer">
                          {enviandoResp ? <Loader2 className="animate-spin inline" size={13} /> : '📨'} {es ? 'Aportar información' : 'Share info'}
                        </button>
                        <button onClick={() => { setConozco(null); setRespConozco({ nombre: '', contacto: '', desc: '' }); }}
                          className="text-xs text-gray-500 underline cursor-pointer">
                          {es ? 'Cancelar' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                  {conozco !== s.id && (
                    <button onClick={() => setConozco(s.id)} className="w-full text-xs font-semibold bg-amber-600 text-white py-2 rounded-lg cursor-pointer hover:bg-amber-700">
                      👁️ {es ? 'Yo conozco este edificio' : 'I know this building'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COMPARTIR ── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">{es ? 'Compartir esta ficha' : 'Share this record'}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={compartir} className="flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-medium py-2.5 rounded-lg cursor-pointer"><Share2 size={13} /> WhatsApp</button>
            <button onClick={copiarEnlace} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium py-2.5 rounded-lg cursor-pointer">
              {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copiado ? (es ? 'Copiado' : 'Copied') : (es ? 'Copiar enlace' : 'Copy link')}
            </button>
          </div>
        </div>

        {/* ── SUSCRIPCIÓN ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-1">🔔 {es ? 'Notificarme si cambia el estado' : 'Notify me of status changes'}</h2>
          <p className="text-xs text-gray-400 mb-3">{es ? 'Sin cuenta necesaria. Tus datos no se publican.' : 'No account needed. Your data stays private.'}</p>
          {suscrito ? (
            <p className="text-sm text-green-700 font-medium">✅ {es ? 'Suscrito. Te avisaremos por email.' : 'Subscribed. We will notify you by email.'}</p>
          ) : (
            <div className="flex gap-2">
              <input value={telSub} onChange={e => setTelSub(e.target.value)} placeholder={es ? 'Tu email...' : 'Your email...'}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              <button onClick={suscribirse} disabled={suscribiendo || !telSub.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 cursor-pointer">{es ? 'Avisarme' : 'Notify me'}</button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed mb-4">
          {es ? 'Esta plataforma es una herramienta ciudadana y no partidista. La información proviene de ciudadanos y no ha sido verificada de manera independiente.' : 'This platform is a citizen and non-partisan tool. Information comes from citizens and has not been independently verified.'}
        </p>
      </div>
      <Footer />
    </div>
  );
}