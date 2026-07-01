import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, AlertTriangle, Share2, Copy, Check, ShieldAlert, Loader2, ThumbsUp, Info, Eye, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import EstadoOperativo from '@/components/edificio/EstadoOperativo';
import { NubePeligro, ModalSeguridadEdificio, getPreguntaPrioritaria, InfoFaltanteInline } from '@/components/edificio/AlertaSeguridad';
import PersonasEnEdificio from '@/components/edificio/PersonasEnEdificio';
import MascotasEnEdificio from '@/components/edificio/MascotasEnEdificio';
import PanelRescateInline from '@/components/edificio/PanelRescateInline';
import HistorialGestion from '@/components/edificio/HistorialGestion';
import GaleriaTecnicaInspeccion from '@/components/edificio/GaleriaTecnicaInspeccion';
import AlertaBuscaInspector from '@/components/edificio/AlertaBuscaInspector';
import { useLowBw } from '@/lib/LowBwContext';
import SeoMeta from '@/components/seo/SeoMeta';
import JsonLd, { buildEdificioJsonLd } from '@/components/seo/JsonLd';
import { DANO_CONFIG, tiempoRelativo } from '@/components/edificio/edificioDetalleConfig';
import EdificioHeader from '@/components/edificio/EdificioHeader';
import HistorialActualizaciones from '@/components/edificio/HistorialActualizaciones';
import PersonasReportadasSitio from '@/components/edificio/PersonasReportadasSitio';
import FormularioActualizacionEdificio from '@/components/edificio/FormularioActualizacionEdificio';
import SuscripcionEdificio from '@/components/edificio/SuscripcionEdificio';
import VecinosBuscandoInfo from '@/components/edificio/VecinosBuscandoInfo';

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
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F2F5' }}><TopBar />
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3"><Loader2 className="animate-spin text-gray-400" size={32} /><p className="text-sm text-gray-400">{t('Cargando ficha...', 'Loading record...', 'Carregando ficha...')}</p></div>
      </div>
    </div>
  );

  if (errorId || !edificio) return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F2F5' }}><TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
        <p className="text-5xl">🏗️</p>
        <p className="font-semibold text-gray-700">{t('Edificio no encontrado.', 'Building not found.', 'Edifício não encontrado.')}</p>
        <Link to="/edificios" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold no-underline text-sm">← {t('Volver al directorio', 'Back to directory', 'Voltar ao diretório')}</Link>
      </div>
    </div>
  );

  const noEntrar = ['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano);
  const esCritico = noEntrar || edificio.personas_atrapadas === 'si' || edificio.prioridad === 'critica';
  // Excluimos notas de especialista del historial ciudadano — se muestran en HistorialGestion
  const actualizacionesCiudadanas = actualizaciones.filter(a => a.fuente !== 'especialista');
  const totalReportes = actualizaciones.length + 1;
  const reportesPersonas = actualizaciones.filter(a => ['personas_atrapadas', 'persona_herida_recuperada', 'persona_fallecida_recuperada'].includes(a.tipo_accion));
  const reportesAtrapados = reportesPersonas.filter(a => a.tipo_accion === 'personas_atrapadas');
  const reportesHeridos = reportesPersonas.filter(a => a.tipo_accion === 'persona_herida_recuperada');
  const reportesFallecidos = reportesPersonas.filter(a => a.tipo_accion === 'persona_fallecida_recuperada');
  // Urgencias (atrapados/urgencia) primero en el historial
  const actualizacionesOrdenadas = [...actualizacionesCiudadanas].sort((a, b) => {
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
    <div className="min-h-screen flex flex-col" style={{ background: '#F1F2F5' }}>
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
        <EdificioHeader
          edificio={edificio} id={id} es={es} t={t} lang={lang} esCritico={esCritico}
          totalReportes={totalReportes} totalSuscriptores={totalSuscriptores}
          reportesAtrapados={reportesAtrapados} reportesHeridos={reportesHeridos} reportesFallecidos={reportesFallecidos}
        />

        {/* ── ALERTA: SE BUSCA INSPECTOR (triaje pidió inspección presencial) ── */}
        <AlertaBuscaInspector edificio={edificio} es={es} />

        {/* ── PANEL RESCATE INLINE — justo antes de la guía de daños ── */}
        <PanelRescateInline
          edificioId={id}
          edificio={edificio}
          es={es}
          onGuardado={() => setEdificio(prev => ({ ...prev }))}
        />

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
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#4B5563', flexShrink: 0 }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>📍 {t('Ubicación y descripción', 'Location & description', 'Localização e descrição')}</p>
          </div>
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  edificio.nivel_verificacion === 'institucional' ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : edificio.nivel_verificacion === 'comunidad' ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {edificio.nivel_verificacion === 'institucional' ? '🛡️ ' : '👥 '}
                  {edificio.nivel_verificacion === 'institucional' ? t('Verificado institucionalmente', 'Institutionally verified', 'Verificado institucionalmente')
                    : edificio.nivel_verificacion === 'comunidad' ? t('Reportado por comunidad', 'Community report', 'Relatório comunitário')
                    : t('Sin verificar', 'Unverified', 'Sem verificar')}
                </span>
                {/* Badge auto-reportado: visible cuando viene de base de datos y no tiene inspección */}
                {edificio.fuente && edificio.fuente !== 'web_publica' && edificio.fuente !== 'ciudadano' && edificio.triage_estado !== 'inspeccionado' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                    🗃️ {t('Estado auto-reportado (base de datos)', 'Auto-reported status (database)', 'Estado auto-reportado (banco de dados)')}
                  </span>
                )}
              </div>
            )}
            {/* Banner informativo cuando el estado viene de importación y no hay inspección presencial */}
            {edificio.fuente && edificio.fuente !== 'web_publica' && edificio.fuente !== 'ciudadano' && edificio.triage_estado !== 'inspeccionado' && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="text-amber-500 text-base flex-shrink-0">⚠️</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>{t('Datos importados de base de datos.', 'Data imported from database.', 'Dados importados de banco de dados.')}</strong>{' '}
                  {t(
                    'Este estado fue cargado automáticamente y no ha sido verificado con una inspección presencial.',
                    'This status was automatically loaded and has not been verified by an on-site inspection.',
                    'Este estado foi carregado automaticamente e não foi verificado por uma inspeção presencial.'
                  )}
                </p>
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

        {/* ── 6b. HISTORIAL DE GESTIÓN E INSPECCIONES ── */}
        <HistorialGestion edificio={edificio} es={es} />

        {/* ── 6c. GALERÍA TÉCNICA DE INSPECCIÓN — fotos por área + resto del edificio ── */}
        <GaleriaTecnicaInspeccion edificio={edificio} es={es} />

        {/* ── 7. HISTORIAL DE ACTUALIZACIONES CIUDADANAS ── */}
        <HistorialActualizaciones actualizacionesCiudadanas={actualizacionesCiudadanas} actualizacionesOrdenadas={actualizacionesOrdenadas} es={es} t={t} />

        {/* ── 8. PERSONAS REPORTADAS EN EL SITIO ── */}
        <PersonasReportadasSitio reportesPersonas={reportesPersonas} es={es} t={t} />

        {/* ── 8b. PERSONAS EN EL EDIFICIO — registro individual ── */}
        <PersonasEnEdificio edificioId={id} edificio={edificio} es={es} />

        {/* ── 8c. MASCOTAS EN EL EDIFICIO ── */}
        <MascotasEnEdificio edificioId={id} edificio={edificio} es={es} />

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
          <Link to={`/solicitar-inspeccion?edificio=${id}`}
            className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-2xl cursor-pointer text-sm transition-colors no-underline">
            📸 {t('Pedir inspección de este edificio', 'Request an inspection of this building', 'Pedir inspeção deste edifício')}
          </Link>
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
          <FormularioActualizacionEdificio
            updateForm={updateForm} setUpdateForm={setUpdateForm}
            updateFotos={updateFotos} setUpdateFotos={setUpdateFotos}
            subirUpdateFoto={subirUpdateFoto} handleUpdate={handleUpdate}
            enviando={enviando} setEditando={setEditando} es={es} t={t}
          />
        )}

        {/* ── 10. SUSCRIPCIÓN ── */}
        <SuscripcionEdificio
          subNombre={subNombre} setSubNombre={setSubNombre}
          subEmail={subEmail} setSubEmail={setSubEmail}
          suscribiendo={suscribiendo} suscribirse={suscribirse}
          suscrito={suscrito} totalSuscriptores={totalSuscriptores} t={t}
        />

        {/* ── 11. ¿CONOCES ESTE EDIFICIO? ── */}
        <VecinosBuscandoInfo solicitudes={solicitudes} setSolicitudes={setSolicitudes} t={t} />

        {/* ── 12. COMPARTIR ── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#15803D', flexShrink: 0 }} />
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{t('Compartir esta ficha', 'Share this record', 'Compartilhar esta ficha')}</p>
          </div>
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

        {/* ── BANNER CAMPAÑA: Ayúdanos a actualizar ── */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg,#0D2B6B 0%,#1A3A8F 50%,#0D2B6B 100%)', border: '2px solid #D48C2E' }}>
          <div className="p-5 text-center">
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#F59E0B' }}>
              📢 {t('Ayúdanos a actualizar la información', 'Help us update the information', 'Ajude-nos a atualizar as informações')}
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {t(
                'Comparte esta página en WhatsApp, Instagram o Twitter. Cada persona que reporte información puede salvar una vida.',
                'Share this page on WhatsApp, Instagram or Twitter. Every person who reports information can save a life.',
                'Compartilhe esta página no WhatsApp, Instagram ou Twitter. Cada pessoa que reportar pode salvar uma vida.'
              )}
            </p>
            <div className="rounded-xl p-3 text-left mb-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs" style={{ color: '#fff' }}>✅ {t('1. Toma captura de esta ficha o copia el enlace.', '1. Screenshot this page or copy the link.', '1. Tire um screenshot desta ficha ou copie o link.')}</p>
              <p className="text-xs" style={{ color: '#fff' }}>✅ {t('2. Compártela en tus redes.', '2. Share it on your networks.', '2. Compartilhe nas suas redes.')}</p>
              <p className="text-xs" style={{ color: '#fff' }}>✅ {t('3. Invita a reportar en:', '3. Invite others to report at:', '3. Convide outros a reportar em:')} <span style={{ color: '#F59E0B', fontWeight: 700 }}>statusvzla.com/edificios</span></p>
            </div>
            <a
              href="https://statusvzla.com/edificios"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-black text-sm px-6 py-3 rounded-xl no-underline"
              style={{ background: '#F59E0B', color: '#0D2B6B' }}
            >
              🏗️ {t('Ver todos los edificios →', 'See all buildings →', 'Ver todos os edifícios →')}
            </a>
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