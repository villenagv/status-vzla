import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, AlertTriangle, Share2, Copy, Check, ShieldAlert, Loader2, ThumbsUp, Info, Eye, Camera, X, Bell, Users, BarChart2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import GaleriaFotos from '@/components/svzla/GaleriaFotos';
import EstadoOperativo from '@/components/edificio/EstadoOperativo';
import { NubePeligro, ModalSeguridadEdificio, getPreguntaPrioritaria, InfoFaltanteInline } from '@/components/edificio/AlertaSeguridad';
import PersonasEnEdificio from '@/components/edificio/PersonasEnEdificio';
import EdificioImagen from '@/components/svzla/EdificioImagen';
import { useLowBw } from '@/lib/LowBwContext';
import SeoMeta from '@/components/seo/SeoMeta';
import JsonLd, { buildEdificioJsonLd } from '@/components/seo/JsonLd';

const DANO_CONFIG = {
  leve:        { color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F', semaforo: '🟡', label: { es: 'Daño leve',     en: 'Minor damage'   }, acceso: { es: 'Entrada con precaución', en: 'Enter with caution'     } },
  moderado:    { color: '#CA6F1E', bg: '#FEF5E7', border: '#FDEBD0', semaforo: '🟠', label: { es: 'Daño moderado', en: 'Moderate damage' }, acceso: { es: 'Entrada limitada',       en: 'Limited entry'          } },
  grave:       { color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1', semaforo: '🔴', label: { es: 'Daño grave',    en: 'Severe damage'  }, acceso: { es: 'NO ENTRAR',              en: 'DO NOT ENTER'           } },
  critico:     { color: '#922B21', bg: '#FDEDEC', border: '#E74C3C', semaforo: '🔴', label: { es: 'CRÍTICO',       en: 'CRITICAL'       }, acceso: { es: 'NO ENTRAR — PELIGRO',    en: 'DO NOT ENTER — DANGER'  } },
  colapsado:   { color: '#4A0E0E', bg: '#FCECEC', border: '#DC3545', semaforo: '💥', label: { es: 'COLAPSADO',     en: 'COLLAPSED'      }, acceso: { es: 'NO ENTRAR — COLAPSADO',  en: 'DO NOT ENTER — COLLAPSED' } },
  no_evaluado: { color: '#7F8C8D', bg: '#F2F3F4', border: '#BFC9CA', semaforo: '⚪', label: { es: 'Sin evaluar',   en: 'Not evaluated'  }, acceso: { es: 'Sin verificar',          en: 'Unverified'             } },
};

const ACCION_ESTILOS = {
  tengo_actualizacion:          { icon: '🔄', color: '#CA6F1E' },
  confirmo_mismo_estado:        { icon: '✅', color: '#2E7D32' },
  informacion_incorrecta:       { icon: '⚠️', color: '#D4621A' },
  reportar_urgencia:            { icon: '🚨', color: '#C0392B' },
  nuevo_nivel_dano:             { icon: '📍', color: '#2471A3' },
  personas_atrapadas:           { icon: '🆘', color: '#C0392B' },
  persona_herida_recuperada:    { icon: '🩹', color: '#B45309' },
  persona_fallecida_recuperada: { icon: '⚫', color: '#4B5563' },
  riesgo_marcado:               { icon: '💨', color: '#D4621A' },
  estado_cambiado:              { icon: '📋', color: '#555555' },
  verificado:                   { icon: '🏛️', color: '#00838F' },
};
const ACCION_LABELS = {
  tengo_actualizacion:          { es: 'Nueva actualización',           en: 'New update'              },
  confirmo_mismo_estado:        { es: 'Estado confirmado',             en: 'Status confirmed'        },
  informacion_incorrecta:       { es: 'Reportado como incorrecto',     en: 'Reported as incorrect'   },
  reportar_urgencia:            { es: 'Urgencia reportada',            en: 'Urgency reported'        },
  nuevo_nivel_dano:             { es: 'Nivel de daño actualizado',     en: 'Damage level updated'    },
  personas_atrapadas:           { es: 'Personas atrapadas',            en: 'Trapped people'          },
  persona_herida_recuperada:    { es: 'Persona herida recuperada',     en: 'Injured person recovered'},
  persona_fallecida_recuperada: { es: 'Persona fallecida recuperada',  en: 'Deceased recovered'      },
  riesgo_marcado:               { es: 'Riesgo marcado',                en: 'Hazard marked'           },
  estado_cambiado:              { es: 'Estado cambiado',               en: 'Status changed'          },
  verificado:                   { es: 'Verificado por institución',    en: 'Verified by institution' },
};

const TIPO_LABELS = {
  edificio_residencial: '🏠', hospital: '🏥', escuela: '🏫', iglesia: '⛪',
  comercio: '🏪', calle_via: '🛣️', puente: '🌉', servicio_publico: '🔌', otro: '📋',
};

function tiempoRelativo(fecha, es) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return es ? `hace ${d} día${d > 1 ? 's' : ''}` : `${d} day${d > 1 ? 's' : ''} ago`;
  if (h > 0) return es ? `hace ${h} hora${h > 1 ? 's' : ''}` : `${h} hour${h > 1 ? 's' : ''} ago`;
  if (m < 1) return es ? 'ahora mismo' : 'just now';
  return es ? `hace ${m} min` : `${m} min ago`;
}

// ── Semáforo visual ──────────────────────────────────────────────────────────
function Semaforo({ nivel, es, personas_atrapadas }) {
  const cfg = DANO_CONFIG[nivel] || DANO_CONFIG.no_evaluado;
  const noEntrar = ['grave', 'critico', 'colapsado'].includes(nivel);
  return (
    <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: cfg.border }}>
      <div className="flex items-center gap-4 p-4" style={{ background: cfg.bg }}>
        <span className="text-5xl flex-shrink-0">{cfg.semaforo}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>
            {es ? 'Estado del edificio' : 'Building status'}
          </p>
          <p className="text-xl font-black leading-tight" style={{ color: cfg.color }}>{es ? cfg.label.es : cfg.label.en}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: cfg.color }}>
            🚪 {es ? cfg.acceso.es : cfg.acceso.en}
          </p>
        </div>
        {noEntrar && (
          <div className="flex-shrink-0 bg-red-600 text-white text-xs font-black px-3 py-2 rounded-xl text-center leading-tight">
            🚫<br />{es ? 'NO\nENTRAR' : 'DO NOT\nENTER'}
          </div>
        )}
      </div>
      {/* Barra de personas atrapadas si aplica */}
      {(personas_atrapadas === 'si' || personas_atrapadas === 'voces') && (
        <div className="bg-red-600 px-4 py-2 flex items-center gap-2">
          <span className="text-white text-xs font-black">
            🆘 {personas_atrapadas === 'si' ? (es ? '¡PERSONAS ATRAPADAS CONFIRMADO!' : 'TRAPPED PEOPLE CONFIRMED!') : (es ? 'SE ESCUCHAN VOCES / GOLPES' : 'VOICES / KNOCKING HEARD')}
          </span>
        </div>
      )}
    </div>
  );
}

