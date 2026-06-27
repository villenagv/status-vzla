import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, Send, MapPin, Phone, Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import StepEstado from '@/components/svzla/step/StepEstado';
import StepPeligro from '@/components/svzla/step/StepPeligro';
import StepNecesidad from '@/components/svzla/step/StepNecesidad';
import StepFamilia from '@/components/svzla/step/StepFamilia';
import StepCentro from '@/components/svzla/step/StepCentro';
import StepPrivacidad from '@/components/svzla/step/StepPrivacidad';
import useZonaForm from '@/components/svzla/useZonaForm';
import PostReporte from '@/components/svzla/PostReporte';
import NudgeBar from '@/components/svzla/NudgeBar';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import { generarcodigo, guardarcodigo } from '@/lib/codigos';

const TOTAL_STEPS = 7;

// ── Sub-modos de entrada ──────────────────────────────────────────────────────
const ACCIONES = [
  {
    id: 'reporte',
    emoji: '🆘',
    bg: '#C0392B',
    es: 'Necesito ayuda o quiero reportar daños',
    en: 'I need help or want to report damage',
    sub_es: 'Personas atrapadas · Edificio dañado · Pedir auxilio',
    sub_en: 'Trapped people · Damaged building · Request help',
  },
  {
    id: 'aqui',
    emoji: '📍',
    bg: '#784212',
    es: 'Estoy aquí — avisa que estás vivo/a',
    en: 'I am here — let people know you are alive',
    sub_es: 'Regístrate · Actualiza tu ficha · Que te encuentren',
    sub_en: 'Register · Update your record · Be found',
  },
  {
    id: 'encontre',
    emoji: '🙋',
    bg: '#1A7A4A',
    es: 'Encontré a alguien',
    en: 'I found someone',
    sub_es: 'Vi o ayudé a una persona · Registrar hallazgo',
    sub_en: 'I saw or helped a person · Register the finding',
  },
  {
    id: 'edificio',
    emoji: '🏗️',
    bg: '#5D4037',
    es: 'Reportar edificio o estructura dañada',
    en: 'Report a damaged building or structure',
    sub_es: 'Daños visibles · Personas atrapadas · Riesgos',
    sub_en: 'Visible damage · Trapped people · Hazards',
  },
  {
    id: 'centros',
    emoji: '🏥',
    bg: '#2471A3',
    es: 'Ver centros de apoyo cerca',
    en: 'See nearby help centers',
    sub_es: 'Hospitales · Refugios · Acopios · ONGs',
    sub_en: 'Hospitals · Shelters · Supplies · NGOs',
  },
];

const ESTADO_OP_LABEL = {
  abierto:   { es: '✅ Abierto',   en: '✅ Open' },
  saturado:  { es: '⚠️ Saturado', en: '⚠️ Saturated' },
  cerrado:   { es: '🔒 Cerrado',  en: '🔒 Closed' },
};
const ESTADO_OP_COLOR = {
  abierto:  'bg-green-100 text-green-800',
  saturado: 'bg-orange-100 text-orange-700',
  cerrado:  'bg-gray-200 text-gray-600',
};

