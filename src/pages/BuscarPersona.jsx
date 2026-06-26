import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, ShieldAlert, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PostReporteLogin from '@/components/svzla/PostReporteLogin';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const SEXO = [
  { val: 'femenino', es: 'Femenino', en: 'Female' },
  { val: 'masculino', es: 'Masculino', en: 'Male' },
  { val: 'otro', es: 'Otro / No sé', en: 'Other / Unknown' },
];

const ESTADO_LABEL = {
  buscando: { es: 'Buscando', en: 'Searching', color: 'bg-yellow-100 text-yellow-800' },
  informacion_recibida: { es: 'Info recibida', en: 'Info received', color: 'bg-blue-100 text-blue-700' },
  visto_no_confirmado: { es: 'Visto – sin confirmar', en: 'Seen – unconfirmed', color: 'bg-orange-100 text-orange-700' },
  encontrado_con_vida: { es: '✅ Encontrado', en: '✅ Found alive', color: 'bg-green-100 text-green-800' },
  en_hospital_refugio: { es: 'En hospital/refugio', en: 'In hospital/shelter', color: 'bg-teal-100 text-teal-800' },
  fallecido_reportado: { es: 'Fallecido reportado', en: 'Death reported', color: 'bg-gray-200 text-gray-700' },
  caso_cerrado: { es: 'Caso cerrado', en: 'Case closed', color: 'bg-gray-100 text-gray-500' },
};

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
    telefono_persona: '',
    email_persona: '', contacto_nombre: '', contacto_telefono: '',
    contacto_email: '', contacto_whatsapp: '', notas_publicas: '',
  });
  const [fotoUrls, setFotoUrls] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [personaId] = useState(() => `persona-${Date.now()}`);

  // Duplicate detection
  const [posiblesDuplicados, setPosiblesDuplicados] = useState([]);
  const [buscandoDups, setBuscandoDups] = useState(false);
  const [dupCheck, setDupCheck] = useState(false);
  const [decisionDup, setDecisionDup] = useState(null); // 'nueva' | 'suscribir'
  const [subTarget, setSubTarget] = useState(null);
  const [subEmail, setSubEmail] = useState('');
  const [suscribiendo, setSuscribiendo] = useState(false);
  const [subOk, setSubOk] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setSubEmail(u?.email || ''); }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Check for duplicates when name has 3+ chars
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
    setSuscribiendo(true);
    try {
      const email = subEmail || form.contacto_email || form.email_persona;
      if (!email) { alert(es ? 'Ingresa un email para recibir notificaciones.' : 'Enter an email to receive notifications.'); setSuscribiendo(false); return; }
      const userId = user?.id || 'anonimo';
      await base44.entities.Suscripciones.create({
        user_id: userId,
        persona_id: persona.id,
        email_notificacion: email,
        activa: true,
        es_creador: false,
      });
      setSubOk(true);
    } catch {}
    setSuscribiendo(false);
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

      // Auto-subscribe creator
      const email = form.contacto_email || form.email_persona;
      if (email) {
        const userId = user?.id || 'anonimo';
        await base44.entities.Suscripciones.create({
          user_id: userId,
          persona_id: nueva.id,
          email_notificacion: email,
          activa: true,
          es_creador: true,
        });
        // Trigger email notification for new search
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

  // ── Success screen ──
  if (resultado === 'ok') return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-[#1A1F2E]">{es ? 'Búsqueda registrada.' : 'Search registered.'}</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {es ? 'Si alguien actualiza esta ficha, te avisaremos al email registrado.' : 'If anyone updates this record, we will notify you at the registered email.'}
          </p>
        </div>
        {!user && mostrarLogin && (
          <PostReporteLogin es={es} onSkip={() => setMostrarLogin(false)} />
        )}
        <Link to="/" className="block text-center bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
      </div>
    </div>
  );

  // ── Sub success ──
  if (subOk) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">{es ? 'Suscrito a actualizaciones.' : 'Subscribed to updates.'}</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">{es ? 'Te avisaremos por email si hay novedades sobre esta persona.' : 'We will notify you by email if there are updates about this person.'}</p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">{es ? 'Volver al inicio' : 'Back to home'}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">{es ? '🔎 Estoy buscando a alguien' : '🔎 I am looking for someone'}</h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          {es ? 'Completa este formulario. No necesitas saberlo todo. Tus datos de contacto no se publicarán.' : "Fill in this form. You don't need to know everything. Your contact details will not be published."}
        </p>

        {/* Anti-extortion */}
        <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 mb-5">
          <ShieldAlert size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed">
            {es ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos.' : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees, or anonymous intermediaries.'}
          </p>
        </div>

        {/* ── Duplicate panel ── */}
        {dupCheck && posiblesDuplicados.length > 0 && decisionDup === null && (
          <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-xl p-4 mb-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              ⚠️ {es ? 'Encontramos fichas similares' : 'We found similar records'}
            </h3>
            <p className="text-xs text-gray-600">
              {es ? '¿Es la misma persona? Puedes suscribirte a una ficha existente para recibir actualizaciones, o crear una nueva si es diferente.' : 'Is it the same person? You can subscribe to an existing record to receive updates, or create a new one if it\'s different.'}
            </p>
            <div className="space-y-2">
              {posiblesDuplicados.map(p => {
                const st = ESTADO_LABEL[p.estado_caso] || { es: p.estado_caso, en: p.estado_caso, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-[#EDEBE8] p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-sm text-[#1A1F2E]">{p.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{p.ultima_ubicacion_conocida} · {p.ciudad}</p>
                        {p.edad_aprox && <p className="text-xs text-gray-400">{es ? 'Edad:' : 'Age:'} {p.edad_aprox}</p>}
                        {p.notas_publicas && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.notas_publicas}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.color}`}>
                        {es ? st.es : st.en}
                      </span>
                    </div>
                    <button
                      onClick={() => { setSubTarget(p); setDecisionDup('suscribir'); }}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 bg-[#FFF0D0] border border-[#E6C195] text-[#7A5000] text-xs font-semibold py-2 rounded-lg hover:bg-[#FFE5A8] transition-colors"
                    >
                      <Bell size={12} /> {es ? 'Esta es — suscribirme a actualizaciones' : "This is them — subscribe to updates"}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setDecisionDup('nueva')}
              className="w-full border border-[#EDEBE8] bg-white text-[#1A1F2E] text-xs font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {es ? 'No, es una persona diferente — crear nueva ficha' : "No, it's a different person — create new record"}
            </button>
          </div>
        )}

        {/* ── Subscribe to existing ── */}
        {decisionDup === 'suscribir' && subTarget && (
          <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 mb-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">🔔 {es ? 'Suscribirse a actualizaciones' : 'Subscribe to updates'}</h3>
            <p className="text-xs text-gray-500">{es ? 'Te avisaremos por email cuando haya novedades sobre' : "We'll notify you by email about"} <strong>{subTarget.nombre_completo}</strong>.</p>
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu email' : 'Your email'} *</label>
              <input
                type="email"
                required
                value={subEmail}
                onChange={e => setSubEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
            <button
              disabled={suscribiendo || !subEmail}
              onClick={() => suscribirseAExistente(subTarget)}
              className="w-full bg-[#D48C2E] hover:bg-[#b87724] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {suscribiendo ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
              {es ? 'Suscribirme' : 'Subscribe'}
            </button>
            <button onClick={() => setDecisionDup(null)} className="w-full text-sm text-gray-400 py-1 hover:text-gray-600">{es ? '← Volver' : '← Back'}</button>
          </div>
        )}

        {/* ── Main form (hidden when subscribing to existing) ── */}
        {decisionDup !== 'suscribir' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1 */}
            <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '1. Datos de la persona buscada' : '1. Missing person information'}</h3>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Nombre completo' : 'Full name'} *</label>
                <input
                  required
                  placeholder={es ? 'Ej: María González Pérez' : 'E.g: María González Pérez'}
                  value={form.nombre_completo}
                  onChange={e => { set('nombre_completo', e.target.value); setDupCheck(false); setDecisionDup(null); setPosiblesDuplicados([]); }}
                  onBlur={checkDuplicados}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
                {buscandoDups && <p className="text-xs text-gray-400 mt-1">{es ? 'Buscando fichas existentes...' : 'Checking existing records...'}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Apodo (opcional)' : 'Nickname (optional)'}</label>
                  <input placeholder={es ? 'Ej: Marite' : 'E.g: Marite'} value={form.apodo} onChange={e => set('apodo', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Edad aprox.' : 'Approx. age'}</label>
                  <input placeholder={es ? 'Ej: 35 años' : 'E.g: 35 yrs'} value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">{es ? 'Sexo' : 'Sex'}</label>
                <div className="flex gap-2 flex-wrap">
                  {SEXO.map(s => (
                    <button key={s.val} type="button" onClick={() => set('sexo', s.val)} className={`px-3 py-2 rounded-xl text-sm border transition-colors ${form.sexo === s.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'}`}>{es ? s.es : s.en}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Descripción física (opcional)' : 'Physical description (optional)'}</label>
                <textarea rows={2} placeholder={es ? 'Ej: cabello negro corto, ropa azul, 1.65m...' : 'E.g: short black hair, blue clothes, 5\'5"...'} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none" />
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '2. Última ubicación conocida' : '2. Last known location'}</h3>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Lugar específico' : 'Specific place'} *</label>
                <input required placeholder={es ? 'Ej: Av. Libertador, metro Chacaíto' : 'E.g: Av. Libertador, Chacaíto metro'} value={form.ultima_ubicacion_conocida} onChange={e => set('ultima_ubicacion_conocida', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Ciudad' : 'City'} *</label>
                  <input required placeholder="Caracas" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Estado' : 'State'} *</label>
                  <input required placeholder="Miranda" value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? '¿Cuándo lo/la viste por última vez?' : 'When did you last see them?'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={form.fecha_ultima_vez}
                    onChange={e => set('fecha_ultima_vez', e.target.value)}
                    className="w-full border border-[#EDEBE8] rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                  />
                  <input
                    type="time"
                    value={form.hora_ultima_vez}
                    onChange={e => set('hora_ultima_vez', e.target.value)}
                    placeholder={es ? 'Hora aprox.' : 'Approx. time'}
                    className="w-full border border-[#EDEBE8] rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{es ? 'Si no recuerdas la hora exacta, déjalo en blanco.' : "If you don't remember the exact time, leave it blank."}</p>
              </div>
            </div>

            {/* Section 3: Person's contact (private) */}
            <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '3. Contacto de la persona (si lo tienes)' : "3. Person's contact info (if known)"}</h3>
              <p className="text-xs text-gray-400">{es ? 'No se publicará. Solo para uso interno.' : 'Not published. Internal use only.'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Teléfono' : 'Phone'}</label>
                  <input placeholder="+58..." value={form.telefono_persona} onChange={e => set('telefono_persona', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">Email</label>
                  <input type="email" placeholder="correo@..." value={form.email_persona} onChange={e => set('email_persona', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
              </div>
            </div>

            {/* Section 4: Searcher contact */}
            <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '4. Tu contacto — para avisarte si la encontramos' : '4. Your contact — to notify you if found'}</h3>
              <p className="text-xs text-gray-400">{es ? 'No se mostrará públicamente.' : 'Will not be shown publicly.'}</p>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu nombre' : 'Your name'}</label>
                <input placeholder={es ? 'Ej: Carlos García' : 'E.g: Carlos García'} value={form.contacto_nombre} onChange={e => set('contacto_nombre', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu teléfono' : 'Your phone'} *</label>
                  <input required placeholder="+58..." value={form.contacto_telefono} onChange={e => set('contacto_telefono', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">WhatsApp</label>
                  <input placeholder="+58..." value={form.contacto_whatsapp} onChange={e => set('contacto_whatsapp', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Tu email (para notificaciones)' : 'Your email (for notifications)'}</label>
                <input type="email" placeholder="correo@ejemplo.com" value={form.contacto_email} onChange={e => set('contacto_email', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
            </div>

            {/* Public notes */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Información adicional (se mostrará públicamente)' : 'Additional info (shown publicly)'}</label>
              <textarea rows={2} placeholder={es ? 'Ej: Salió a las 8am, no volvió. Cicatriz en brazo derecho...' : 'E.g: Left at 8am, did not return. Scar on right arm...'} value={form.notas_publicas} onChange={e => set('notas_publicas', e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none" />
            </div>

            {/* Photos */}
            {!lowBw && (
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Foto de la persona (máx. 2, opcional)' : 'Photo (max 2, optional)'}</label>
                <FotosDragDrop category="personas" caseId={personaId} caseLabel={form.nombre_completo || 'persona-nueva'} maxFiles={2} onUploaded={setFotoUrls} disabled={enviando} />
              </div>
            )}

            {resultado === 'err' && (
              <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
                {es ? 'Error al enviar. Verifica tu conexión.' : 'Error submitting. Check your connection.'}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando || !form.nombre_completo || !form.ultima_ubicacion_conocida || !form.ciudad || !form.estado_region || !form.contacto_telefono}
              className="w-full bg-[#1A1F2E] hover:bg-[#2d3549] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
            >
              {enviando ? <Loader2 size={18} className="animate-spin" /> : '🔎'}
              {dupCheck && posiblesDuplicados.length > 0 && decisionDup === 'nueva'
                ? (es ? 'Confirmar — crear nueva ficha' : 'Confirm — create new record')
                : (es ? 'Registrar búsqueda' : 'Register search')}
            </button>

            <p className="text-center text-[11px] text-gray-400">
              {es ? 'Tus datos de contacto no se publicarán.' : 'Your contact details will not be published.'}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}