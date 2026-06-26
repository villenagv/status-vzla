import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, ShieldAlert, Search, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PostReporteLogin from '@/components/svzla/PostReporteLogin';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const CONDICION = [
  { val: 'a_salvo',            es: '✅ A salvo — está bien',          en: '✅ Safe — they are OK',             sel: 'bg-green-600 border-green-600 text-white' },
  { val: 'herido_leve',        es: '🟡 Herido leve',                  en: '🟡 Mildly injured',                  sel: 'bg-yellow-500 border-yellow-500 text-white' },
  { val: 'herido_grave',       es: '🔴 Herido grave — necesita atención', en: '🔴 Seriously injured — needs care', sel: 'bg-orange-600 border-orange-600 text-white' },
  { val: 'fallecido_reportado',es: '⚫ Fallecido (reportado, sin confirmar)', en: '⚫ Deceased (reported, unconfirmed)', sel: 'bg-gray-700 border-gray-700 text-white' },
  { val: 'no_identificado',    es: '❓ No identificado / no sé su nombre', en: '❓ Unidentified / unknown name',   sel: 'bg-gray-500 border-gray-500 text-white' },
];

const TIPO_LUGAR = [
  { val: 'refugio',       es: '🏠 Refugio',          en: '🏠 Shelter' },
  { val: 'hospital',      es: '🏥 Hospital',          en: '🏥 Hospital' },
  { val: 'centro_acopio', es: '📦 Centro de acopio',  en: '📦 Supply center' },
  { val: 'domicilio',     es: '🏡 Domicilio',         en: '🏡 Home' },
  { val: 'via_publica',   es: '🛣️ Vía pública',       en: '🛣️ Public area' },
  { val: 'otro',          es: '📍 Otro',              en: '📍 Other' },
];

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

