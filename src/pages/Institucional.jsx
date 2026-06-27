import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const TIPOS_LUGAR = [
  { es: 'Refugio',             en: 'Shelter',          emoji: '🏠' },
  { es: 'Hospital',            en: 'Hospital',         emoji: '🏥' },
  { es: 'Farmacia',            en: 'Pharmacy',         emoji: '💊' },
  { es: 'Supermercado',        en: 'Supermarket',      emoji: '🛒' },
  { es: 'Comedor',             en: 'Food center',      emoji: '🍽️' },
  { es: 'Centro de acopio',    en: 'Supply depot',     emoji: '📦' },
  { es: 'Centro de donaciones',en: 'Donation point',   emoji: '🤝' },
  { es: 'Bodega / Abasto',     en: 'Grocery store',    emoji: '🏪' },
  { es: 'Albergue',            en: 'Shelter/Hostel',   emoji: '🛏️' },
  { es: 'Punto de agua',       en: 'Water point',      emoji: '💧' },
  { es: 'Otro',                en: 'Other',            emoji: '📍' },
];

const DIAS_SEMANA_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_SEMANA_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIAS_VALS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

const SERVICIOS_ES = ['Agua potable', 'Comida', 'Camas', 'Atención médica', 'Medicamentos', 'Ropa', 'Carga de celular', 'Información', 'Transporte'];
const SERVICIOS_EN = ['Drinking water', 'Food', 'Beds', 'Medical care', 'Medicines', 'Clothing', 'Phone charging', 'Information', 'Transport'];

const ESTADOS_OP = [
  { val: 'abierto',  es: '✅ Abierto',   en: '✅ Open' },
  { val: 'saturado', es: '⚠️ Saturado', en: '⚠️ Saturated' },
  { val: 'cerrado',  es: '🔒 Cerrado',  en: '🔒 Closed' },
];

const inputCls = "w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

const PASOS = [
  { n: 1, es: 'Datos del lugar',   en: 'Place info' },
  { n: 2, es: 'Servicios y capacidad', en: 'Services & capacity' },
  { n: 3, es: 'Ubicación y horarios', en: 'Location & hours' },
  { n: 4, es: 'Contacto y fotos', en: 'Contact & photos' },
];