// ── Componente Centros Cercanos ───────────────────────────────────────────────
function CentrosCercanos({ es, lowBw }) {
  const [centros, setCentros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('');
  const [todos, setTodos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const PAGE = 8;

  const cargarTodos = async () => {
    setCargando(true);
    try {
      const data = await base44.entities.PuntosAyuda.list('-updated_date', 200);
      setTodos(data);
      setCentros(data);
      setCargado(true);
    } catch {
      setGeoError(es ? 'No se pudo cargar la lista de centros.' : 'Could not load centers list.');
    }
    setCargando(false);
  };

  const buscarCercanos = () => {
    setCargando(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError(es ? 'Tu dispositivo no soporta geolocalización.' : 'Your device does not support geolocation.');
      setCargando(false);
      cargarTodos();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await base44.entities.PuntosAyuda.list('-updated_date', 200);
          setTodos(data);
          const { latitude: lat, longitude: lng } = pos.coords;
          const conDist = data
            .filter(c => c.lat && c.lng)
            .map(c => {
              const dlat = (c.lat - lat) * 111;
              const dlng = (c.lng - lng) * 111 * Math.cos(lat * Math.PI / 180);
              return { ...c, distKm: Math.sqrt(dlat * dlat + dlng * dlng) };
            })
            .sort((a, b) => a.distKm - b.distKm);
          const sinCoords = data.filter(c => !c.lat || !c.lng);
          setCentros([...conDist, ...sinCoords]);
          setCargado(true);
        } catch {
          setGeoError(es ? 'No se pudo cargar la lista.' : 'Could not load the list.');
        }
        setCargando(false);
      },
      () => {
        cargarTodos();
      },
      { timeout: 6000 }
    );
  };

  const filtrados = ciudadFiltro.trim()
    ? centros.filter(c =>
        (c.ciudad || '').toLowerCase().includes(ciudadFiltro.toLowerCase()) ||
        (c.estado_region || '').toLowerCase().includes(ciudadFiltro.toLowerCase()) ||
        (c.nombre_lugar || '').toLowerCase().includes(ciudadFiltro.toLowerCase())
      )
    : centros;

  const visibles = filtrados.slice(0, pagina * PAGE);

  return (
    <div>
      <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mb-4">
        <MapPin size={14} className="text-blue-700 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          {es
            ? 'Toca "Ubicarme" para ver los centros más cercanos a tu posición actual. Si no funciona, filtra por ciudad.'
            : 'Tap "Locate me" to see centers nearest to you. If it doesn\'t work, filter by city.'}
        </p>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={buscarCercanos}
          disabled={cargando}
          className="flex-1 bg-[#2471A3] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {cargando ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
          {es ? 'Ubicarme' : 'Locate me'}
        </button>
        <button
          onClick={cargarTodos}
          disabled={cargando}
          className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl bg-white disabled:opacity-50"
        >
          {es ? 'Ver todos' : 'View all'}
        </button>
      </div>

      {cargado && (
        <input
          value={ciudadFiltro}
          onChange={e => { setCiudadFiltro(e.target.value); setPagina(1); }}
          placeholder={es ? 'Filtrar por ciudad, zona o nombre...' : 'Filter by city, area or name...'}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white mb-3 focus:outline-none focus:border-[#1A1F2E]"
        />
      )}

      {geoError && <p className="text-xs text-red-600 mb-3">{geoError}</p>}

      {cargado && filtrados.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          {es ? 'No hay centros en esta zona aún.' : 'No centers in this area yet.'}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {visibles.map(c => {
          const stLabel = ESTADO_OP_LABEL[c.estado_operativo] || { es: c.estado_operativo, en: c.estado_operativo };
          const stColor = ESTADO_OP_COLOR[c.estado_operativo] || 'bg-gray-100 text-gray-600';
          const gmapsUrl = c.lat && c.lng
            ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
            : c.direccion
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.nombre_lugar} ${c.ciudad}`)}`
              : null;

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1A1F2E] leading-tight">{c.nombre_lugar}</p>
                  <p className="text-xs text-gray-400">{c.tipo_lugar} · {c.ciudad}{c.estado_region ? `, ${c.estado_region}` : ''}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${stColor}`}>
                  {es ? stLabel.es : stLabel.en}
                </span>
              </div>
              {c.distKm != null && (
                <p className="text-[11px] text-blue-600 font-semibold">📍 ~{c.distKm.toFixed(1)} km</p>
              )}
              {!lowBw && c.direccion && (
                <p className="text-xs text-gray-500">{c.direccion}</p>
              )}
              {!lowBw && c.servicios_disponibles?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.servicios_disponibles.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {c.telefono_publico && (
                  <a href={`tel:${c.telefono_publico}`} className="flex items-center gap-1 text-xs font-bold text-white bg-gray-900 px-3 py-1.5 rounded-lg no-underline">
                    <Phone size={11} /> {es ? 'Llamar' : 'Call'}
                  </a>
                )}
                {c.whatsapp && (
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg no-underline">
                    💬 WhatsApp
                  </a>
                )}
                {gmapsUrl && (
                  <a href={gmapsUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg no-underline">
                    🗺️ {es ? 'Cómo llegar' : 'Get directions'}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtrados.length > visibles.length && (
        <button onClick={() => setPagina(p => p + 1)} className="w-full mt-3 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl bg-white">
          {es ? `Ver más (${filtrados.length - visibles.length} restantes)` : `Show more (${filtrados.length - visibles.length} remaining)`}
        </button>
      )}

      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
        <p className="text-xs text-amber-800 font-medium">
          ⚠️ {es
            ? 'Verifica el estado del centro antes de trasladarte. Un centro saturado puede no poder recibirte.'
            : 'Verify the center status before traveling. A saturated center may not be able to receive you.'}
        </p>
      </div>
    </div>
  );
}

// ── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full transition-all duration-200" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <span className="text-xs text-gray-400 font-medium flex-shrink-0">{step + 1}/{total}</span>
    </div>
  );
}

// ── Review step ───────────────────────────────────────────────────────────────
function ReviewStep({ form, es }) {
  const items = [
    { label: { es: 'Estado físico', en: 'Physical state' }, val: form.estado_fisico },
    { label: { es: '¿Lugar seguro?', en: 'Safe place?' }, val: form.lugar_seguro },
    { label: { es: 'Necesidades', en: 'Needs' }, val: form.necesidades?.length ? form.necesidades.join(', ') : '-' },
    { label: { es: 'Ubicación', en: 'Location' }, val: form.ubicacion || '-' },
    { label: { es: 'Contacto a avisar', en: 'Contact to alert' }, val: form.avisar_nombre || '-' },
    { label: { es: 'Centro de apoyo', en: 'Support center' }, val: form.centro_nombre || '-' },
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-1">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{es ? 'Revisa antes de enviar' : 'Review before sending'}</h3>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
          <span className="text-xs text-gray-500">{es ? item.label.es : item.label.en}</span>
          <span className="text-xs font-medium text-gray-900">{item.val}</span>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ZonaAfectada() {
  const { lang } = useLang();
  const es = lang === 'es';
  const { lowBw } = useLowBw();
  const { form, setForm, currentStep, nextStep, prevStep, persisted, clearForm } = useZonaForm(TOTAL_STEPS);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(null);
  const [error, setError] = useState(false);
  const [accion, setAccion] = useState(null);
  const formRef = useRef(null);

  // Estado para reporte de edificio
  const [edificioForm, setEdificioForm] = useState({
    tipo: '', nombre: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false,
    direccion: '', ciudad: '', estado_region: '', descripcion: '', nombre_reportante: '', telefono_reportante: '',
  });
  const [edificioFotos, setEdificioFotos] = useState([]);
  const [enviandoEdificio, setEnviandoEdificio] = useState(false);
  const [edificioOk, setEdificioOk] = useState(false);

  const setEd = (k, v) => setEdificioForm(f => ({ ...f, [k]: v }));

  const subirFotoEdificio = async (file) => {
    if (edificioFotos.length >= 5) return;
    const fid = Date.now();
    setEdificioFotos(prev => [...prev, { id: fid, url: null, uploading: true }]);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEdificioFotos(p => p.map(f => f.id === fid ? { ...f, url: file_url, uploading: false } : f));
    } catch { setEdificioFotos(p => p.filter(f => f.id !== fid)); }
  };

  const handleSubmitEdificio = async () => {
    if (!edificioForm.nivel || !edificioForm.atrapados || !edificioForm.ciudad) return;
    setEnviandoEdificio(true);
    try {
      const prioridad = (['critico', 'colapsado'].includes(edificioForm.nivel) || edificioForm.atrapados === 'si' || edificioForm.atrapados === 'voces') ? 'critica' : edificioForm.nivel === 'grave' ? 'alta' : 'normal';
      await base44.entities.ReportesDano.create({
        tipo_estructura: edificioForm.tipo || 'otro',
        nombre_lugar: edificioForm.nombre || undefined,
        nivel_dano: edificioForm.nivel,
        personas_atrapadas: edificioForm.atrapados,
        riesgo_gas: edificioForm.gas,
        riesgo_electrico: edificioForm.elect,
        riesgo_incendio: edificioForm.inc,
        direccion: edificioForm.direccion,
        ciudad: edificioForm.ciudad,
        estado_region: edificioForm.estado_region,
        descripcion: edificioForm.descripcion,
        foto_urls: edificioFotos.filter(f => f.url).map(f => f.url),
        prioridad,
        reportante_nombre: edificioForm.nombre_reportante,
        reportante_telefono: edificioForm.telefono_reportante,
        estado_verificacion: 'recibido',
        nivel_verificacion: 'sin_verificar',
        fuente: 'ciudadano',
      });
      setEdificioOk(true);
    } catch {}
    setEnviandoEdificio(false);
  };

  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleArr = (k, val) => setForm(prev => ({
    ...prev, [k]: prev[k]?.includes(val) ? prev[k].filter(x => x !== val) : [...(prev[k] || []), val]
  }));

  const handleSubmit = async () => {
    setEnviando(true);
    setError(false);
    try {
      const isCritico = ['herido_atencion', 'atrapado', 'no_puedo_caminar', 'inconsciente'].includes(form.estado_fisico);
      const persona = await base44.entities.PersonaCRIS.create({
        nombre: form.nombre,
        ciudad: form.ciudad || form.ubicacion,
        estado_region: form.estado,
        ubicacion_texto: form.ubicacion || form.ubicacion_antes,
        ultima_ubicacion_conocida: form.ubicacion_antes,
        estado_actual: isCritico ? 'atencion_urgente' : (form.estado_fisico === 'a_salvo' ? 'a_salvo' : 'estoy_aqui'),
        nivel_verificacion: 'sin_verificar',
        fuente_inicial: 'ciudadano',
        condiciones_medicas: form.condiciones_medicas?.length ? form.condiciones_medicas.join(', ') : '',
        condicion_especial: form.medicamento_urgente || '',
        es_menor: form.con_ninos === 'si',
        avisar_nombre: form.avisar_nombre || '',
        avisar_email: form.avisar_email || '',
        avisar_telefono: form.avisar_telefono || '',
        avisar_mensaje: form.avisar_mensaje || form.mensaje_rápido || '',
        avisar_relacion: form.avisar_relacion || '',
        notas_publicas: [
          `${form.estado_fisico || ''}${form.lugar_seguro ? ' — ' + form.lugar_seguro : ''}`,
          form.necesidades?.length ? `Necesita: ${form.necesidades.join(', ')}.` : '',
          form.centro_nombre ? `En ${form.centro_nombre}.` : '',
          form.mensaje_rápido || '',
        ].filter(Boolean).join(' ').trim(),
      });
      await base44.entities.EventoHistorial.create({
        persona_id: persona.id,
        tipo_evento: 'reportado',
        descripcion: `Estado: ${form.estado_fisico}. Peligro: ${form.lugar_seguro}. Necesidades: ${(form.necesidades || []).join(', ')}.`,
        ubicacion_texto: form.ubicacion || form.ubicacion_antes,
        fuente: 'ciudadano',
        nivel_confianza: 'medio',
        es_sensible: form.medicamento_urgente ? true : false,
      });
      const codigo = generarcodigo(persona.id);
      setOk({ id: persona.id, codigo, nombre: persona.nombre });
      guardarcodigo(persona.id, codigo);
      if (form.avisar_email?.trim()) {
        try {
          await base44.functions.invoke('enviarAvisoFamiliar', {
            email_destino: form.avisar_email.trim(),
            nombre_reportante: form.avisar_nombre || form.nombre || '',
            relacion: form.avisar_relacion || '',
            mensaje: form.avisar_mensaje || form.mensaje_rápido || '',
            codigo_cris: codigo,
            persona_id: persona.id,
            nombre_persona: form.nombre || '',
            lang: lang,
          });
        } catch {}
      }
      clearForm();
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  if (ok) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <PostReporte reporte={ok} es={es} lowBw={lowBw} />
    </div>
  );

  const esCritico = ['herido_atencion', 'atrapado', 'no_puedo_caminar', 'inconsciente'].includes(form.estado_fisico) || form.lugar_seguro === 'no';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-900 mb-3">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        <h1 className="text-xl font-black text-gray-900 mb-1">
          🆘 {es ? 'Estoy en zona afectada' : 'I am in the affected area'}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {es ? 'Selecciona lo que necesitas hacer ahora.' : 'Select what you need to do right now.'}
        </p>

        {/* Advertencia crítica global */}
        <div className="flex gap-2 bg-red-50 border border-red-300 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-medium leading-relaxed">
            {es
              ? 'Si hay personas atrapadas, olor a gas o incendio activo: llama primero al 171 (Protección Civil) o 911/112 (Bomberos). No entres a estructuras dañadas.'
              : 'If there are trapped people, gas smell or active fire: call 171 (Civil Protection) or 911/112 (Firefighters) first. Do not enter damaged structures.'}
          </p>
        </div>

        {/* ── Selector de acción ── */}
        {!accion && (
          <div className="space-y-3">
            {ACCIONES.map(a => (
              <button
                key={a.id}
                onClick={() => setAccion(a.id)}
                className="w-full flex items-center gap-4 rounded-2xl p-4 text-left border-0 cursor-pointer"
                style={{ background: a.bg }}
              >
                <span className="text-3xl flex-shrink-0">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-base text-white leading-tight">{es ? a.es : a.en}</p>
                  {!lowBw && (
                    <p className="text-xs mt-0.5 text-white opacity-60">{es ? a.sub_es : a.sub_en}</p>
                  )}
                </div>
                <span className="text-white opacity-40 text-xl flex-shrink-0">›</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Modo: Reporte / Ayuda ── */}
        {accion === 'reporte' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>

            {persisted && currentStep > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 mb-3">
                💾 {es ? 'Tu información se guarda automáticamente.' : 'Your info saves automatically.'}
              </div>
            )}

            {esCritico && (
              <div className="flex gap-3 bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-4">
                <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-red-700 leading-relaxed">
                  {es
                    ? '⚠️ Si tu vida corre peligro, llama al 171 o 911. Completa esto solo si puedes hacerlo de forma segura.'
                    : '⚠️ If your life is in danger, call 171 or 911. Complete this only if you can do so safely.'}
                </p>
              </div>
            )}

            <NudgeBar es={es} estadoFisico={form.estado_fisico} lugarSeguro={form.lugar_seguro} bateria={form.bateria_senal} />

            <form ref={formRef} onSubmit={e => { e.preventDefault(); currentStep < TOTAL_STEPS - 1 ? nextStep() : handleSubmit(); }} className="space-y-4">
              <ProgressBar step={currentStep} total={TOTAL_STEPS} />

              {currentStep === 0 && <StepEstado form={form} setForm={setForm} setVal={setVal} es={es} />}
              {currentStep === 1 && <StepPeligro form={form} setVal={setVal} es={es} />}
              {currentStep === 2 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                  <StepNecesidad form={form} setVal={setVal} es={es} />
                  <p className="text-xs text-gray-400 mt-2">{es ? 'Información adicional' : 'Additional info'}</p>
                  <input value={form.acompanado || ''} onChange={e => setVal('acompanado', e.target.value)}
                    placeholder={es ? 'Ej: con 2 vecinos heridos' : 'E.g: with 2 injured neighbors'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900" />
                </div>
              )}
              {currentStep === 3 && <StepFamilia form={form} setVal={setVal} es={es} />}
              {currentStep === 4 && <StepCentro form={form} setVal={setVal} es={es} />}
              {currentStep === 5 && <StepPrivacidad form={form} setVal={setVal} toggleArr={toggleArr} es={es} />}
              {currentStep === 6 && <ReviewStep form={form} es={es} />}

              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button type="button" onClick={prevStep} className="flex-1 py-3.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer">
                    ← {es ? 'Atrás' : 'Back'}
                  </button>
                )}
                <button type="submit" disabled={enviando}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer ${esCritico ? 'bg-red-600' : 'bg-gray-900'}`}>
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
                  {currentStep < TOTAL_STEPS - 1 ? (
                    <>{es ? 'Siguiente' : 'Next'} <ChevronRight size={16} /></>
                  ) : (
                    <><Send size={16} /> {es ? 'Enviar reporte' : 'Submit report'}</>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                  ⚠️ {es ? 'No se pudo enviar. Verifica tu conexión e intenta de nuevo.' : 'Could not send. Check your connection and try again.'}
                </div>
              )}
            </form>
          </div>
        )}

        {/* ── Modo: Estoy aquí ── */}
        {accion === 'aqui' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                📍 {es
                  ? 'Avisa que estás vivo/a y dónde estás. Si ya tienes una ficha, búscala para actualizarla. Evita duplicados.'
                  : 'Let people know you are alive and where you are. If you already have a record, find and update it. Avoid duplicates.'}
              </p>
            </div>
            <Link
              to="/estoy-aqui"
              className="block w-full bg-[#784212] text-white font-black py-5 rounded-2xl text-center text-base no-underline"
            >
              📍 {es ? 'Ir a "Estoy aquí / Encuéntrame"' : 'Go to "I am here / Find me"'}
            </Link>
          </div>
        )}

        {/* ── Modo: Encontré a alguien ── */}
        {accion === 'encontre' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                ⚠️ {es
                  ? 'Usa este formulario si viste, encontraste o tienes información real sobre una persona. Nunca publiques rumores. Tus datos de contacto no serán mostrados públicamente.'
                  : 'Use this form if you saw, found, or have real information about a person. Never publish rumors. Your contact data will not be shown publicly.'}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-red-700 font-semibold">
                🚫 {es
                  ? 'Nunca envíes dinero a cambio de información. Es una estafa.'
                  : "Never send money in exchange for information. It's a scam."}
              </p>
            </div>
            <Link
              to="/reportar-encontrado"
              className="block w-full bg-[#1A7A4A] text-white font-black py-5 rounded-2xl text-center text-base no-underline"
            >
              🙋 {es ? 'Ir al formulario de hallazgo' : 'Go to the found person form'}
            </Link>
          </div>
        )}

        {/* ── Modo: Edificio dañado ── */}
        {accion === 'edificio' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <h2 className="text-base font-black text-[#1A1F2E] mb-1">🏗️ {es ? 'Reportar edificio dañado' : 'Report damaged building'}</h2>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              {es ? 'Completa solo lo que ves desde un lugar seguro. No entres a estructuras dañadas.' : 'Fill in only what you can see from a safe place. Do not enter damaged structures.'}
            </p>

            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertTriangle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium leading-snug">
                {es ? 'Si hay personas atrapadas, llama al 171 (Protección Civil) o 911/112 (Bomberos) de inmediato.' : 'If there are trapped people, call 171 (Civil Protection) or 911/112 (Firefighters) immediately.'}
              </p>
            </div>

            {edificioOk ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5 text-center space-y-3">
                <div className="text-4xl">✅</div>
                <p className="font-black text-green-800 text-base">{es ? '¡Reporte enviado!' : 'Report submitted!'}</p>
                <p className="text-xs text-green-700 leading-relaxed">
                  {es ? 'Gracias. Tu reporte ayuda a que otras personas eviten el peligro y a coordinar rescates.' : 'Thank you. Your report helps others avoid danger and coordinate rescues.'}
                </p>
                <div className="flex flex-col gap-2">
                  <Link to="/edificios" className="block bg-[#1A1F2E] text-white font-bold py-3 rounded-xl text-sm no-underline text-center">
                    {es ? 'Ver directorio de edificios →' : 'View buildings directory →'}
                  </Link>
                  <button onClick={() => { setEdificioOk(false); setEdificioForm({ tipo: '', nombre: '', nivel: '', atrapados: '', gas: false, elect: false, inc: false, direccion: '', ciudad: '', estado_region: '', descripcion: '', nombre_reportante: '', telefono_reportante: '' }); setEdificioFotos([]); }} className="text-sm text-gray-500 underline cursor-pointer">
                    {es ? 'Reportar otro edificio' : 'Report another building'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tipo */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700">{es ? '¿Qué tipo de estructura?' : 'What type of structure?'}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { val: 'edificio_residencial', es: '🏠 Residencial', en: '🏠 Residential' },
                      { val: 'hospital',             es: '🏥 Hospital',    en: '🏥 Hospital' },
                      { val: 'escuela',              es: '🏫 Escuela',     en: '🏫 School' },
                      { val: 'comercio',             es: '🏪 Comercio',    en: '🏪 Business' },
                      { val: 'calle_via',            es: '🛣️ Calle/Vía',   en: '🛣️ Street/Road' },
                      { val: 'otro',                 es: '📋 Otro',        en: '📋 Other' },
                    ].map(t => (
                      <button key={t.val} onClick={() => setEd('tipo', t.val)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${edificioForm.tipo === t.val ? 'bg-[#5D4037] text-white border-[#5D4037]' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {es ? t.es : t.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre y ubicación */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700">📍 {es ? '¿Dónde está?' : 'Where is it?'}</p>
                  <input value={edificioForm.nombre} onChange={e => setEd('nombre', e.target.value)}
                    placeholder={es ? 'Nombre del lugar (opcional)' : 'Place name (optional)'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-800 bg-white" />
                  <input value={edificioForm.direccion} onChange={e => setEd('direccion', e.target.value)}
                    placeholder={es ? 'Dirección o referencia' : 'Address or landmark'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-800 bg-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={edificioForm.ciudad} onChange={e => setEd('ciudad', e.target.value)}
                      placeholder={es ? 'Ciudad *' : 'City *'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-800 bg-white" />
                    <input value={edificioForm.estado_region} onChange={e => setEd('estado_region', e.target.value)}
                      placeholder={es ? 'Estado' : 'State'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-800 bg-white" />
                  </div>
                </div>

                {/* Nivel de daño */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700">{es ? 'Nivel de daño visible *' : 'Visible damage level *'}</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { val: 'leve',      es: '🟡 Leve — grietas pequeñas, estructura firme',      en: '🟡 Minor — small cracks, structure firm' },
                      { val: 'moderado',  es: '🟠 Moderado — paredes o piso dañados',              en: '🟠 Moderate — walls or floor damaged' },
                      { val: 'grave',     es: '🔴 Grave — parte colapsó o riesgo alto',            en: '🔴 Severe — partial collapse or high risk' },
                      { val: 'critico',   es: '🚨 Crítico — colapso total o personas atrapadas',   en: '🚨 Critical — total collapse or trapped' },
                      { val: 'no_sabe',   es: '❓ No sé / No pude evaluar',                        en: '❓ Unknown / Could not assess' },
                    ].map(n => (
                      <button key={n.val} onClick={() => setEd('nivel', n.val)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer text-left ${edificioForm.nivel === n.val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {es ? n.es : n.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personas atrapadas */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700">{es ? '¿Hay personas atrapadas? *' : 'Are there trapped people? *'}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { val: 'si',       es: '🚨 Sí, confirmado',         en: '🚨 Yes, confirmed' },
                      { val: 'voces',    es: '👂 Se escuchan voces',       en: '👂 Voices heard' },
                      { val: 'no',       es: '✅ No',                      en: '✅ No' },
                      { val: 'no_sabe',  es: '❓ No sé',                   en: '❓ Unknown' },
                    ].map(a => (
                      <button key={a.val} onClick={() => setEd('atrapados', a.val)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border cursor-pointer ${edificioForm.atrapados === a.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {es ? a.es : a.en}
                      </button>
                    ))}
                  </div>
                  {(edificioForm.atrapados === 'si' || edificioForm.atrapados === 'voces') && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-xs font-bold text-red-700">🚨 {es ? 'Llama ahora al 171 o 911/112.' : 'Call 171 or 911/112 now.'}</p>
                    </div>
                  )}
                </div>

                {/* Riesgos */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700">⚠️ {es ? '¿Hay alguno de estos riesgos?' : 'Any of these hazards?'}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { k: 'gas',  icon: '💨', es: 'Olor a gas',     en: 'Gas smell' },
                      { k: 'elect',icon: '⚡', es: 'Cables caídos',  en: 'Fallen wires' },
                      { k: 'inc',  icon: '🔥', es: 'Fuego / humo',   en: 'Fire / smoke' },
                    ].map(r => (
                      <button key={r.k} onClick={() => setEd(r.k, !edificioForm[r.k])}
                        className={`py-2.5 rounded-xl text-xs font-semibold border cursor-pointer text-center ${edificioForm[r.k] ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {r.icon} {es ? r.es : r.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción + datos reportante */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <textarea rows={2} value={edificioForm.descripcion} onChange={e => setEd('descripcion', e.target.value)}
                    placeholder={es ? 'Describe lo que ves (opcional)...' : 'Describe what you see (optional)...'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none bg-white" />
                  <p className="text-[10px] text-gray-400">🔒 {es ? 'Tus datos no se publican' : 'Your data is not published'}</p>
                  <input value={edificioForm.nombre_reportante} onChange={e => setEd('nombre_reportante', e.target.value)}
                    placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white" />
                  <input value={edificioForm.telefono_reportante} onChange={e => setEd('telefono_reportante', e.target.value)}
                    placeholder={es ? 'Tu teléfono (opcional)' : 'Your phone (optional)'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>

                {/* Fotos */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-700">📷 {es ? 'Fotos desde lugar seguro (opcional, máx. 5)' : 'Photos from safe place (optional, max 5)'}</p>
                  <div className="flex flex-wrap gap-2">
                    {edificioFotos.map(f => (
                      <div key={f.id} className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {f.url && <img src={f.url} alt="" className="w-full h-full object-cover" />}
                        {f.uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={12} className="animate-spin text-white" /></div>}
                        {f.url && <button onClick={() => setEdificioFotos(p => p.filter(x => x.id !== f.id))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer"><X size={8} /></button>}
                      </div>
                    ))}
                    {edificioFotos.length < 5 && (
                      <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400">
                        <Camera size={14} className="text-gray-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => { Array.from(e.target.files || []).forEach(subirFotoEdificio); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                </div>

                <button onClick={handleSubmitEdificio}
                  disabled={enviandoEdificio || !edificioForm.nivel || !edificioForm.atrapados || !edificioForm.ciudad || edificioFotos.some(f => f.uploading)}
                  className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-black py-4 rounded-2xl text-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
                  {enviandoEdificio ? <Loader2 size={16} className="animate-spin" /> : '🏗️'}
                  {es ? 'Enviar reporte de daño' : 'Submit damage report'}
                </button>
                {(!edificioForm.nivel || !edificioForm.atrapados || !edificioForm.ciudad) && (
                  <p className="text-center text-xs text-gray-400">{es ? 'Completa nivel de daño, atrapados y ciudad.' : 'Fill in damage level, trapped people and city.'}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Modo: Centros cercanos ── */}
        {accion === 'centros' && (
          <div>
            <button onClick={() => setAccion(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1 cursor-pointer">
              <ChevronLeft size={14} /> {es ? 'Cambiar acción' : 'Change action'}
            </button>
            <h2 className="text-base font-black text-[#1A1F2E] mb-1">
              🏥 {es ? 'Centros de apoyo cerca de ti' : 'Help centers near you'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {es
                ? 'Hospitales, refugios, centros de acopio y ONGs activos. Sin mapa para ahorrar datos.'
                : 'Hospitals, shelters, collection centers and active NGOs. No map to save data.'}
            </p>
            <CentrosCercanos es={es} lowBw={lowBw} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}