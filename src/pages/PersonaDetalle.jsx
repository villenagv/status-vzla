import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Share2, MapPin, Clock, AlertTriangle, Phone, Mail, Copy, Check, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FichaPersonaDescargable from '@/components/svzla/FichaPersonaDescargable';
import ActualizarPersonaPerfil from '@/components/svzla/ActualizarPersonaPerfil';

const ESTADO_CONFIG = {
  buscando:             { es: '🔴 Sin contacto',          en: '🔴 Missing',              cls: 'bg-red-100 text-red-800 border-red-200' },
  informacion_recibida: { es: '🔵 Con pistas',            en: '🔵 Has leads',             cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  visto_no_confirmado:  { es: '🟠 Visto sin confirmar',   en: '🟠 Seen unconfirmed',      cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  encontrado_con_vida:  { es: '✅ Localizado a salvo',    en: '✅ Located safe',          cls: 'bg-green-100 text-green-800 border-green-200' },
  en_hospital_refugio:  { es: '🏥 En hospital/refugio',   en: '🏥 In hospital/shelter',  cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  fallecido_reportado:  { es: '⚫ Fallecido (reportado)', en: '⚫ Deceased (reported)',   cls: 'bg-gray-200 text-gray-700 border-gray-300' },
  caso_cerrado:         { es: '🔒 Caso cerrado',          en: '🔒 Case closed',          cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const EVENTO_ICON = {
  estoy_aqui:         { icon: '📍', color: 'bg-amber-500' },
  reportado:          { icon: '🆕', color: 'bg-blue-500' },
  actualizacion_estado:{ icon: '🔄', color: 'bg-indigo-500' },
  persona_encontrada: { icon: '✅', color: 'bg-green-500' },
  pista_recibida:     { icon: '💡', color: 'bg-yellow-500' },
  traslado:           { icon: '🚗', color: 'bg-teal-500' },
  verificado:         { icon: '🛡️', color: 'bg-purple-500' },
  alerta_familiar:    { icon: '📧', color: 'bg-pink-500' },
  default:            { icon: '📋', color: 'bg-gray-400' },
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

export default function PersonaDetalle() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const { lang } = useLang();
  const es = lang === 'es';

  const [persona, setPersona] = useState(null);
  const [pistas, setPistas] = useState([]);
  const [reportesEncontrado, setReportesEncontrado] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [telSub, setTelSub] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [suscribiendo, setSuscribiendo] = useState(false);
  const [tabActiva, setTabActiva] = useState('info'); // 'info' | 'historial' | 'contactos'

  useEffect(() => {
    if (!id) return;
    Promise.all([
      base44.entities.PersonasBuscadas.get(id),
      base44.entities.PistasPersonas.filter({ persona_id: id }, '-created_date', 30).catch(() => []),
      base44.entities.PersonasEncontradas.filter({ persona_buscada_id: id }, '-created_date', 10).catch(() => []),
      base44.entities.EventoHistorial.filter({ persona_id: id }, '-created_date', 50).catch(() => []),
    ]).then(([p, pis, encontrados, evts]) => {
      setPersona(p);
      setPistas(pis);
      setReportesEncontrado(encontrados);
      setEventos(evts);
    }).catch(() => {}).finally(() => setCargando(false));
  }, [id]);

  const copiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = () => {
    if (!persona) return;
    const texto = es
      ? `🔴 ¿La/lo has visto? ${persona.nombre_completo}${persona.edad_aprox ? ` · ${persona.edad_aprox} años` : ''} · Última vez en ${persona.ultima_ubicacion_conocida}, ${persona.ciudad}. Contacto: ${persona.contacto_telefono || 'ver enlace'}. ${window.location.href}`
      : `🔴 Have you seen them? ${persona.nombre_completo}${persona.edad_aprox ? ` · ${persona.edad_aprox} yrs` : ''} · Last seen in ${persona.ultima_ubicacion_conocida}, ${persona.ciudad}. Contact: ${persona.contacto_telefono || 'see link'}. ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: `CRIS · ${persona.nombre_completo}`, text: texto });
    } else {
      navigator.clipboard.writeText(texto);
    }
  };

  const suscribirse = async () => {
    if (!telSub.trim() || !id) return;
    setSuscribiendo(true);
    try {
      await base44.entities.SuscriptoresSeguimiento.create({
        reporte_id: id, tipo_reporte: 'persona',
        telefono_whatsapp: telSub.trim(), activo: true,
      });
      setSuscrito(true);
    } catch {}
    setSuscribiendo(false);
  };

  // Combinar pistas + eventos en un timeline unificado
  const timelineUnificado = [
    ...pistas.map(p => ({
      id: `pista-${p.id}`, fecha: p.created_date,
      tipo: 'pista_recibida',
      descripcion: p.descripcion || p.ubicacion_pista,
      ubicacion: p.ubicacion_pista,
      fuente: p.nombre_informante || (es ? 'Ciudadano' : 'Citizen'),
    })),
    ...eventos.map(e => ({
      id: `evento-${e.id}`, fecha: e.created_date,
      tipo: e.tipo_evento || 'default',
      descripcion: e.descripcion,
      ubicacion: e.ubicacion_texto || e.ciudad,
      fuente: e.reportante_nombre || e.fuente || (es ? 'Sistema' : 'System'),
    })),
    ...reportesEncontrado.map(r => ({
      id: `enc-${r.id}`, fecha: r.created_date,
      tipo: 'persona_encontrada',
      descripcion: `${es ? 'Reportado encontrado/a en:' : 'Reported found at:'} ${r.nombre_lugar || r.ubicacion_actual || r.ciudad}. ${es ? 'Condición:' : 'Condition:'} ${r.condicion || '—'}`,
      ubicacion: r.nombre_lugar || r.ubicacion_actual,
      fuente: r.reportado_por_nombre || (es ? 'Ciudadano' : 'Citizen'),
    })),
    {
      id: 'origen', fecha: persona?.created_date,
      tipo: 'reportado',
      descripcion: es ? 'Búsqueda publicada en CRIS.' : 'Search published on CRIS.',
      ubicacion: persona ? `${persona.ultima_ubicacion_conocida || ''} ${persona.ciudad || ''}`.trim() : '',
      fuente: persona?.fuente || (es ? 'Sistema' : 'System'),
    },
  ].filter(e => e.fecha).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (cargando) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        {es ? 'Cargando ficha...' : 'Loading record...'}
      </div>
    </div>
  );

  if (!persona) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-4xl">🔍</p>
        <p className="font-semibold text-gray-700">{es ? 'Ficha no encontrada.' : 'Record not found.'}</p>
        <Link to="/personas" className="text-blue-600 underline text-sm">{es ? '← Volver al directorio' : '← Back to directory'}</Link>
      </div>
    </div>
  );

  const st = ESTADO_CONFIG[persona.estado_caso] || ESTADO_CONFIG['buscando'];
  const esBuscando = ['buscando', 'informacion_recibida', 'visto_no_confirmado'].includes(persona.estado_caso);
  const contactosEncontrado = reportesEncontrado.flatMap(r => [
    { nombre: r.reportado_por_nombre || (es ? 'Quien reportó' : 'Reporter'), telefono: r.reportado_por_telefono, email: r.reportado_por_email, lugar: r.nombre_lugar || r.ubicacion_actual },
    { nombre: r.nombre_lugar || (es ? 'Lugar reportado' : 'Reported place'), telefono: r.telefono_contacto, email: r.email_contacto, lugar: r.ubicacion_actual },
  ]).filter(c => c.telefono || c.email).slice(0, 6);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/personas" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800">
          <ChevronLeft size={16} /> {es ? 'Directorio' : 'Directory'}
        </Link>

        {/* ── ENCABEZADO — Pasaporte ── */}
        <div className="bg-[#1A1F2E] rounded-2xl p-5 mb-4 text-white">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0">
              {persona.foto_url ? (
                <img src={persona.foto_url} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-white/20" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center text-4xl">👤</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>
                  {es ? st.es : st.en}
                </span>
              </div>
              <h1 className="text-lg font-black text-white leading-tight">{persona.nombre_completo}</h1>
              {persona.apodo && <p className="text-xs text-white/50 mt-0.5">"{persona.apodo}"</p>}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {persona.edad_aprox && <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full">{persona.edad_aprox} {es ? 'años' : 'yrs'}</span>}
                {persona.sexo && <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full capitalize">{persona.sexo}</span>}
                {persona.nivel_verificacion && persona.nivel_verificacion !== 'sin_verificar' && (
                  <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full">
                    🛡️ {persona.nivel_verificacion}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Código CRIS */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">{es ? 'ID de rastreo' : 'Tracking ID'}</p>
              <p className="text-sm font-mono font-bold text-white/70">{id.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30">{es ? 'Reportado' : 'Reported'}</p>
              <p className="text-xs text-white/60">{tiempoRelativo(persona.created_date, es)}</p>
            </div>
          </div>
          {/* Progreso del historial */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-white/30">{es ? 'Actividad del caso' : 'Case activity'}</p>
              <p className="text-[10px] text-white/50">{timelineUnificado.length} {es ? 'eventos' : 'events'}</p>
            </div>
            <div className="flex gap-1">
              {timelineUnificado.slice(0, 10).map((e, i) => {
                const cfg = EVENTO_ICON[e.tipo] || EVENTO_ICON.default;
                return <div key={i} className={`h-1.5 flex-1 rounded-full ${cfg.color} opacity-70`} />;
              })}
            </div>
          </div>
        </div>

        {/* ── ANTI-EXTORSIÓN ── */}
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es
              ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.'
              : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
          </p>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1.5 mb-4">
          {[
            { val: 'info',     es: '📋 Información', en: '📋 Info' },
            { val: 'historial',es: `🕐 Historial (${timelineUnificado.length})`, en: `🕐 Timeline (${timelineUnificado.length})` },
            { val: 'contactos',es: '📞 Contactar',   en: '📞 Contact' },
          ].map(t => (
            <button key={t.val} onClick={() => setTabActiva(t.val)}
              className={`flex-1 text-xs font-bold py-2.5 rounded-xl border-2 transition-colors cursor-pointer ${tabActiva === t.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-gray-200 text-gray-600'}`}>
              {es ? t.es : t.en}
            </button>
          ))}
        </div>

        {/* ── TAB: INFORMACIÓN ── */}
        {tabActiva === 'info' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-gray-700">{es ? 'Información disponible' : 'Available information'}</h2>
              {(persona.ultima_ubicacion_conocida || persona.ciudad) && (
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400">{es ? 'Última ubicación conocida' : 'Last known location'}</p>
                    <p className="text-sm text-gray-800">{[persona.ultima_ubicacion_conocida, persona.ciudad, persona.estado_region].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
              )}
              {persona.descripcion_fisica && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">{es ? 'Descripción física' : 'Physical description'}</p>
                  <p className="text-sm text-gray-800">{persona.descripcion_fisica}</p>
                </div>
              )}
              {persona.notas_publicas && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">{es ? 'Información adicional' : 'Additional info'}</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{persona.notas_publicas}</p>
                </div>
              )}
              {(persona.fecha_ultima_vez) && (
                <div className="flex items-start gap-2">
                  <Clock size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400">{es ? 'Vista por última vez' : 'Last seen'}</p>
                    <p className="text-sm text-gray-800">{persona.fecha_ultima_vez}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actualizar */}
            <ActualizarPersonaPerfil persona={persona} es={es} onUpdated={(actualizada, evento) => {
              setPersona(actualizada);
              if (evento) setEventos(prev => [{ ...evento, id: `local-${Date.now()}` }, ...prev]);
            }} />

            {/* Acciones rápidas */}
            {esBuscando && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{es ? 'Acciones rápidas' : 'Quick actions'}</h2>
                <Link to={`/reportar-encontrado?persona=${id}`}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3.5 px-4 rounded-2xl text-sm no-underline">
                  ✋ {es ? 'La encontré — reportar hallazgo' : 'I found them — report finding'}
                </Link>
                <Link to={`/pista?persona=${id}`}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3.5 px-4 rounded-2xl text-sm no-underline">
                  💡 {es ? 'Tengo una pista' : 'I have a lead'}
                </Link>
              </div>
            )}

            {/* Compartir */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">{es ? 'Compartir esta ficha' : 'Share this record'}</h2>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={compartir}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                  <Share2 size={13} /> WhatsApp
                </button>
                <button onClick={copiarEnlace}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                  {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copiado ? (es ? 'Copiado' : 'Copied') : (es ? 'Copiar enlace' : 'Copy link')}
                </button>
                <FichaPersonaDescargable persona={persona} es={es} />
              </div>
            </div>

            {/* Suscripción */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-1">🔔 {es ? 'Notificarme si hay novedades' : 'Notify me of updates'}</h2>
              <p className="text-xs text-gray-400 mb-3">{es ? 'Sin cuenta. Tu número no se publica.' : 'No account needed. Your number is not published.'}</p>
              {suscrito ? (
                <p className="text-sm text-green-700 font-semibold">✅ {es ? 'Suscrito.' : 'Subscribed.'}</p>
              ) : (
                <div className="flex gap-2">
                  <input value={telSub} onChange={e => setTelSub(e.target.value)} placeholder="+58..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={suscribirse} disabled={suscribiendo || !telSub.trim()}
                    className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 cursor-pointer">
                    {es ? 'Avisar' : 'Notify'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: HISTORIAL (PASAPORTE) ── */}
        {tabActiva === 'historial' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-purple-600" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {es ? 'Pasaporte de rastreo — historial completo' : 'Tracking passport — full history'}
              </p>
            </div>

            {timelineUnificado.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                {es ? 'Aún no hay eventos registrados.' : 'No events recorded yet.'}
              </div>
            ) : (
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-0">
                  {timelineUnificado.map((e, i) => {
                    const cfg = EVENTO_ICON[e.tipo] || EVENTO_ICON.default;
                    return (
                      <div key={e.id} className="relative flex gap-4 pl-10 pb-4">
                        {/* Dot */}
                        <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full ${cfg.color} flex items-center justify-center text-[7px] flex-shrink-0 border-2 border-white shadow`} />
                        <div className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-2.5 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-[#1A1F2E] leading-snug">{cfg.icon} {e.descripcion}</p>
                          </div>
                          {e.ubicacion && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <MapPin size={9} /> {e.ubicacion}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-300">{tiempoRelativo(e.fecha, es)}</p>
                            {e.fuente && <p className="text-[9px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full">{e.fuente}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-blue-800 font-medium">
                🔒 {es
                  ? 'El historial nunca se borra. Cada actualización queda registrada para garantizar la trazabilidad.'
                  : 'History is never deleted. Every update is recorded to guarantee traceability.'}
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: CONTACTOS ── */}
        {tabActiva === 'contactos' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <p className="text-xs text-amber-800 font-semibold">
                ⚠️ {es
                  ? 'Nunca envíes dinero. Verifica la identidad antes de compartir información personal.'
                  : 'Never send money. Verify identity before sharing personal information.'}
              </p>
            </div>

            {/* Contacto del familiar que busca */}
            {(persona.contacto_nombre || persona.contacto_telefono || persona.contacto_email || persona.contacto_whatsapp) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-gray-700">{es ? 'Familiar que la busca' : 'Family searching for them'}</h2>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-2">
                  {persona.contacto_nombre && <p className="text-sm font-bold text-green-900">{persona.contacto_nombre}</p>}
                  {persona.contacto_telefono && (
                    <a href={`tel:${persona.contacto_telefono}`} className="flex items-center gap-2 text-sm text-green-800 font-semibold no-underline">
                      <Phone size={14} /> {persona.contacto_telefono}
                    </a>
                  )}
                  {persona.contacto_whatsapp && (
                    <a href={`https://wa.me/${persona.contacto_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-green-800 font-semibold no-underline">
                      💬 {persona.contacto_whatsapp}
                    </a>
                  )}
                  {persona.contacto_email && (
                    <a href={`mailto:${persona.contacto_email}`} className="flex items-center gap-2 text-sm text-green-800 font-semibold no-underline">
                      <Mail size={14} /> {persona.contacto_email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Contactos de reportes encontrado */}
            {contactosEncontrado.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-gray-700">
                  {es ? 'Reportes "la encontré" — contactos disponibles' : '"I found them" reports — available contacts'}
                </h2>
                <div className="space-y-2">
                  {contactosEncontrado.map((c, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-bold text-blue-900">{c.nombre}</p>
                      {c.lugar && <p className="text-[10px] text-blue-600 mt-0.5">📍 {c.lugar}</p>}
                      <div className="flex gap-3 mt-1.5">
                        {c.telefono && (
                          <a href={`tel:${c.telefono}`} className="flex items-center gap-1 text-xs text-blue-800 font-semibold no-underline">
                            <Phone size={11} /> {c.telefono}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-blue-800 font-semibold no-underline">
                            <Mail size={11} /> {c.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!persona.contacto_telefono && !persona.contacto_email && contactosEncontrado.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm space-y-3">
                <p className="text-3xl">📞</p>
                <p>{es ? 'No hay datos de contacto disponibles aún.' : 'No contact data available yet.'}</p>
                <Link to={`/reportar-encontrado?persona=${id}`}
                  className="inline-block text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-xl no-underline">
                  {es ? '→ Reportar que la encontré' : '→ Report that I found them'}
                </Link>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center leading-relaxed mt-6 mb-4">
          {es
            ? 'Esta plataforma es una herramienta ciudadana y no partidista. La información proviene de ciudadanos y no ha sido verificada de manera independiente.'
            : 'This platform is a citizen and non-partisan tool. Information comes from citizens and has not been independently verified.'}
        </p>
      </div>
      <Footer />
    </div>
  );
}