export default function Institucional() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    nombre_lugar: '', tipo_lugar: '', estado_operativo: 'abierto',
    capacidad_maxima: '', personas_actuales: '',
    servicios_disponibles: [], necesidades_urgentes: '',
    direccion: '', ciudad: '', estado_region: '',
    telefono_publico: '', whatsapp: '',
    instagram: '', facebook: '', telegram: '', sitio_web: '',
    descripcion_como_llegar: '',
    opera_24h: false,
    horario_apertura: '', horario_cierre: '',
    dias_activos: [],
    nota_horario: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [fotoUrls, setFotoUrls] = useState([]);
  const [sitioId] = useState(() => `punto-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleDia = (val) => setForm(f => ({ ...f, dias_activos: f.dias_activos.includes(val) ? f.dias_activos.filter(d => d !== val) : [...f.dias_activos, val] }));
  const toggleServicio = (s) => setForm(f => ({ ...f, servicios_disponibles: f.servicios_disponibles.includes(s) ? f.servicios_disponibles.filter(x => x !== s) : [...f.servicios_disponibles, s] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await base44.entities.PuntosAyuda.create({
        ...form,
        personas_actuales: form.personas_actuales ? Number(form.personas_actuales) : undefined,
        fuente: 'registro_institucional',
        nivel_verificacion: 'no_verificado',
        ultima_actualizacion: new Date().toISOString(),
        foto_principal_url: fotoUrls[0] || '',
        fotos_adicionales_urls: fotoUrls.slice(1),
        opera_24h: form.opera_24h,
        horario_apertura: form.opera_24h ? '' : form.horario_apertura,
        horario_cierre: form.opera_24h ? '' : form.horario_cierre,
        dias_activos: form.opera_24h ? [] : form.dias_activos,
      });
      setResultado('ok');
    } catch {
      setResultado('err');
    } finally {
      setEnviando(false);
    }
  };

  const servicios = es ? SERVICIOS_ES : SERVICIOS_EN;
  const puedeContinuarPaso1 = form.nombre_lugar.trim() && form.tipo_lugar;
  const puedeContinuarPaso3 = form.direccion.trim() && form.ciudad.trim() && form.estado_region.trim();

  if (resultado === 'ok') return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-16 space-y-4">
        <CheckCircle size={56} className="text-green-600" />
        <h2 className="text-2xl font-black text-[#1A1F2E]">
          {es ? '¡Punto registrado exitosamente!' : 'Help point registered!'}
        </h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          {es
            ? 'Tu punto de ayuda aparecerá en el directorio una vez verificado. Gracias por ayudar a tu comunidad.'
            : 'Your help point will appear in the directory once verified. Thank you for helping your community.'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 max-w-xs text-left">
          <p className="text-xs text-blue-800 leading-relaxed">
            💡 {es
              ? 'Si el estado cambia (saturado, cerrado, nueva necesidad), actualiza la información desde el directorio de centros.'
              : 'If the status changes (saturated, closed, new need), update from the centers directory.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link to="/centros-apoyo" className="bg-[#1A1F2E] text-white px-6 py-3.5 rounded-2xl font-bold text-sm text-center no-underline">
            {es ? '→ Ver directorio de centros' : '→ View centers directory'}
          </Link>
          <Link to="/" className="border border-[#EDEBE8] text-gray-600 px-6 py-3 rounded-2xl font-semibold text-sm text-center no-underline bg-white">
            {es ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        {/* Encabezado */}
        <div className="mb-4">
          <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
            🏛️ {es ? 'Registrar punto de ayuda' : 'Register help point'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {es
              ? 'Registra un refugio, hospital, comedor, farmacia u otro punto de ayuda. La información ayuda a que la comunidad encuentre dónde acudir.'
              : 'Register a shelter, hospital, food center, pharmacy or other help point. This helps the community know where to go.'}
          </p>
        </div>

        {/* Aviso de privacidad */}
        <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-3 py-3 mb-5">
          <Info size={15} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            {es
              ? 'Solo el nombre del lugar, los servicios, el horario y la dirección serán visibles al público. Tu número personal no será publicado.'
              : 'Only the place name, services, hours, and address will be visible to the public. Your personal number will not be published.'}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1 mb-6">
          {PASOS.map((p, i) => (
            <div key={p.n} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2 transition-colors ${paso === p.n ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : paso > p.n ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-400 border-gray-200'}`}>
                {paso > p.n ? '✓' : p.n}
              </div>
              {i < PASOS.length - 1 && <div className={`h-0.5 flex-1 rounded ${paso > p.n ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-500 mb-4">
          {es ? `Paso ${paso} de 4 — ` : `Step ${paso} of 4 — `}
          <span className="text-[#1A1F2E]">{es ? PASOS[paso - 1].es : PASOS[paso - 1].en}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── PASO 1: Datos del lugar ── */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-1">
                    {es ? 'Nombre del lugar' : 'Place name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    placeholder={es ? 'Ej: Refugio Municipal El Valle' : 'E.g: El Valle Municipal Shelter'}
                    value={form.nombre_lugar}
                    onChange={e => set('nombre_lugar', e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {es ? 'Nombre exacto como lo conoce la gente.' : 'The exact name people know it by.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-2">
                    {es ? '¿Qué tipo de lugar es?' : 'What type of place?'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_LUGAR.map(tl => (
                      <button
                        key={tl.es}
                        type="button"
                        onClick={() => set('tipo_lugar', tl.es)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${form.tipo_lugar === tl.es ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600 hover:border-gray-400'}`}
                      >
                        {tl.emoji} {es ? tl.es : tl.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-2">
                    {es ? 'Estado operativo actual' : 'Current operational status'}
                  </label>
                  <div className="flex gap-2">
                    {ESTADOS_OP.map(e => (
                      <button
                        key={e.val}
                        type="button"
                        onClick={() => set('estado_operativo', e.val)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors ${form.estado_operativo === e.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}
                      >
                        {es ? e.es : e.en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!puedeContinuarPaso1}
                onClick={() => setPaso(2)}
                className="w-full bg-[#1A1F2E] disabled:opacity-40 text-white font-black py-4 rounded-2xl text-base"
              >
                {es ? 'Continuar →' : 'Continue →'}
              </button>
              {!puedeContinuarPaso1 && (
                <p className="text-center text-xs text-gray-400">
                  {es ? 'Escribe el nombre y selecciona el tipo para continuar.' : 'Enter the name and select a type to continue.'}
                </p>
              )}
            </div>
          )}

          {/* ── PASO 2: Servicios y capacidad ── */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-2">
                    {es ? '¿Qué servicios ofrece?' : 'What services does it offer?'}
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    {es ? 'Selecciona todos los que aplican. Esto ayuda a que la gente sepa a qué puede acudir.' : 'Select all that apply. This helps people know what to come for.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {servicios.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleServicio(SERVICIOS_ES[i])}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors ${form.servicios_disponibles.includes(SERVICIOS_ES[i]) ? 'bg-green-600 text-white border-green-600' : 'bg-white border-[#EDEBE8] text-gray-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-2">
                    {es ? '¿Qué necesita urgente? (opcional)' : 'Urgent needs? (optional)'}
                  </label>
                  <input
                    placeholder={es ? 'Ej: Medicamentos, colchonetas, agua potable...' : 'E.g: Medicines, mats, drinking water...'}
                    value={form.necesidades_urgentes}
                    onChange={e => set('necesidades_urgentes', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-[#1A1F2E] mb-1">
                      {es ? 'Capacidad máxima' : 'Max capacity'}
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      min="0"
                      value={form.capacidad_maxima}
                      onChange={e => set('capacidad_maxima', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1A1F2E] mb-1">
                      {es ? 'Personas ahora' : 'People currently'}
                    </label>
                    <input
                      type="number"
                      placeholder="45"
                      min="0"
                      value={form.personas_actuales}
                      onChange={e => set('personas_actuales', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setPaso(1)} className="flex-1 border-2 border-[#EDEBE8] bg-white text-gray-600 font-bold py-3.5 rounded-2xl text-sm">
                  ← {es ? 'Atrás' : 'Back'}
                </button>
                <button type="button" onClick={() => setPaso(3)} className="flex-1 bg-[#1A1F2E] text-white font-black py-3.5 rounded-2xl text-sm">
                  {es ? 'Continuar →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: Ubicación y horarios ── */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-1">
                    {es ? 'Dirección exacta o referencia' : 'Exact address or landmark'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    placeholder={es ? 'Ej: Calle Sucre, frente al parque, al lado del banco...' : 'E.g: Sucre Street, facing the park, next to the bank...'}
                    value={form.direccion}
                    onChange={e => set('direccion', e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {es ? 'Sé específico. Usa referencias que la gente reconozca.' : 'Be specific. Use references people recognize.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Ciudad' : 'City'} <span className="text-red-500">*</span></label>
                    <input required placeholder="Caracas" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Estado' : 'State'} <span className="text-red-500">*</span></label>
                    <input required placeholder="Miranda" value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Cómo llegar (opcional)' : 'How to get there (optional)'}</label>
                  <textarea rows={2} placeholder={es ? 'Instrucciones para llegar: por dónde entrar, qué transporte tomar...' : 'Directions: which entrance to use, which transport to take...'} value={form.descripcion_como_llegar} onChange={e => set('descripcion_como_llegar', e.target.value)} className={`${inputCls} resize-none`} />
                </div>
              </div>

              {/* Horarios */}
              <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
                <div>
                  <p className="text-sm font-bold text-[#1A1F2E] mb-1">🕐 {es ? 'Horario de atención' : 'Operating hours'}</p>
                  <p className="text-xs text-gray-400 mb-3">{es ? 'Esencial para que la gente sepa si puede acudir ahora.' : 'Essential so people know if they can go now.'}</p>
                  <button
                    type="button"
                    onClick={() => set('opera_24h', !form.opera_24h)}
                    className={`w-full py-3 rounded-xl text-sm font-bold border-2 transition-colors ${form.opera_24h ? 'bg-green-700 text-white border-green-700' : 'bg-white border-[#EDEBE8] text-gray-700'}`}
                  >
                    {form.opera_24h ? '✅' : '⬜'} {es ? 'Abierto las 24 horas' : 'Open 24 hours'}
                  </button>
                </div>

                {!form.opera_24h && (
                  <>
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-2">{es ? 'Días que opera:' : 'Days open:'}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {(es ? DIAS_SEMANA_ES : DIAS_SEMANA_EN).map((dia, i) => (
                          <button
                            key={DIAS_VALS[i]}
                            type="button"
                            onClick={() => toggleDia(DIAS_VALS[i])}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${form.dias_activos.includes(DIAS_VALS[i]) ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}
                          >{dia}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">{es ? 'Abre a las' : 'Opens at'}</label>
                        <input type="time" value={form.horario_apertura} onChange={e => set('horario_apertura', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">{es ? 'Cierra a las' : 'Closes at'}</label>
                        <input type="time" value={form.horario_cierre} onChange={e => set('horario_cierre', e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{es ? 'Nota sobre el horario (opcional)' : 'Schedule note (optional)'}</label>
                      <textarea rows={2} placeholder={es ? 'Ej: Sábados solo hasta mediodía. Farmacia de guardia solo de noche.' : 'E.g: Saturdays only until noon. Night pharmacy only.'} value={form.nota_horario} onChange={e => set('nota_horario', e.target.value)} className={`${inputCls} resize-none`} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setPaso(2)} className="flex-1 border-2 border-[#EDEBE8] bg-white text-gray-600 font-bold py-3.5 rounded-2xl text-sm">
                  ← {es ? 'Atrás' : 'Back'}
                </button>
                <button type="button" disabled={!puedeContinuarPaso3} onClick={() => setPaso(4)} className="flex-1 bg-[#1A1F2E] disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-sm">
                  {es ? 'Continuar →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 4: Contacto y fotos ── */}
          {paso === 4 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
                <div>
                  <p className="text-sm font-bold text-[#1A1F2E] mb-1">📞 {es ? 'Teléfono o WhatsApp público' : 'Public phone or WhatsApp'}</p>
                  <p className="text-xs text-gray-400 mb-2">{es ? 'Este número SÍ se mostrará públicamente para que la gente pueda llamar.' : 'This number WILL be shown publicly so people can call.'}</p>
                  <input
                    placeholder="+58 412 000 0000"
                    value={form.whatsapp || form.telefono_publico}
                    onChange={e => set('whatsapp', e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#1A1F2E] mb-2">🌐 {es ? 'Redes sociales (opcional)' : 'Social media (optional)'}</p>
                  <div className="space-y-2">
                    {[
                      { icon: '📸', key: 'instagram', ph: 'Instagram: @nombre' },
                      { icon: '📘', key: 'facebook',  ph: 'Facebook: facebook.com/pagina' },
                      { icon: '✈️', key: 'telegram',  ph: 'Telegram: t.me/canal' },
                      { icon: '🔗', key: 'sitio_web', ph: es ? 'Sitio web: https://...' : 'Website: https://...' },
                    ].map(r => (
                      <div key={r.key} className="flex items-center gap-2">
                        <span className="text-sm w-6 text-center">{r.icon}</span>
                        <input placeholder={r.ph} value={form[r.key]} onChange={e => set(r.key, e.target.value)} className={inputCls} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4">
                <p className="text-sm font-bold text-[#1A1F2E] mb-1">
                  📷 {es ? 'Fotos del lugar (máx. 3, opcional)' : 'Site photos (max 3, optional)'}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  {es ? 'Ayudan a verificar y a que la gente encuentre el lugar más fácil.' : 'Helps verify the place and makes it easier to find.'}
                </p>
                <FotosDragDrop
                  category="puntos-ayuda"
                  caseId={sitioId}
                  caseLabel={form.nombre_lugar || 'punto-nuevo'}
                  maxFiles={3}
                  onUploaded={setFotoUrls}
                  disabled={enviando}
                />
              </div>

              {/* Resumen antes de enviar */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">{es ? 'Resumen del registro' : 'Registration summary'}</p>
                <div className="space-y-1">
                  {[
                    [es ? 'Nombre' : 'Name', form.nombre_lugar],
                    [es ? 'Tipo' : 'Type', form.tipo_lugar],
                    [es ? 'Estado' : 'Status', form.estado_operativo],
                    [es ? 'Dirección' : 'Address', form.direccion],
                    [es ? 'Ciudad' : 'City', `${form.ciudad}, ${form.estado_region}`],
                  ].map(([label, val]) => val && (
                    <div key={label} className="flex gap-2 text-xs">
                      <span className="text-gray-400 font-semibold w-20 flex-shrink-0">{label}:</span>
                      <span className="text-gray-700">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {resultado === 'err' && (
                <div className="flex gap-2 bg-red-50 border border-red-200 rounded-2xl p-3">
                  <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold">
                    {es ? 'Error al guardar. Verifica tu conexión e intenta de nuevo.' : 'Error saving. Check your connection and try again.'}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setPaso(3)} className="flex-1 border-2 border-[#EDEBE8] bg-white text-gray-600 font-bold py-3.5 rounded-2xl text-sm">
                  ← {es ? 'Atrás' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-base flex items-center justify-center gap-2"
                >
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : '🏥'}
                  {es ? 'Registrar punto' : 'Register point'}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">
                {es
                  ? 'Al enviar, la información será revisada y aparecerá en el directorio pronto.'
                  : 'On submit, the info will be reviewed and appear in the directory soon.'}
              </p>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}