export default function ReportarEncontrado() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [personasEncontradas, setPersonasEncontradas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [personaVinculada, setPersonaVinculada] = useState(null);

  const [form, setForm] = useState({
    nombre_o_descripcion: '',
    condicion: '',
    tipo_lugar: '',
    nombre_lugar: '',
    ubicacion_actual: '',
    ciudad: '',
    estado_region: '',
    telefono_contacto: '',
    email_contacto: '',
    descripcion_fisica: '',
    edad_aprox: '',
    sexo: '',
    notas_publicas: '',
    reportado_por_nombre: '',
    reportado_por_telefono: '',
    reportado_por_email: '',
  });

  const [fechaVisto, setFechaVisto] = useState('');
  const [horaVisto, setHoraVisto] = useState('');
  const [fotoUrls, setFotoUrls] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [fotoId] = useState(() => `encontrado-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buscarEnLista = async () => {
    if (busquedaNombre.trim().length < 2) return;
    setBuscando(true);
    try {
      const todas = await base44.entities.PersonasBuscadas.list();
      const q = busquedaNombre.toLowerCase();
      setPersonasEncontradas(todas.filter(p =>
        p.nombre_completo?.toLowerCase().includes(q) ||
        p.apodo?.toLowerCase().includes(q)
      ));
    } catch {}
    setBuscando(false);
  };

  const vincular = (persona) => {
    setPersonaVinculada(persona);
    set('nombre_o_descripcion', persona.nombre_completo);
    setPersonasEncontradas([]);
    setBusquedaNombre('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.condicion) return;
    setEnviando(true);
    try {
      await base44.entities.PersonasEncontradas.create({
        ...form,
        foto_url: fotoUrls[0] || '',
        persona_buscada_id: personaVinculada?.id || '',
        fuente: 'web_publica',
        nivel_verificacion: 'comunidad',
      });

      if (personaVinculada?.id) {
        const nuevoEstado = form.condicion === 'a_salvo' ? 'encontrado_con_vida'
          : form.condicion === 'herido_leve' || form.condicion === 'herido_grave' ? 'en_hospital_refugio'
          : form.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
          : 'informacion_recibida';

        await base44.entities.PersonasBuscadas.update(personaVinculada.id, { estado_caso: nuevoEstado });

        await base44.functions.invoke('notificarActualizacion', {
          persona_id: personaVinculada.id,
          tipo_evento: 'persona_encontrada',
          datos_persona: {
            nombre_completo: personaVinculada.nombre_completo,
            estado_caso: nuevoEstado,
            condicion: form.condicion,
            ubicacion: form.nombre_lugar || form.ubicacion_actual,
          },
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
          <h2 className="text-2xl font-black text-[#1A1F2E]">{es ? 'Gracias. Tu reporte fue enviado.' : 'Thank you. Your report was submitted.'}</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            {personaVinculada
              ? (es ? `Los familiares de ${personaVinculada.nombre_completo} serán notificados por email.` : `${personaVinculada.nombre_completo}'s family will be notified by email.`)
              : (es ? 'Tu información está registrada y puede ayudar a reunir familias.' : 'Your information is registered and can help reunite families.')}
          </p>
        </div>
        {mostrarLogin && <PostReporteLogin es={es} onSkip={() => setMostrarLogin(false)} />}
        <Link to="/" className="block text-center bg-[#1A1F2E] text-white px-6 py-4 rounded-2xl font-bold text-base">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
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
          🙋 {es ? 'Vi o encontré a alguien' : 'I found or saw someone'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Usa este formulario si viste, encontraste o tienes información real sobre una persona. Escribe datos verificables. No publiques rumores.'
            : 'Use this form if you saw, found or have real information about a person. Write verifiable data. Do not post rumors.'}
        </p>

        {/* Anti-extorsión */}
        <div className="flex gap-3 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 mb-5">
          <ShieldAlert size={18} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#B83A52] mb-0.5">{es ? 'Alerta de seguridad' : 'Security alert'}</p>
            <p className="text-xs text-[#B83A52] leading-relaxed">
              {es
                ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.'
                : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Buscar en lista */}
          <div className="bg-[#F0F4FD] border-2 border-[#B0C4E8] rounded-2xl p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">
              {es ? '¿Está esta persona en lista de búsqueda?' : 'Is this person on a missing list?'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {es
                ? 'Si está registrada, sus familiares recibirán una notificación automática con tu reporte.'
                : 'If registered, their family will receive an automatic notification with your report.'}
            </p>

            {personaVinculada ? (
              <div className="bg-white rounded-xl border-2 border-green-300 p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-green-700">✅ {personaVinculada.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{personaVinculada.ultima_ubicacion_conocida} · {personaVinculada.ciudad}</p>
                </div>
                <button type="button" onClick={() => setPersonaVinculada(null)} className="text-xs text-gray-400 hover:text-red-500 underline flex-shrink-0 cursor-pointer">
                  {es ? 'Cambiar' : 'Change'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={busquedaNombre}
                  onChange={e => setBusquedaNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscarEnLista())}
                  placeholder={es ? 'Nombre de la persona...' : "Person's name..."}
                  className="flex-1 border-2 border-[#EDEBE8] rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
                <button type="button" onClick={buscarEnLista} disabled={buscando}
                  className="bg-[#1A1F2E] text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  <Search size={16} /> {es ? 'Buscar' : 'Search'}
                </button>
              </div>
            )}

            {personasEncontradas.length > 0 && (
              <div className="space-y-2">
                {personasEncontradas.map(p => (
                  <div key={p.id} className="bg-white border-2 border-[#E6C195] rounded-2xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-[#1A1F2E]">{p.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{p.ultima_ubicacion_conocida} · {p.ciudad}{p.edad_aprox ? ` · ${p.edad_aprox}` : ''}</p>
                      </div>
                      <button type="button" onClick={() => vincular(p)}
                        className="bg-green-600 text-white text-xs px-3 py-2 rounded-xl font-bold flex-shrink-0 cursor-pointer">
                        {es ? '✓ Esta persona' : '✓ This person'}
                      </button>
                    </div>
                    <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-xl p-2.5">
                      <p className="text-xs font-bold text-[#7A5000] mb-1">
                        🔔 {es ? 'Familia buscando activamente' : 'Family actively searching'}
                      </p>
                      {p.contacto_nombre && (
                        <p className="text-xs text-gray-600">{es ? 'Contacto:' : 'Contact:'} <strong>{p.contacto_nombre}</strong></p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {p.contacto_telefono && (
                          <a href={`tel:${p.contacto_telefono}`} className="flex items-center gap-1 text-xs bg-white border border-[#E6C195] text-[#7A5000] px-2 py-1.5 rounded-lg font-bold">
                            <Phone size={11} /> {p.contacto_telefono}
                          </a>
                        )}
                        {p.contacto_whatsapp && (
                          <a href={`https://wa.me/${p.contacto_whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-1.5 rounded-lg font-bold">
                            📱 WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setPersonasEncontradas([])} className="w-full text-xs text-gray-400 py-1 cursor-pointer hover:text-gray-600">
                  {es ? 'No está en la lista — continuar sin vincular' : 'Not on list — continue without linking'}
                </button>
              </div>
            )}
          </div>

          {/* Sección 1: Quién encontraste */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
            <h3 className="text-base font-black text-[#1A1F2E]">
              {es ? '1. ¿A quién encontraste o viste?' : '1. Who did you find or see?'}
            </h3>

            <div>
              <FieldLabel label={es ? 'Nombre o descripción' : 'Name or description'} required
                hint={es ? 'Si no sabes su nombre, describe su apariencia.' : "If you don't know their name, describe their appearance."} />
              <input
                required
                placeholder={es ? 'Nombre completo, o "hombre adulto de aprox. 50 años"' : 'Full name, or "adult man, approx. 50 years old"'}
                value={form.nombre_o_descripcion}
                onChange={e => set('nombre_o_descripcion', e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label={es ? 'Edad aprox.' : 'Approx. age'} />
                <input placeholder={es ? 'Ej: 40' : 'E.g: 40'} value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel label={es ? 'Sexo' : 'Sex'} />
                <select value={form.sexo} onChange={e => set('sexo', e.target.value)} className={inputCls}>
                  <option value="">{es ? 'No sé' : "Don't know"}</option>
                  <option value="femenino">{es ? 'Femenino' : 'Female'}</option>
                  <option value="masculino">{es ? 'Masculino' : 'Male'}</option>
                  <option value="otro">{es ? 'Otro' : 'Other'}</option>
                </select>
              </div>
            </div>

            <div>
              <FieldLabel label={es ? '¿Cuándo lo/la viste?' : 'When did you see them?'}
                hint={es ? 'Aproximado está bien.' : 'Approximate is fine.'} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={fechaVisto} onChange={e => setFechaVisto(e.target.value)} className={inputCls} />
                <input type="time" value={horaVisto} onChange={e => setHoraVisto(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Sección 2: Condición */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">
              {es ? '2. ¿Cómo está esta persona?' : '2. What is their condition?'} <span className="text-[#B83A52]">*</span>
            </h3>
            <div className="flex flex-col gap-2">
              {CONDICION.map(c => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => set('condicion', c.val)}
                  className={`w-full py-4 rounded-xl text-sm font-bold border-2 transition-colors text-left px-4 cursor-pointer ${
                    form.condicion === c.val ? c.sel : 'bg-white border-[#EDEBE8] text-gray-700 hover:border-gray-400'
                  }`}
                >{es ? c.es : c.en}</button>
              ))}
            </div>
          </div>

          {/* Sección 3: Ubicación */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-4">
            <h3 className="text-base font-black text-[#1A1F2E]">
              {es ? '3. ¿Dónde está ahora?' : '3. Where are they now?'}
            </h3>

            <div>
              <FieldLabel label={es ? 'Tipo de lugar' : 'Type of place'} />
              <div className="flex flex-wrap gap-2">
                {TIPO_LUGAR.map(tl => (
                  <button key={tl.val} type="button" onClick={() => set('tipo_lugar', tl.val)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${
                      form.tipo_lugar === tl.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'
                    }`}
                  >{es ? tl.es : tl.en}</button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel label={es ? 'Nombre del lugar (si lo sabes)' : 'Place name (if known)'} />
              <input placeholder={es ? 'Ej: Hospital Pérez Carreño, Refugio El Valle...' : 'E.g: Pérez Carreño Hospital, El Valle Shelter...'} value={form.nombre_lugar} onChange={e => set('nombre_lugar', e.target.value)} className={inputCls} />
            </div>

            <div>
              <FieldLabel label={es ? 'Dirección o referencia' : 'Address or landmark'} />
              <input placeholder={es ? 'Calle, avenida, referencia...' : 'Street, avenue, landmark...'} value={form.ubicacion_actual} onChange={e => set('ubicacion_actual', e.target.value)} className={inputCls} />
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label={es ? 'Teléfono del lugar' : 'Place phone'} />
                <input placeholder="+58..." value={form.telefono_contacto} onChange={e => set('telefono_contacto', e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel label={es ? 'Email del lugar' : 'Place email'} />
                <input type="email" placeholder="correo@..." value={form.email_contacto} onChange={e => set('email_contacto', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <FieldLabel label={es ? 'Información adicional (opcional, pública)' : 'Additional info (optional, public)'}
              hint={es ? 'Ej: Está consciente, tiene documentos, pide que contacten a su familia' : 'E.g: Conscious, has ID, asking to contact family'} />
            <textarea rows={3} placeholder={es ? 'Escribe aquí...' : 'Write here...'} value={form.notas_publicas} onChange={e => set('notas_publicas', e.target.value)} className={`${inputCls} resize-none`} />
          </div>

          {/* Foto */}
          {!lowBw && (
            <div>
              <FieldLabel label={es ? 'Foto (opcional, máx. 2)' : 'Photo (optional, max 2)'}
                hint={es ? 'No es obligatorio.' : 'Not required.'} />
              <FotosDragDrop category="encontrados" caseId={fotoId} caseLabel={form.nombre_o_descripcion || 'encontrado'} maxFiles={2} onUploaded={setFotoUrls} disabled={enviando} />
            </div>
          )}

          {/* Sección 4: Quien reporta */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '4. Tu información (quien reporta)' : '4. Your information (reporter)'}</h3>
            <div className="bg-[#F0F4FD] rounded-xl px-3 py-2">
              <p className="text-xs text-blue-800 font-medium">
                🔒 {es ? 'No se publicará. Solo para verificación.' : 'Not published. For verification only.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label={es ? 'Tu nombre' : 'Your name'} />
                <input placeholder={es ? 'Nombre...' : 'Name...'} value={form.reportado_por_nombre} onChange={e => set('reportado_por_nombre', e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel label={es ? 'Tu teléfono' : 'Your phone'} />
                <input placeholder="+58..." value={form.reportado_por_telefono} onChange={e => set('reportado_por_telefono', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <FieldLabel label={es ? 'Tu email' : 'Your email'} />
              <input type="email" placeholder="correo@..." value={form.reportado_por_email} onChange={e => set('reportado_por_email', e.target.value)} className={inputCls} />
            </div>
          </div>

          {resultado === 'err' && (
            <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
              ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || !form.nombre_o_descripcion || !form.condicion || !form.ciudad || !form.estado_region}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {enviando ? <Loader2 size={20} className="animate-spin" /> : '🙋'}
            {es ? 'Enviar mi reporte' : 'Submit my report'}
          </button>

          <p className="text-center text-xs text-gray-400">
            {es ? 'Tus datos de contacto no se publicarán.' : 'Your contact details will not be published.'}
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}