export default function EdificioDetalle() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';
  const pt = lang === 'pt';

  const [edificio, setEdificio] = useState(null);
  const [actualizaciones, setActualizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorId, setErrorId] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [verTodo, setVerTodo] = useState(false);

  // Suscripción
  const [subEmail, setSubEmail] = useState('');
  const [subNombre, setSubNombre] = useState('');
  const [suscrito, setSuscrito] = useState(false);
  const [suscribiendo, setSuscribiendo] = useState(false);

  // Actualización
  const [editando, setEditando] = useState(false);
  const [updateForm, setUpdateForm] = useState({ tipo: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, accesoPie: '', accesoVehiculos: '', desc: '', nombre: '', contacto: '', telefono: '', red_social: '' });
  const [enviando, setEnviando] = useState(false);
  const [updateFotos, setUpdateFotos] = useState([]);
  const [updateOk, setUpdateOk] = useState(false);

  // Solicitudes
  const [solicitudes, setSolicitudes] = useState([]);
  const [modalSeguridad, setModalSeguridad] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [respuestaPrioritaria, setRespuestaPrioritaria] = useState(null);
  const [conozco, setConozco] = useState(null);
  const [respConozco, setRespConozco] = useState({ nombre: '', desc: '' });
  const [enviandoResp, setEnviandoResp] = useState(false);
  const [totalSuscriptores, setTotalSuscriptores] = useState(null);

  useEffect(() => {
    if (!id) { setCargando(false); setErrorId(true); return; }
    base44.entities.ReportesDano.get(id).then(e => {
      if (!e) { setErrorId(true); return; }
      setEdificio(e);
      return Promise.all([
        base44.entities.ActualizacionesSitios.filter({ sitio_id: id }, '-created_date', 50),
        base44.entities.SolicitudesInfoEdificio.filter({ ciudad: e.ciudad, estado_solicitud: 'pendiente' }, '-created_date', 10),
        base44.entities.SuscriptoresSeguimiento.filter({ reporte_id: id, activo: true }, '-created_date', 200),
      ]).then(([ups, ss, subs]) => {
        if (ups) setActualizaciones(ups);
        if (ss) setSolicitudes(ss.filter(s => s.nombre_lugar && !s.reporte_encontrado_id));
        if (subs) setTotalSuscriptores(subs.length);
      });
    }).catch(() => setErrorId(true)).finally(() => setCargando(false));
  }, [id]);

  const suscribirse = async () => {
    if (!subEmail.trim() || !id) return;
    setSuscribiendo(true);
    try {
      const res = await base44.functions.invoke('registrarSuscripcionEdificio', {
        edificio_id: id,
        email: subEmail.trim(),
        nombre: subNombre.trim(),
        lang,
      });
      setSuscrito(true);
      // Actualizar contador local si el backend devuelve el nuevo total
      if (res?.data?.total_suscriptores) {
        setTotalSuscriptores(res.data.total_suscriptores);
      }
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

  const subirUpdateFoto = (file) => {
    // Guardamos el file de inmediato para preview; la subida real ocurre en background al enviar
    const fid = Date.now();
    const previewUrl = URL.createObjectURL(file);
    setUpdateFotos(prev => [...prev, { id: fid, file, previewUrl, url: null, uploading: false }]);
  };

  const handleUpdate = async () => {
    if (!id || !edificio || !updateForm.tipo) return;
    setEnviando(true);

    // ── PASO 1: Envío de datos críticos INMEDIATO (no espera fotos) ──
    try {
      // Incorporar respuesta prioritaria del modal si existe
      const atrapados = respuestaPrioritaria?.atrapados || updateForm.atrapados || edificio.personas_atrapadas || 'no_sabe';
      const nivel = updateForm.nivel || edificio.nivel_dano;
      const prioridad = (nivel === 'critico' || nivel === 'colapsado' || atrapados === 'si' || atrapados === 'voces') ? 'critica' : nivel === 'grave' ? 'alta' : 'normal';

      await base44.entities.ActualizacionesSitios.create({
        sitio_id: id, tipo_sitio: 'edificio', tipo_accion: updateForm.tipo,
        descripcion: updateForm.desc,
        nivel_dano_anterior: edificio.nivel_dano, nivel_dano_nuevo: updateForm.nivel || undefined,
        personas_atrapadas_anterior: edificio.personas_atrapadas, personas_atrapadas_nuevo: atrapados !== edificio.personas_atrapadas ? atrapados : undefined,
        reportante_nombre: updateForm.nombre, reportante_contacto: updateForm.contacto || updateForm.telefono,
        es_sensible: ['persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(updateForm.tipo),
        fuente: 'ciudadano',
      });

      const updateData = {};
      if (updateForm.nivel) updateData.nivel_dano = updateForm.nivel;
      if (atrapados && atrapados !== edificio.personas_atrapadas) updateData.personas_atrapadas = atrapados;
      if (updateForm.gas) updateData.riesgo_gas = true;
      if (updateForm.elect) updateData.riesgo_electrico = true;
      if (updateForm.inc) updateData.riesgo_incendio = true;
      if (updateForm.accesoPie || updateForm.accesoVehiculos) {
        base44.entities.EstadoOperativoEdificio.create({ edificio_id: id, acceso_calle: updateForm.accesoPie || 'no_confirmado', acceso_vehiculos: updateForm.accesoVehiculos || 'no_confirmado', reportante_nombre: updateForm.nombre || undefined, fuente: 'ciudadano' }).catch(() => {});
      }
      updateData.prioridad = prioridad;
      if (updateForm.desc) updateData.descripcion = updateForm.desc;

      const updated = await base44.entities.ReportesDano.update(id, updateData);
      setEdificio(updated);
      setActualizaciones(prev => [{ id: Date.now(), tipo_accion: updateForm.tipo, descripcion: updateForm.desc, nivel_dano_anterior: edificio.nivel_dano, nivel_dano_nuevo: updateForm.nivel, created_date: new Date().toISOString() }, ...prev]);

      // Notificar en background sin bloquear
      base44.functions.invoke('notificarActualizacionEdificio', { edificio_id: id, tipo_accion: updateForm.tipo, nivel_dano: updateForm.nivel || edificio.nivel_dano, direccion: edificio.direccion, nombre_lugar: edificio.nombre_lugar, descripcion: updateForm.desc, reportante_nombre: updateForm.nombre || '', reportante_telefono: updateForm.telefono || '', telefono_contacto: updateForm.contacto || '', lang }).catch(() => {});

      // ── Confirmación inmediata al usuario ──
      setEditando(false);
      setUpdateOk(true);
      setRespuestaPrioritaria(null);
      const fotasPendientes = updateFotos.filter(f => f.file && !f.url);
      const fotasYaSubidas = updateFotos.filter(f => f.url).map(f => f.url);
      setUpdateForm({ tipo: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, accesoPie: '', accesoVehiculos: '', desc: '', nombre: '', contacto: '', telefono: '', red_social: '' });
      setUpdateFotos([]);
      setTimeout(() => setUpdateOk(false), 5000);

      // ── PASO 2: Subida de fotos EN BACKGROUND (no bloquea al usuario) ──
      if (fotasYaSubidas.length > 0 || fotasPendientes.length > 0) {
        const subirFotosBackground = async () => {
          const urlsNuevas = [...fotasYaSubidas];
          for (const f of fotasPendientes) {
            try {
              const { file_url } = await base44.integrations.Core.UploadFile({ file: f.file });
              urlsNuevas.push(file_url);
            } catch {}
          }
          if (urlsNuevas.length > 0) {
            const edificioActual = await base44.entities.ReportesDano.get(id).catch(() => null);
            const fotosActuales = edificioActual?.foto_urls || [];
            const fotosFinal = [...fotosActuales, ...urlsNuevas].slice(0, 5);
            const edActualizado = await base44.entities.ReportesDano.update(id, { foto_urls: fotosFinal }).catch(() => null);
            if (edActualizado) setEdificio(edActualizado);
          }
        };
        subirFotosBackground(); // fire-and-forget
      }

    } catch { alert(es ? 'Error al enviar.' : 'Error sending.'); }
    setEnviando(false);
  };

  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  // Dispara modal de seguridad si es edificio peligroso, o ejecuta la acción directamente
  const conSeguridad = (accion) => {
    if (noEntrar) {
      setAccionPendiente(() => accion);
      setModalSeguridad(true);
    } else {
      accion();
    }
  };

  if (cargando) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-gray-400" size={32} /><p className="text-sm text-gray-400">{t('Cargando ficha...', 'Loading record...', 'Carregando ficha...')}</p></div>
      </div>
    </div>
  );

  if (errorId || !edificio) return (
    <div className="min-h-screen bg-gray-50 flex flex-col"><TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
        <p className="text-5xl">🏗️</p>
        <p className="font-semibold text-gray-700">{t('Edificio no encontrado.', 'Building not found.', 'Edifício não encontrado.')}</p>
        <Link to="/edificios" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold no-underline text-sm">← {t('Volver al directorio', 'Back to directory', 'Voltar ao diretório')}</Link>
      </div>
    </div>
  );

  const noEntrar = ['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano);
  const esCritico = noEntrar || edificio.personas_atrapadas === 'si' || edificio.prioridad === 'critica';
  const totalReportes = actualizaciones.length + 1;
  const reportesPersonas = actualizaciones.filter(a => ['personas_atrapadas', 'persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(a.tipo_accion));
  const reportesAtrapados = reportesPersonas.filter(a => a.tipo_accion === 'personas_atrapadas');
  const reportesHeridos = reportesPersonas.filter(a => a.tipo_accion === 'persona_herida_recuperada');
  const reportesFallecidos = reportesPersonas.filter(a => a.tipo_accion === 'persona_fallecida_recuperada');
  // Urgencias (atrapados/urgencia) primero en el historial
  const actualizacionesOrdenadas = [...actualizaciones].sort((a, b) => {
    const urgA = ['personas_atrapadas', 'reportar_urgencia'].includes(a.tipo_accion) ? 0 : 1;
    const urgB = ['personas_atrapadas', 'reportar_urgencia'].includes(b.tipo_accion) ? 0 : 1;
    if (urgA !== urgB) return urgA - urgB;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  // SEO — construir datos para buscadores e IAs
  const cfg = DANO_CONFIG[edificio.nivel_dano] || DANO_CONFIG.no_evaluado;
  const seoTitle = [
    edificio.nombre_lugar || (es ? 'Edificio' : 'Building'),
    edificio.ciudad,
    `— ${es ? cfg.label.es : cfg.label.en}`,
  ].filter(Boolean).join(' ');
  const seoDesc = [
    `${es ? 'Estado:' : 'Status:'} ${es ? cfg.label.es : cfg.label.en}.`,
    `${es ? 'Acceso:' : 'Access:'} ${es ? cfg.acceso.es : cfg.acceso.en}.`,
    edificio.personas_atrapadas === 'si' ? (es ? '🆘 Personas atrapadas reportadas.' : '🆘 Trapped people reported.') : null,
    edificio.direccion ? `${es ? 'Dirección:' : 'Address:'} ${edificio.direccion}, ${edificio.ciudad || ''}.` : null,
    es ? 'Status Vzla — Plataforma ciudadana de emergencias Venezuela.' : 'Status Vzla — Citizen emergency platform Venezuela.',
  ].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SeoMeta
        title={seoTitle}
        description={seoDesc}
        image={(edificio.foto_urls || [])[0] || undefined}
        url={`https://statusvzla.com/edificio?id=${edificio.id}`}
        type="article"
        lang={lang}
      />
      <JsonLd data={buildEdificioJsonLd(edificio, lang)} />
      <TopBar />
      <ModalSeguridadEdificio
        visible={modalSeguridad}
        es={es}
        preguntaPrioritaria={getPreguntaPrioritaria(edificio)}
        edificioId={id}
        edificio={edificio}
        onRespuestaPrioritaria={(resp) => setRespuestaPrioritaria(resp)}
        onConfirmar={() => { setModalSeguridad(false); if (accionPendiente) { accionPendiente(); setAccionPendiente(null); } }}
        onCerrar={() => { setModalSeguridad(false); setAccionPendiente(null); }}
      />
      <div className="max-w-lg mx-auto w-full px-4 py-5">

        <Link to="/edificios" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Directorio de edificios', 'Buildings directory', 'Diretório de edifícios')}
        </Link>

        {/* ── NUBE LATENTE DE PELIGRO ── */}
        <NubePeligro
          nivel={edificio.nivel_dano}
          personas_atrapadas={edificio.personas_atrapadas}
          sinFoto={!edificio.foto_urls?.length}
          es={es}
        />

        {/* ── 1. ENCABEZADO CON FOTO DE PORTADA ── */}
        <div className={`bg-white rounded-2xl overflow-hidden mb-3 border-2 ${esCritico ? 'border-red-300' : 'border-gray-200'}`}>
          {/* Foto de portada en la cabecera */}
          <EdificioImagen
            fotoUrls={edificio.foto_urls || []}
            tipoEstructura={edificio.tipo_estructura}
            nivelDano={edificio.nivel_dano}
            height={260}
            lang={lang}
            sinFotoNudge
            mostrarMiniaturasExtra
          />
          <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{TIPO_LABELS[edificio.tipo_estructura] || '🏗️'}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('Ficha de edificio', 'Building record', 'Ficha de edifício')}</p>
                  <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {edificio.nombre_lugar || edificio.tipo_estructura?.replace(/_/g, ' ') || t('Edificio sin nombre', 'Unnamed building', 'Edifício sem nome')}
                  </h1>
                </div>
              </div>
              {edificio.tipo_estructura && (
                <p className="text-[11px] text-gray-500 capitalize ml-9">{edificio.tipo_estructura.replace(/_/g, ' ')}</p>
              )}
              {(edificio.direccion || edificio.ciudad) && (
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <MapPin size={10} className="flex-shrink-0 text-gray-400" />
                  {[edificio.direccion, edificio.ciudad, edificio.estado_region].filter(Boolean).join(' · ')}
                </p>
              )}
              {/* Acceso vial */}
              {edificio.acceso_calle && edificio.acceso_calle !== 'no_verificado' && (
                <p className="text-xs mt-1 flex items-center gap-1">
                  {{
                    normal:        <span className="font-semibold text-green-700">✅ {t('Calle libre', 'Street clear', 'Rua livre')}</span>,
                    dificultad:    <span className="font-semibold text-yellow-700">⚠️ {t('Acceso con dificultad', 'Access with difficulty', 'Acesso com dificuldade')}</span>,
                    solo_peatonal: <span className="font-semibold text-orange-700">🚶 {t('Solo a pie', 'On foot only', 'Somente a pé')}</span>,
                    bloqueada:     <span className="font-semibold text-red-700">🚫 {t('Calle bloqueada', 'Street blocked', 'Rua bloqueada')}</span>,
                    insegura:      <span className="font-semibold text-red-900">☠️ {t('Vía insegura', 'Dangerous road', 'Via perigosa')}</span>,
                    no_sabe:       <span className="font-semibold text-gray-500">❓ {t('Acceso no confirmado', 'Access unknown', 'Acesso desconhecido')}</span>,
                  }[edificio.acceso_calle] || null}
                </p>
              )}
            </div>
            {/* Métricas rápidas */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                <BarChart2 size={12} />{totalReportes} {t('reportes', 'reports', 'relatórios')}
              </div>
              {totalSuscriptores !== null && totalSuscriptores > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                  <Bell size={10} />{totalSuscriptores} {t('siguiendo', 'following', 'seguindo')}
                </div>
              )}
              <p className="text-[10px] text-gray-500">🕐 {tiempoRelativo(edificio.updated_date || edificio.created_date, es)}</p>
              {edificio.nivel_verificacion === 'institucional' && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield size={8} /> {t('Verificado', 'Verified', 'Verificado')}
                </span>
              )}
            </div>
          </div>

          {/* Semáforo siempre visible */}
          <Semaforo nivel={edificio.nivel_dano} es={es} personas_atrapadas={edificio.personas_atrapadas} />

          {/* Riesgos activos */}
          {(edificio.riesgo_gas || edificio.riesgo_electrico || edificio.riesgo_incendio || edificio.riesgo_colapso) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {edificio.riesgo_gas       && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full border border-orange-200 font-semibold">💨 {t('Gas', 'Gas', 'Gás')}</span>}
              {edificio.riesgo_electrico && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200 font-semibold">⚡ {t('Eléctrico', 'Electrical', 'Elétrico')}</span>}
              {edificio.riesgo_incendio  && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200 font-semibold">🔥 {t('Incendio', 'Fire', 'Incêndio')}</span>}
              {edificio.riesgo_colapso   && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full border border-gray-300 font-semibold">💥 {t('Colapso', 'Collapse', 'Colapso')}</span>}
            </div>
          )}

          {/* Resumen contadores personas */}
          {(reportesAtrapados.length > 0 || reportesHeridos.length > 0 || reportesFallecidos.length > 0) && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className={`text-center p-2 rounded-xl border ${reportesAtrapados.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-base font-black text-red-700">{reportesAtrapados.length}</p>
                <p className="text-[9px] text-red-600 leading-tight">{t('Atrapados', 'Trapped', 'Presos')}</p>
              </div>
              <div className={`text-center p-2 rounded-xl border ${reportesHeridos.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-base font-black text-amber-700">{reportesHeridos.length}</p>
                <p className="text-[9px] text-amber-600 leading-tight">{t('Heridos recup.', 'Injured recov.', 'Feridos recup.')}</p>
              </div>
              <div className="text-center p-2 rounded-xl border bg-gray-50 border-gray-100">
                <p className="text-base font-black text-gray-700">{reportesFallecidos.length}</p>
                <p className="text-[9px] text-gray-500 leading-tight">{t('Fallecidos recup.', 'Deceased recov.', 'Falecidos recup.')}</p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Guía de seguridad — acceso contextual */}
        <Link to="/guia-edificios"
          className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 mb-3 no-underline">
          <span className="text-base">📖</span>
          <span className="text-xs font-semibold text-gray-700 flex-1">
            {t('¿No sabes qué significa el nivel de daño?', "Don't know what the damage level means?", 'Não sabe o que significa o nível de dano?')}
          </span>
          <span className="text-xs text-blue-600 font-bold flex-shrink-0">
            {t('Ver guía →', 'See guide →', 'Ver guia →')}
          </span>
        </Link>

        {/* ── 2. ALERTA NO ENTRAR ── */}
        {noEntrar && (
          <div className="flex gap-3 bg-red-50 border-2 border-red-400 rounded-2xl p-4 mb-3">
            <ShieldAlert size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-800">🚫 {t('¡NO ENTRAR! Estructura NO SEGURA.', 'DO NOT ENTER! Structure NOT SAFE.', 'NÃO ENTRE! Estrutura NÃO SEGURA.')}</p>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                {t('Espera a Protección Civil (171), Bomberos o rescatistas autorizados.',
                   'Wait for Civil Protection (171), Firefighters or authorized rescue teams.',
                   'Aguarde Proteção Civil (171), Bombeiros ou equipes de resgate autorizadas.')}
              </p>
            </div>
          </div>
        )}

        {/* ── INFO FALTANTE: bloque amarillo siempre visible en ficha si hay campos incompletos ── */}
        {edificio && (() => {
          const faltante = [];
          if (!edificio.personas_atrapadas || edificio.personas_atrapadas === 'no_sabe') faltante.push('atrapados');
          if (!edificio.acceso_calle || edificio.acceso_calle === 'no_sabe' || edificio.acceso_calle === 'no_verificado') faltante.push('acceso_calle');
          if (!edificio.gas || edificio.gas === 'no_confirmado') faltante.push('gas');
          if (!edificio.electricidad || edificio.electricidad === 'no_confirmado') faltante.push('electricidad');
          if (!edificio.agua || edificio.agua === 'no_confirmado') faltante.push('agua');
          if (!edificio.foto_urls?.length) faltante.push('foto');
          return faltante.length > 0 ? (
            <InfoFaltanteInline
              edificio={edificio}
              edificioId={id}
              es={es}
              faltante={faltante}
              onDatoGuardado={(data) => setEdificio(prev => ({ ...prev, ...data }))}
            />
          ) : null;
        })()}

        {/* ── 3. ANTI-EXTORSIÓN ── */}
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {t('Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.',
               'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.',
               'Nunca envie dinheiro em troca de informações. Esta plataforma não autoriza pagamentos nem resgates privados.')}
          </p>
        </div>

        {/* ── 4. DATOS DE UBICACIÓN ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">📍 {t('Ubicación y descripción', 'Location & description', 'Localização e descrição')}</p>
          <div className="space-y-2">
            {edificio.direccion && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span>{edificio.direccion}{edificio.ciudad ? ` · ${edificio.ciudad}` : ''}{edificio.estado_region ? `, ${edificio.estado_region}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} className="flex-shrink-0" />
            <span>{t('Reportado', 'Reported', 'Reportado')} {tiempoRelativo(edificio.created_date, es)}</span>
            {edificio.fuente && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{edificio.fuente}</span>}
            </div>
            {edificio.nivel_verificacion && (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  edificio.nivel_verificacion === 'institucional' ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : edificio.nivel_verificacion === 'comunidad' ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {edificio.nivel_verificacion === 'institucional' ? '🛡️ ' : '👥 '}
                  {edificio.nivel_verificacion === 'institucional' ? t('Verificado institucionalmente', 'Institutionally verified', 'Verificado institucionalmente')
                    : edificio.nivel_verificacion === 'comunidad' ? t('Reportado por comunidad', 'Community report', 'Relatório comunitário')
                    : t('Sin verificar', 'Unverified', 'Sem verificar')}
                </span>
              </div>
            )}
            {edificio.descripcion && (
              <p className="text-sm text-gray-700 pt-2 border-t border-gray-100 leading-relaxed">{edificio.descripcion}</p>
            )}
          </div>
        </div>

        {/* ── 5. ESTADO OPERATIVO (servicios, acceso, racionamiento) ── */}
        <EstadoOperativo edificioId={id} es={es} />

        {/* ── 6. (Foto de portada ya está en bloque #1 arriba) ── */}

        {/* ── 7. HISTORIAL DE ACTUALIZACIONES ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
          <div className="flex items-center mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">🕐 {t('Historial de actualizaciones e información', 'Update history & info', 'Histórico de atualizações')}{actualizaciones.length > 0 ? ` (${actualizaciones.length})` : ''}</h2>
          </div>
          {actualizaciones.length === 0 ? (
            <p className="text-xs text-gray-400 italic">{t('Sin actualizaciones registradas aún. Sé el primero en reportar.', 'No updates recorded yet. Be the first to report.', 'Sem atualizações registradas ainda. Seja o primeiro a reportar.')}</p>
          ) : (
          <div className="space-y-2">
            {actualizacionesOrdenadas.map((a) => {
              const s = ACCION_ESTILOS[a.tipo_accion] || { icon: '📋', color: '#555' };
              const lbl = ACCION_LABELS[a.tipo_accion];
              const esUrgente = ['personas_atrapadas', 'reportar_urgencia'].includes(a.tipo_accion);
              return (
                <div key={a.id} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: s.color }} />
                  <div className={`flex-1 border rounded-xl px-3 py-2 ${esUrgente ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <span>{s.icon}</span>
                        <p className="text-xs font-semibold" style={{ color: s.color }}>{lbl ? (es ? lbl.es : lbl.en) : a.tipo_accion}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{tiempoRelativo(a.created_date, es)}</span>
                    </div>
                    {a.descripcion && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{a.descripcion}</p>}
                    {a.nivel_dano_anterior && a.nivel_dano_nuevo && a.nivel_dano_anterior !== a.nivel_dano_nuevo && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {t('Daño:', 'Damage:', 'Dano:')} {a.nivel_dano_anterior} → <strong className="text-gray-700">{a.nivel_dano_nuevo}</strong>
                      </p>
                    )}
                    {a.reportante_nombre && (
                      <p className="text-[10px] text-gray-500 mt-0.5">👤 {a.reportante_nombre}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* ── 8. PERSONAS REPORTADAS EN EL SITIO ── */}
        {reportesPersonas.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">👥 {t('Personas reportadas en este sitio', 'People reported at this site', 'Pessoas reportadas neste local')}</p>
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
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 leading-relaxed">
              ⚠️ {t('No publiques nombres, documentos ni datos médicos sensibles.', 'Do not publish names, IDs, or sensitive medical details.', 'Não publique nomes, documentos ou dados médicos sensíveis.')}
            </p>
          </div>
        )}

        {/* ── 8b. PERSONAS EN EL EDIFICIO — registro individual ── */}
        <PersonasEnEdificio edificioId={id} edificio={edificio} es={es} />

        {/* ── 9. BOTONES DE ACCIÓN ── */}
        {updateOk && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-center">
            <p className="text-sm font-bold text-green-700">✅ {t('¡Actualización enviada! Gracias por ayudar.', 'Update sent! Thank you for helping.', 'Atualização enviada! Obrigado por ajudar.')}</p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 mb-4">
          <button onClick={() => conSeguridad(() => { setEditando(v => !v); setUpdateOk(false); })}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl cursor-pointer text-sm transition-colors">
            <Eye size={15} /> {t('Agregar actualización sobre este edificio', 'Add an update about this building', 'Adicionar atualização sobre este edifício')}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => conSeguridad(confirmarIgual)}
              className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-2xl cursor-pointer text-xs transition-colors">
              <ThumbsUp size={13} /> {t('Sigue igual', 'Still the same', 'Continua igual')}
            </button>
            <button onClick={() => conSeguridad(() => { setUpdateForm(f => ({ ...f, tipo: 'informacion_incorrecta' })); setEditando(true); })}
              className="flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-2xl cursor-pointer text-xs transition-colors">
              <Info size={13} /> {t('Info incorrecta', 'Wrong info', 'Info incorreta')}
            </button>
          </div>
        </div>

        {/* ── FORMULARIO ACTUALIZACIÓN ── */}
        {editando && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">✏️ {t('Tu actualización', 'Your update', 'Sua atualização')}</h2>
              <button onClick={() => setEditando(false)} className="text-xs text-gray-400 underline cursor-pointer">{t('Cancelar', 'Cancel', 'Cancelar')}</button>
            </div>

            {/* Tipo */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">{t('¿Qué tipo de actualización es?', 'What type of update?', 'Que tipo de atualização?')} <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: 'tengo_actualizacion',          es: '🔄 Tengo info nueva',         en: '🔄 New info'              },
                  { val: 'reportar_urgencia',            es: '🚨 Urgencia',                  en: '🚨 Emergency'             },
                  { val: 'personas_atrapadas',           es: '🆘 Hay atrapados',             en: '🆘 Trapped'               },
                  { val: 'persona_herida_recuperada',    es: '🩹 Recuperaron herido',        en: '🩹 Injured recovered'      },
                  { val: 'persona_fallecida_recuperada', es: '⚫ Recuperaron fallecido',     en: '⚫ Deceased recovered'     },
                  { val: 'riesgo_marcado',               es: '💨 Nuevo riesgo',              en: '💨 New hazard'             },
                ].map(tb => (
                  <button key={tb.val} onClick={() => setUpdateForm(f => ({ ...f, tipo: tb.val }))}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors text-left ${updateForm.tipo === tb.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                    {es ? tb.es : tb.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel daño */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('Nivel de daño actual (si cambió)', 'Current damage level (if changed)', 'Nível de dano atual (se mudou)')}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[{ val: 'leve', es: '🟡 Leve', en: '🟡 Minor' }, { val: 'moderado', es: '🟠 Moderado', en: '🟠 Moderate' }, { val: 'grave', es: '🔴 Grave', en: '🔴 Severe' }, { val: 'critico', es: '🔴 Crítico', en: '🔴 Critical' }, { val: 'colapsado', es: '💥 Colapsado', en: '💥 Collapsed' }, { val: '', es: '— Sin cambio', en: '— No change' }].map(n => (
                  <button key={n.val} onClick={() => setUpdateForm(f => ({ ...f, nivel: n.val }))}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.nivel === n.val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {es ? n.es : n.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Atrapados */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">{t('¿Personas atrapadas?', 'Trapped people?', 'Pessoas presas?')}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ val: 'si', es: '🚨 Sí', en: '🚨 Yes' }, { val: 'voces', es: '👂 Voces/golpes', en: '👂 Voices/knocks' }, { val: 'no', es: '✅ No', en: '✅ No' }, { val: 'no_sabe', es: '❓ No sé', en: '❓ Unknown' }].map(a => (
                  <button key={a.val} onClick={() => setUpdateForm(f => ({ ...f, atrapados: a.val }))}
                    className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${updateForm.atrapados === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {es ? a.es : a.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Acceso a pie */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">🚶 {t('¿Cómo está la calle / acceso a pie?', 'How is the street / foot access?', 'Como está a rua / acesso a pé?')}</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { val: 'normal',        es: '✅ Paso libre — sin problemas',          en: '✅ Clear — no issues'            },
                  { val: 'dificultad',    es: '⚠️ Se puede pasar, con dificultad',      en: '⚠️ Passable with difficulty'     },
                  { val: 'solo_peatonal', es: '🚶 Solo a pie — vehículos no pasan',     en: '🚶 On foot only — no vehicles'   },
                  { val: 'bloqueada',     es: '🚫 Calle bloqueada',                     en: '🚫 Blocked — cannot pass'        },
                  { val: 'insegura',      es: '☠️ Peligrosa — no intentes pasar',       en: '☠️ Dangerous — do not attempt'   },
                ].map(a => (
                  <button key={a.val} onClick={() => setUpdateForm(f => ({ ...f, accesoPie: f.accesoPie === a.val ? '' : a.val }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${updateForm.accesoPie === a.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {es ? a.es : a.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Riesgos */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">⚠️ {t('¿Hay alguno de estos riesgos?', 'Are any of these hazards present?', 'Há algum desses riscos?')}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[{ k: 'gas', icon: '💨', es: 'Olor a gas', en: 'Gas smell' }, { k: 'elect', icon: '⚡', es: 'Cables caídos', en: 'Fallen wires' }, { k: 'inc', icon: '🔥', es: 'Fuego / humo', en: 'Fire / smoke' }].map(r => (
                  <button key={r.k} onClick={() => setUpdateForm(f => ({ ...f, [r.k]: !f[r.k] }))}
                    className={`py-2.5 px-1 rounded-xl text-xs font-semibold border cursor-pointer text-center ${updateForm[r.k] ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    {r.icon} {es ? r.es : r.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <textarea rows={2} value={updateForm.desc} onChange={e => setUpdateForm(f => ({ ...f, desc: e.target.value }))}
              placeholder={['persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(updateForm.tipo)
                ? t('Describe sin datos sensibles: cuántas personas, quién las recuperó...', 'Describe without sensitive details: how many people, who recovered them...', 'Descreva sem dados sensíveis: quantas pessoas, quem as recuperou...')
                : t('Describe lo que viste o sabes...', 'Describe what you saw or know...', 'Descreva o que você viu ou sabe...')}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />

            {/* Datos contacto */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-gray-500">🔒 {t('Tus datos (privados, no se publican)', 'Your info (private, not published)', 'Seus dados (privados, não publicados)')}</p>
              <input value={updateForm.nombre}   onChange={e => setUpdateForm(f => ({ ...f, nombre: e.target.value }))}   placeholder={t('Nombre (opcional)', 'Name (optional)', 'Nome (opcional)')}   className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <input value={updateForm.telefono} onChange={e => setUpdateForm(f => ({ ...f, telefono: e.target.value }))} placeholder={t('Teléfono / WhatsApp (opcional)', 'Phone / WhatsApp (optional)', 'Telefone / WhatsApp (opcional)')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <input value={updateForm.contacto} onChange={e => setUpdateForm(f => ({ ...f, contacto: e.target.value }))} placeholder={t('Email (opcional)', 'Email (optional)', 'Email (opcional)')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            {/* Fotos */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">📷 {t('Fotos (opcional, desde lugar seguro)', 'Photos (optional, from safe location)', 'Fotos (opcional, de lugar seguro)')}</p>
              <div className="flex flex-wrap gap-2">
                {updateFotos.map(f => (
                  <div key={f.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {(f.previewUrl || f.url) && <img src={f.previewUrl || f.url} alt="" className="w-full h-full object-cover" />}
                    <button onClick={() => setUpdateFotos(p => p.filter(x => x.id !== f.id))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={8} /></button>
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

            <button onClick={handleUpdate} disabled={enviando || !updateForm.tipo}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3.5 rounded-2xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 transition-colors">
              {enviando ? <Loader2 className="animate-spin" size={15} /> : '📡'} {t('Enviar actualización', 'Send update', 'Enviar atualização')}
            </button>
            {updateFotos.length > 0 && (
              <p className="text-[10px] text-gray-400 text-center mt-1">
                📷 {t('Las fotos se subirán automáticamente en segundo plano.', 'Photos will upload automatically in the background.', 'As fotos serão enviadas em segundo plano.')}
              </p>
            )}
          </div>
        )}

        {/* ── 10. SUSCRIPCIÓN ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={14} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800">{t('Recibir actualizaciones por email', 'Get email updates', 'Receber atualizações por email')}</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {t('Te avisamos si cambia el estado, hay nueva información o reportan personas. Sin cuenta necesaria.',
               'We notify you if the status changes, there is new info, or people are reported. No account needed.',
               'Avisamos se o status mudar, houver nova informação ou pessoas reportadas. Sem conta necessária.')}
          </p>
          {totalSuscriptores !== null && totalSuscriptores > 0 && !suscrito && (
            <p className="text-[11px] text-blue-600 font-semibold mb-2">
              👥 {totalSuscriptores} {t('persona(s) esperando actualizaciones', 'person(s) waiting for updates', 'pessoa(s) aguardando atualizações')}
            </p>
          )}
          {suscrito ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
              <p className="text-sm font-bold text-green-700">✅ {t('¡Suscrito! Te avisaremos por email.', 'Subscribed! We will notify you by email.', 'Inscrito! Te avisaremos por email.')}</p>
              <p className="text-xs text-green-600">
                {t('Para seguir múltiples edificios, crea una cuenta gratuita.', 'To follow multiple buildings, create a free account.', 'Para seguir múltiplos edifícios, crie uma conta gratuita.')}
              </p>
              <Link to="/register" className="inline-block text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg no-underline transition-colors">
                {t('Crear cuenta →', 'Create account →', 'Criar conta →')}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <input value={subNombre} onChange={e => setSubNombre(e.target.value)} placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <div className="flex gap-2">
                <input value={subEmail} onChange={e => setSubEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && suscribirse()} placeholder={t('Tu email...', 'Your email...', 'Seu email...')} className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                <button onClick={suscribirse} disabled={suscribiendo || !subEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40 cursor-pointer transition-colors flex items-center gap-1.5">
                  {suscribiendo ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                  {t('Avisarme', 'Notify me', 'Me avisar')}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                🔒 {t('Tu email no se muestra públicamente. Sin spam.', 'Your email is not shown publicly. No spam.', 'Seu email não é exibido publicamente. Sem spam.')}
              </p>
            </div>
          )}
        </div>

        {/* ── 11. ¿CONOCES ESTE EDIFICIO? ── */}
        {solicitudes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-2">
              <Users size={14} className="text-purple-700 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-800">{t('Vecinos buscando información', 'Neighbors looking for info', 'Vizinhos buscam informações')}</p>
                <p className="text-[11px] text-purple-600">{t('¿Conoces alguno de estos edificios en la zona?', 'Do you know any of these buildings in the area?', 'Você conhece algum destes edifícios na área?')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {solicitudes.slice(0, 3).map(s => (
                <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.nombre_lugar}</p>
                      <p className="text-xs text-gray-500">📍 {s.direccion || t('Sin dirección', 'No address', 'Sem endereço')} · {s.ciudad}</p>
                    </div>
                    <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">{t('Sin datos', 'No data', 'Sem dados')}</span>
                  </div>
                  {conozco === s.id ? (
                    <div className="space-y-2 pt-2 border-t border-amber-200">
                      <textarea rows={2} value={respConozco.desc} onChange={e => setRespConozco(p => ({ ...p, desc: e.target.value }))}
                        placeholder={t('Cuéntanos qué sabes...', 'Tell us what you know...', 'Conte-nos o que você sabe...')}
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm resize-none placeholder-gray-400 focus:outline-none" />
                      <input value={respConozco.nombre} onChange={e => setRespConozco(p => ({ ...p, nombre: e.target.value }))}
                        placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')}
                        className="w-full border border-amber-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:outline-none" />
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          setEnviandoResp(true);
                          try {
                            await base44.entities.ActualizacionesSitios.create({ sitio_id: s.id, tipo_sitio: 'edificio', tipo_accion: 'tengo_actualizacion', descripcion: respConozco.desc || t('Ciudadano conoce este edificio', 'Citizen knows this building', 'Cidadão conhece este edifício'), reportante_nombre: respConozco.nombre, fuente: 'ciudadano' });
                            setSolicitudes(prev => prev.filter(x => x.id !== s.id));
                          } catch {}
                          setEnviandoResp(false); setConozco(null); setRespConozco({ nombre: '', desc: '' });
                        }} disabled={enviandoResp}
                          className="flex-1 bg-purple-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-40 cursor-pointer">
                          {enviandoResp ? <Loader2 className="animate-spin inline" size={13} /> : '📨'} {t('Aportar información', 'Share info', 'Compartilhar informação')}
                        </button>
                        <button onClick={() => setConozco(null)} className="text-xs text-gray-400 underline cursor-pointer">{t('Cancelar', 'Cancel', 'Cancelar')}</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConozco(s.id)} className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl cursor-pointer transition-colors">
                      👁️ {t('Yo conozco este edificio', 'I know this building', 'Eu conheço este edifício')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 12. COMPARTIR ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t('Compartir esta ficha', 'Share this record', 'Compartilhar esta ficha')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={compartir} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition-colors">
              <Share2 size={13} /> WhatsApp
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-xs font-bold py-3 rounded-xl cursor-pointer transition-colors">
              {copiado ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copiado ? t('Copiado', 'Copied', 'Copiado') : t('Copiar enlace', 'Copy link', 'Copiar link')}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-gray-500 text-center leading-relaxed mb-4">
          {t('Esta plataforma es una herramienta ciudadana y no partidista. La información proviene de ciudadanos y no ha sido verificada de manera independiente.',
             'This platform is a citizen and non-partisan tool. Information comes from citizens and has not been independently verified.',
             'Esta plataforma é uma ferramenta cidadã e apartidária. As informações vêm de cidadãos e não foram verificadas de forma independente.')}
        </p>

      </div>
      <Footer />
    </div>
  );
}