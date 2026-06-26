import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, ShieldAlert, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PostReporteLogin from '@/components/svzla/PostReporteLogin';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const SEXO = [
  { val: 'femenino',  es: 'Femenino',     en: 'Female' },
  { val: 'masculino', es: 'Masculino',     en: 'Male' },
  { val: 'otro',      es: 'Otro / No sé', en: 'Other / Unknown' },
];

const ESTADO_LABEL = {
  buscando:           { es: 'Buscando',           en: 'Searching',       color: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida:{ es: 'Info recibida',      en: 'Info received',   color: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado: { es: 'Visto – sin confirmar', en: 'Seen – unconfirmed', color: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida: { es: '✅ Encontrado',      en: '✅ Found alive',  color: 'bg-green-100 text-green-800' },
  en_hospital_refugio: { es: 'En hospital/refugio', en: 'In hospital/shelter', color: 'bg-teal-100 text-teal-800' },
  fallecido_reportado: { es: 'Fallecido reportado', en: 'Death reported', color: 'bg-gray-200 text-gray-700' },
  caso_cerrado:        { es: 'Caso cerrado',       en: 'Case closed',     color: 'bg-gray-100 text-gray-500' },
};

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

function FieldLabel({ label, required, hint }) {
  return (
    <div className="mb-1.5">
      <label className="block text-sm font-bold text-[#1A1F2E]">
        {label}{required && <span className="text-[#B83A52] ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function BuscarPersona() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [user, setUser] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: '', apodo: '', edad_aprox: '', sexo: '',
    descripcion_fisica: '', ultima_ubicacion_conocida: '', ciudad: '',
    estado_region: '', fecha_ultima_vez: '', hora_ultima_vez: '',
    contacto_nombre: '', contacto_telefono: '',
    contacto_email: '', contacto_whatsapp: '', notas_publicas: '',
  });
  const [fotoUrls, setFotoUrls] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [personaId] = useState(() => `persona-${Date.now()}`);
  const [modoRapido, setModoRapido] = useState(false);

  const [posiblesDuplicados, setPosiblesDuplicados] = useState([]);
  const [buscandoDups, setBuscandoDups] = useState(false);
  const [dupCheck, setDupCheck] = useState(false);
  const [decisionDup, setDecisionDup] = useState(null);
  const [subTarget, setSubTarget] = useState(null);
  const [subEmail, setSubEmail] = useState('');
  const [suscribiendo, setSuscribiendo] = useState(false);
  const [subOk, setSubOk] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setSubEmail(u?.email || ''); }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const checkDuplicados = async () => {
    const nombre = form.nombre_completo.trim();
    if (nombre.length < 3) return;
    setBuscandoDups(true);
    try {
      const todas = await base44.entities.PersonasBuscadas.list();
      const q = nombre.toLowerCase();
      const found = todas.filter(p =>
        p.nombre_completo?.toLowerCase().includes(q) ||
        (p.apodo && p.apodo.toLowerCase().includes(q))
      );
      setPosiblesDuplicados(found);
    } catch {}
    setBuscandoDups(false);
    setDupCheck(true);
  };

  const suscribirseAExistente = async (persona) => {
    if (!subEmail.trim()) {
      setError(es ? 'Por favor, ingresa un email válido.' : 'Please enter a valid email.');
      return;
    }
    setError('');
    setSuscribiendo(true);
    try {
      await base44.entities.Suscripciones.create({
        user_id: user?.id || 'anonimo',
        persona_id: persona.id,
        email_notificacion: subEmail.trim(),
        activa: true,
        es_creador: false,
      });
      setSubOk(true);
    } catch {
      setError(es ? 'No se pudo procesar la suscripción. Intenta de nuevo.' : 'Could not process subscription. Please try again.');
    } finally {
      setSuscribiendo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dupCheck && form.nombre_completo.trim().length >= 3) {
      await checkDuplicados();
      return;
    }
    setEnviando(true);
    try {
      const nueva = await base44.entities.PersonasBuscadas.create({
        ...form,
        foto_url: fotoUrls[0] || '',
        fuente: 'web_publica',
        estado_caso: 'buscando',
      });
      const email = form.contacto_email;
      if (email) {
        await base44.entities.Suscripciones.create({
          user_id: user?.id || 'anonimo',
          persona_id: nueva.id,
          email_notificacion: email,
          activa: true,
          es_creador: true,
        });
        await base44.functions.invoke('notificarCoincidencia', {
          tipo_notificacion: 'actualizacion_suscripcion',
          entidad_id: nueva.id,
          datos: { nombre: nueva.nombre_completo, estado: 'buscando', notas: 'Nueva búsqueda registrada. Te avisaremos si hay novedades.' },
          lang: lang,
        });
        
        // The original call is preserved in case other systems rely on it.
        await base44.functions.invoke('notificarActualizacion', {
          persona_id: nueva.id,
          tipo_evento: 'nueva_busqueda',
          datos_persona: { nombre_completo: nueva.nombre_completo },
        });
      }
      setResultado('ok');
      setMostrarLogin(true);
    } catch {
      setResultado('err');
    } finally {
      setEnviando(false);
    }
  };

  if (resultado === 'ok') return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-8 space-y-5">
        <div className="text-center space-y-3">
          <div className="text-6xl">✅</div>
          <h2 className="text-2xl font-black text-[#1A1F2E]">{es ? 'Búsqueda registrada.' : 'Search registered.'}</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            {es
              ? 'Búsqueda registrada. Si encontramos a alguien que buscas, te avisaremos de inmediato al email registrado. También recibirás notificación si alguien actualiza esta ficha.'
              : 'Search registered. If we find someone you are looking for, we will notify you immediately at your registered email. You will also be notified if anyone updates this record.'}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-800 font-medium">
            🔔 {es
              ? 'Activa: recibirás un email si alguien reporta haber visto o encontrado a esta persona.'
              : 'Active: you will receive an email if someone reports seeing or finding this person.'}
          </div>
        </div>
        {!user && mostrarLogin && <PostReporteLogin es={es} onSkip={() => setMostrarLogin(false)} />}
        <Link to="/" className="block text-center bg-[#1A1F2E] text-white px-6 py-4 rounded-2xl font-bold text-base">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
      </div>
    </div>
  );

  if (subOk) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="text-6xl">🔔</div>
        <h2 className="text-2xl font-black text-[#1A1F2E]">{es ? 'Suscrito a actualizaciones.' : 'Subscribed to updates.'}</h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{es ? 'Te avisaremos por email si hay novedades.' : 'We will notify you by email if there are updates.'}</p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-8 py-4 rounded-2xl font-bold text-base">{es ? 'Volver al inicio' : 'Back to home'}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 cursor-pointer hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🔎 {es ? 'Busco a alguien' : "I'm looking for someone"}
        </h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          {es
            ? 'Completa este formulario. No necesitas saberlo todo. Tus datos de contacto no se publicarán.'
            : "Fill in this form. You don't need to know everything. Your contact details will not be published."}
        </p>
        <button onClick={() => setModoRapido(v => !v)} type="button" className={`text-xs font-semibold px-3 py-1.5 rounded-lg border mb-4 cursor-pointer ${modoRapido ? 'bg-[#D48C2E] text-white border-[#D48C2E]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#D48C2E]'}`}>
          ⚡ {modoRapido ? (es ? 'Versión completa' : 'Full version') : (es ? 'Modo rápido' : 'Quick mode')}
        </button>

        {/* Anti-extorsión */}
        <div className="flex gap-3 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 mb-5">
          <ShieldAlert size={18} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#B83A52] mb-0.5">
              {es ? 'Alerta de seguridad' : 'Security alert'}
            </p>
            <p className="text-xs text-[#B83A52] leading-relaxed">
              {es
                ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos.'
                : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees, or anonymous intermediaries.'}
            </p>
          </div>
        </div>

        {/* Panel de duplicados */}
        {dupCheck && posiblesDuplicados.length > 0 && decisionDup === null && (
          <div className="bg-[#FFF8EE] border-2 border-[#E6C195] rounded-2xl p-4 mb-5 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">
              ⚠️ {es ? 'Encontramos fichas similares' : 'We found similar records'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {es
                ? '¿Es la misma persona? Puedes suscribirte para recibir actualizaciones, o crear una nueva si es diferente.'
                : "Is it the same person? You can subscribe to receive updates, or create a new one if it's different."}
            </p>
            <div className="space-y-2">
              {posiblesDuplicados.map(p => {
                const st = ESTADO_LABEL[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-[#EDEBE8] p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-sm text-[#1A1F2E]">{p.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{p.ultima_ubicacion_conocida} · {p.ciudad}</p>
                        {p.edad_aprox && <p className="text-xs text-gray-400">{es ? 'Edad:' : 'Age:'} {p.edad_aprox}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>
                        {es ? st.es : st.en}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSubTarget(p); setDecisionDup('suscribir'); }}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#FFF0D0] border border-[#E6C195] text-[#7A5000] text-sm font-bold py-2.5 rounded-xl cursor-pointer hover:bg-[#FFE5A8] transition-colors"
                    >
                      <Bell size={14} /> {es ? 'Esta es — suscribirme a actualizaciones' : "This is them — subscribe to updates"}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setDecisionDup('nueva')}
              className="w-full border-2 border-[#EDEBE8] bg-white text-[#1A1F2E] text-sm font-bold py-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {es ? 'No, es una persona diferente — crear nueva ficha' : "No, it's a different person — create new record"}
            </button>
          </div>
        )}

        {/* Suscribir a existente */}
        {decisionDup === 'suscribir' && subTarget && (
          <div className="bg-white border-2 border-[#EDEBE8] rounded-2xl p-4 mb-5 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">🔔 {es ? 'Suscribirse a actualizaciones' : 'Subscribe to updates'}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {es ? 'Te avisaremos por email cuando haya novedades sobre' : "We'll notify you by email about"}{' '}
              <strong>{subTarget.nombre_completo}</strong>.
            </p>
            <div>
              <FieldLabel label={es ? 'Tu email' : 'Your email'} required />
              <input type="email" required value={subEmail} onChange={e => setSubEmail(e.target.value)} placeholder="correo@ejemplo.com" className={inputCls} />
              {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            </div>
            <button
              disabled={suscribiendo || !subEmail}
              onClick={() => suscribirseAExistente(subTarget)}
              className="w-full bg-[#D48C2E] hover:bg-[#b87724] disabled:opacity-40 text-white font-black py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {suscribiendo ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
              {es ? 'Suscribirme' : 'Subscribe'}
            </button>
            <button onClick={() => setDecisionDup(null)} className="w-full text-sm text-gray-400 py-1 cursor-pointer hover:text-gray-600">{es ? '← Volver' : '← Back'}</button>
          </div>
        )}

        {/* Formulario principal */}
        {decisionDup !== 'suscribir' && modoRapido && (
          <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-2xl border-2 border-[#D48C2E] p-4">
            <p className="text-xs font-bold text-[#1A1F2E]">{es ? '⚡ Modo rápido — solo lo esencial' : '⚡ Quick mode — only essentials'}</p>
            <input required placeholder={es ? 'Nombre completo de la persona' : 'Person\'s full name'} value={form.nombre_completo} onChange={e => { set('nombre_completo', e.target.value); setDupCheck(false); setDecisionDup(null); setPosiblesDuplicados([]); }} onBlur={checkDuplicados} className={inputCls} />
            <input required placeholder={es ? 'Última ubicación conocida' : 'Last known location'} value={form.ultima_ubicacion_conocida} onChange={e => set('ultima_ubicacion_conocida', e.target.value)} className={inputCls} />
            <input required placeholder={es ? 'Tu teléfono de contacto' : 'Your contact phone'} value={form.contacto_telefono} onChange={e => set('contacto_telefono', e.target.value)} className={inputCls} />
            <button type="submit" disabled={enviando || !form.nombre_completo || !form.ultima_ubicacion_conocida || !form.contacto_telefono} className="w-full bg-[#1A1F2E] disabled:opacity-40 text-white font-black py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 cursor-pointer">
              {enviando ? <Loader2 size={18} className="animate-spin" /> : '🔎'} {es ? 'Registrar búsqueda' : 'Register search'}
            </button>
          </form>
        )}

        {decisionDup !== 'suscribir' && !modoRapido && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Sección 1: Persona */}
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
              <h3 className="text-base font-black text-[#1A1F2E]">
                {es ? '1. ¿A quién buscas?' : '1. Who are you looking for?'}
              </h3>

              <div>
                <FieldLabel label={es ? 'Nombre completo' : 'Full name'} required />
                <input
                  required
                  placeholder={es ? 'Ej: María González Pérez' : 'E.g: María González Pérez'}
                  value={form.nombre_completo}
                  onChange={e => { set('nombre_completo', e.target.value); setDupCheck(false); setDecisionDup(null); setPosiblesDuplicados([]); }}
                  onBlur={checkDuplicados}
                  className={inputCls}
                />
                {buscandoDups && <p className="text-xs text-gray-400 mt-1">⏳ {es ? 'Buscando fichas existentes...' : 'Checking existing records...'}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label={es ? 'Apodo (opcional)' : 'Nickname (optional)'} />
                  <input placeholder={es ? 'Ej: Marite' : 'E.g: Marite'} value={form.apodo} onChange={e => set('apodo', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <FieldLabel label={es ? 'Edad aprox.' : 'Approx. age'} />
                  <input placeholder={es ? 'Ej: 35' : 'E.g: 35'} value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <FieldLabel label={es ? 'Sexo' : 'Sex'} />
                <div className="flex gap-2 flex-wrap">
                  {SEXO.map(s => (
                    <button key={s.val} type="button" onClick={() => set('sexo', s.val)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${form.sexo === s.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                      {es ? s.es : s.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel label={es ? 'Descripción física (opcional)' : 'Physical description (optional)'}
                  hint={es ? 'Ropa que llevaba, cabello, señas particulares' : 'Clothing, hair, distinguishing marks'} />
                <textarea rows={2} placeholder={es ? 'Ej: cabello negro corto, ropa azul, 1.65m...' : "E.g: short black hair, blue clothes, 5'5\"..."} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} className={`${inputCls} resize-none`} />
              </div>
            </div>

            {/* Sección 2: Ubicación */}
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
              <h3 className="text-base font-black text-[#1A1F2E]">
                {es ? '2. ¿Dónde fue vista por última vez?' : '2. Where were they last seen?'}
              </h3>

              <div>
                <FieldLabel label={es ? 'Lugar específico' : 'Specific place'} required />
                <input required placeholder={es ? 'Ej: Av. Libertador, metro Chacaíto' : 'E.g: Av. Libertador, Chacaíto metro'} value={form.ultima_ubicacion_conocida} onChange={e => set('ultima_ubicacion_conocida', e.target.value)} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label={es ? 'Ciudad' : 'City'} required />
                  <input required placeholder="Caracas" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <FieldLabel label={es ? 'Estado' : 'State'} required />
                  <input required placeholder="Miranda" value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <FieldLabel label={es ? '¿Cuándo fue vista por última vez?' : 'When were they last seen?'}
                  hint={es ? 'Aproximado está bien. Deja en blanco si no recuerdas.' : 'Approximate is fine. Leave blank if unsure.'} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={form.fecha_ultima_vez} onChange={e => set('fecha_ultima_vez', e.target.value)} className={inputCls} />
                  <input type="time" value={form.hora_ultima_vez} onChange={e => set('hora_ultima_vez', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Sección 3: Tu contacto */}
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
              <h3 className="text-base font-black text-[#1A1F2E]">
                {es ? '3. Tu contacto — para avisarte si hay novedades' : '3. Your contact — to notify you if there are updates'}
              </h3>
              <div className="bg-[#F0F4FD] rounded-xl px-3 py-2">
                <p className="text-xs text-blue-800 font-medium">
                  🔒 {es ? 'No se mostrará públicamente. Solo para notificaciones.' : 'Will not be shown publicly. For notifications only.'}
                </p>
              </div>

              <div>
                <FieldLabel label={es ? 'Tu nombre' : 'Your name'} />
                <input placeholder={es ? 'Ej: Carlos García' : 'E.g: Carlos García'} value={form.contacto_nombre} onChange={e => set('contacto_nombre', e.target.value)} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label={es ? 'Tu teléfono' : 'Your phone'} required />
                  <input required placeholder="+58..." value={form.contacto_telefono} onChange={e => set('contacto_telefono', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <FieldLabel label="WhatsApp" />
                  <input placeholder="+58..." value={form.contacto_whatsapp} onChange={e => set('contacto_whatsapp', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <FieldLabel label={es ? 'Tu email (para notificaciones)' : 'Your email (for notifications)'} />
                <input type="email" placeholder="correo@ejemplo.com" value={form.contacto_email} onChange={e => set('contacto_email', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Notas públicas */}
            <div>
              <FieldLabel label={es ? 'Información adicional (se mostrará públicamente)' : 'Additional info (shown publicly)'}
                hint={es ? 'Ej: Salió a las 8am, no volvió. Cicatriz en brazo derecho.' : 'E.g: Left at 8am, did not return. Scar on right arm.'} />
              <textarea rows={3} placeholder={es ? 'Escribe aquí...' : 'Write here...'} value={form.notas_publicas} onChange={e => set('notas_publicas', e.target.value)} className={`${inputCls} resize-none`} />
            </div>

            {/* Foto */}
            {!lowBw && (
              <div>
                <FieldLabel label={es ? 'Foto de la persona (máx. 2, opcional)' : 'Photo (max 2, optional)'}
                  hint={es ? 'No es obligatorio. Nadie queda bloqueado de reportar por no tener foto.' : 'Not required. No one is blocked from reporting for lack of a photo.'} />
                <FotosDragDrop category="personas" caseId={personaId} caseLabel={form.nombre_completo || 'persona-nueva'} maxFiles={2} onUploaded={setFotoUrls} disabled={enviando} />
              </div>
            )}

            {resultado === 'err' && (
              <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
                ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando || !form.nombre_completo || !form.ultima_ubicacion_conocida || !form.ciudad || !form.estado_region || !form.contacto_telefono}
              className="w-full bg-[#1A1F2E] hover:bg-[#2d3549] disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {enviando ? <Loader2 size={20} className="animate-spin" /> : '🔎'}
              {dupCheck && posiblesDuplicados.length > 0 && decisionDup === 'nueva'
                ? (es ? 'Confirmar — crear nueva ficha' : 'Confirm — create new record')
                : (es ? 'Registrar búsqueda' : 'Register search')}
            </button>

            <p className="text-center text-xs text-gray-400">
              {es ? 'Tus datos de contacto no se publicarán.' : 'Your contact details will not be published.'}
            </p>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}