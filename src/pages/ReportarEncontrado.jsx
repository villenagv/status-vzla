import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, ShieldAlert, Search } from 'lucide-react';
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

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

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
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [posiblesCoincidencias, setPosiblesCoincidencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [personaVinculada, setPersonaVinculada] = useState(null);

  const [form, setForm] = useState({
    nombre_o_descripcion: '',
    cedula: '',
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
    reportado_por_red_social: '',
  });

  const [fechaVisto, setFechaVisto] = useState('');
  const [horaVisto, setHoraVisto] = useState('');
  const [fotoUrls, setFotoUrls] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [fotoId] = useState(() => `encontrado-${Date.now()}`);
  const [modoRapido, setModoRapido] = useState(true);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buscarEnLista = async (nombre) => {
    const q = (nombre || busquedaNombre).trim();
    if (q.length < 2) return;
    setBuscando(true);
    try {
      const todas = await base44.entities.PersonasBuscadas.list();
      const ql = q.toLowerCase();
      setPosiblesCoincidencias(todas.filter(p =>
        p.nombre_completo?.toLowerCase().includes(ql) ||
        p.apodo?.toLowerCase().includes(ql)
      ));
    } catch {}
    setBuscando(false);
  };

  // Búsqueda automática de duplicados al escribir nombre en modo rápido
  const onNombreChange = (val) => {
    set('nombre_o_descripcion', val);
    if (val.trim().length >= 3) {
      clearTimeout(window._crisDebounce);
      window._crisDebounce = setTimeout(() => buscarEnLista(val), 600);
    } else {
      setPosiblesCoincidencias([]);
    }
  };

  const vincular = (persona) => {
    setPersonaVinculada(persona);
    set('nombre_o_descripcion', persona.nombre_completo);
    setPosiblesCoincidencias([]);
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
        foto_url_2: fotoUrls[1] || '',
        persona_buscada_id: personaVinculada?.id || '',
        fuente: 'web_publica',
        nivel_verificacion: 'comunidad',
        descripcion_fisica: form.descripcion_fisica,
      });

      if (personaVinculada?.id) {
        const nuevoEstado = form.condicion === 'a_salvo' ? 'encontrado_con_vida'
          : form.condicion === 'herido_leve' || form.condicion === 'herido_grave' ? 'en_hospital_refugio'
          : form.condicion === 'fallecido_reportado' ? 'fallecido_reportado'
          : 'informacion_recibida';

        await base44.entities.PersonasBuscadas.update(personaVinculada.id, { estado_caso: nuevoEstado });

        await base44.functions.invoke('notificarCoincidencia', {
          tipo_notificacion: 'actualizacion_suscripcion',
          entidad_id: personaVinculada.id,
          datos: {
            nombre: personaVinculada.nombre_completo,
            estado: nuevoEstado,
            notas: form.notas_publicas || 'Sin notas adicionales.',
          },
        });

        // The original call is preserved in case other systems rely on it.
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
          <h2 className="text-2xl font-black text-[#1A1F2E]">{t('Gracias. Tu reporte fue enviado.', 'Thank you. Your report was submitted.', 'Obrigado. Seu relatório foi enviado.')}</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            {personaVinculada
              ? t(`Los familiares de ${personaVinculada.nombre_completo} serán notificados por email de inmediato.`, `${personaVinculada.nombre_completo}'s family will be notified by email immediately.`, `Os familiares de ${personaVinculada.nombre_completo} serão notificados por email imediatamente.`)
              : t('Tu reporte fue registrado en el directorio de personas encontradas y puede ayudar a reunir familias.', 'Your report was added to the found people directory and can help reunite families.', 'Seu relatório foi registrado no diretório de pessoas encontradas e pode ajudar a reunir famílias.')}
          </p>
          <Link
            to="/directorio-encontrados"
            className="block w-full text-center bg-[#D48C2E] text-white font-black py-4 rounded-2xl text-base"
          >
            📋 {t('Ver directorio de encontrados', 'View found people directory', 'Ver diretório de encontrados')}
          </Link>
        </div>
        {mostrarLogin && <PostReporteLogin es={es} onSkip={() => setMostrarLogin(false)} />}
        <Link to="/" className="block text-center bg-[#1A1F2E] text-white px-6 py-4 rounded-2xl font-bold text-base">
          {t('Volver al inicio', 'Back to home', 'Voltar ao início')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 cursor-pointer hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {t('Volver', 'Go back', 'Voltar')}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🙋 {t('Encontré a alguien', 'I found someone', 'Encontrei alguém')}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {t(
            'Usa este formulario si encontraste o tienes información real sobre una persona. Escribe datos verificables. No publiques rumores.',
            'Use this form if you found or have real information about a person. Write verifiable data. Do not post rumors.',
            'Use este formulário se encontrou ou tem informação real sobre uma pessoa. Escreva dados verificáveis. Não publique rumores.'
          )}
        </p>

        <div className="flex rounded-2xl overflow-hidden border-2 border-[#EDEBE8] mb-4 bg-white">
          <button
            type="button"
            onClick={() => setModoRapido(true)}
            className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${modoRapido ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
          >⚡ {t('Modo rápido', 'Quick mode', 'Modo rápido')}</button>
          <button
            type="button"
            onClick={() => setModoRapido(false)}
            className={`flex-1 py-3 text-sm font-bold transition-colors cursor-pointer ${!modoRapido ? 'bg-[#1A1F2E] text-white' : 'text-gray-500'}`}
          >📋 {t('Modo completo', 'Full mode', 'Modo completo')}</button>
        </div>

        {/* Anti-extorsión */}
        <div className="flex gap-3 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 mb-5">
          <ShieldAlert size={18} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#B83A52] mb-0.5">{t('Alerta de seguridad', 'Security alert', 'Alerta de segurança')}</p>
            <p className="text-xs text-[#B83A52] leading-relaxed">
              {t(
                'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.',
                'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.',
                'Nunca envie dinheiro por informações. Esta plataforma não autoriza pagamentos ou resgates privados.'
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modoRapido && (
            <div className="bg-white rounded-2xl border-2 border-[#D48C2E] p-4 space-y-3">
              <p className="text-xs font-bold text-[#1A1F2E]">{es ? '⚡ Modo rápido — solo lo esencial' : '⚡ Quick mode — only essentials'}</p>
              <div>
                <input required value={form.nombre_o_descripcion} onChange={e => onNombreChange(e.target.value)}
                  placeholder={es ? 'Nombre o descripción (el sistema buscará duplicados)' : 'Name or description (system will check for duplicates)'} className={`${inputCls} mb-2`} />
                {buscando && <p className="text-[11px] text-gray-400 mt-1">🔍 {es ? 'Buscando en el directorio...' : 'Searching the directory...'}</p>}
                {posiblesCoincidencias.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-bold text-[#D48C2E]">⚠️ {es ? 'Posibles coincidencias — ¿es alguna de estas?' : 'Possible matches — is it one of these?'}</p>
                    {posiblesCoincidencias.map(p => (
                      <div key={p.id} className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1A1F2E] truncate">{p.nombre_completo}</p>
                          <p className="text-[10px] text-gray-500">{p.ciudad} · {p.edad_aprox || '—'}</p>
                        </div>
                        <button type="button" onClick={() => vincular(p)} className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 cursor-pointer">
                          ✓ {es ? 'Esta' : 'This one'}
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setPosiblesCoincidencias([])} className="text-[10px] text-gray-400 underline cursor-pointer">
                      {es ? 'No está en la lista — continuar sin vincular' : 'Not on list — continue without linking'}
                    </button>
                  </div>
                )}
                {personaVinculada && (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-green-700">✅ {es ? 'Vinculada:' : 'Linked:'} {personaVinculada.nombre_completo}</p>
                    <button type="button" onClick={() => setPersonaVinculada(null)} className="text-[10px] text-gray-400 underline cursor-pointer">{es ? 'Cambiar' : 'Change'}</button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CONDICION.map((c, i) => (
                  <button key={c.val} type="button" onClick={() => set('condicion', c.val)}
                    className={`py-3 rounded-xl text-xs font-bold border-2 cursor-pointer ${form.condicion === c.val ? c.sel : 'bg-white border-[#EDEBE8] text-gray-700'}`}>{es ? c.es : c.en}</button>
                ))}
              </div>
              <input required value={form.ubicacion_actual} onChange={e => set('ubicacion_actual', e.target.value)}
                placeholder={es ? 'Lugar donde está o fue vista' : 'Where they are or were seen'} className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <input required value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                  placeholder={es ? 'Ciudad' : 'City'} className={inputCls} />
                <input required value={form.estado_region} onChange={e => set('estado_region', e.target.value)}
                  placeholder={es ? 'Estado' : 'State'} className={inputCls} />
              </div>
              <input value={form.reportado_por_telefono} onChange={e => set('reportado_por_telefono', e.target.value)}
                placeholder={es ? 'Tu teléfono o WhatsApp (opcional)' : 'Your phone or WhatsApp (optional)'} className={inputCls} />
              <input type="email" value={form.reportado_por_email} onChange={e => set('reportado_por_email', e.target.value)}
                placeholder={es ? 'Tu email de contacto (opcional, privado)' : 'Your contact email (optional, private)'} className={inputCls} />
              <input value={form.email_contacto} onChange={e => set('email_contacto', e.target.value)}
                placeholder={es ? 'Email del lugar donde está la persona (opcional)' : 'Email of the place where the person is (optional)'} className={inputCls} />
              {!lowBw && (
                <div>
                  <p className="text-xs font-bold text-[#1A1F2E] mb-1">📷 {es ? 'Foto opcional (máx. 2)' : 'Optional photo (max 2)'}</p>
                  <FotosDragDrop category="encontrados" caseId={fotoId} caseLabel={form.nombre_o_descripcion || 'encontrado'} maxFiles={2} onUploaded={setFotoUrls} disabled={enviando} />
                </div>
              )}
            </div>
          )}

          {!modoRapido && (
            <>
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

            {posiblesCoincidencias.length > 0 && (
              <div className="space-y-2">
                {posiblesCoincidencias.map(p => (
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
                      <p className="text-xs text-gray-600">
                        {es ? 'Sus datos privados no se muestran aquí. Si vinculas esta ficha, la familia recibirá una alerta.' : 'Private contact details are hidden. If you link this record, the family will receive an alert.'}
                      </p>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setPosiblesCoincidencias([])} className="w-full text-xs text-gray-400 py-1 cursor-pointer hover:text-gray-600">
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
                <FieldLabel label={es ? 'Cédula de identidad' : 'ID number'}
                  hint={es ? 'Si la conoces o si es legible' : 'If known or readable'} />
                <input
                  placeholder={es ? 'Ej: V-12345678' : 'E.g: V-12345678'}
                  value={form.cedula}
                  onChange={e => set('cedula', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel label={es ? 'Edad aprox.' : 'Approx. age'} />
                <input placeholder={es ? 'Ej: 40' : 'E.g: 40'} value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <FieldLabel label={es ? 'Sexo' : 'Sex'} />
              <div className="flex gap-2">
                {[
                  { val: 'femenino', es: '♀ Femenino', en: '♀ Female' },
                  { val: 'masculino', es: '♂ Masculino', en: '♂ Male' },
                  { val: '', es: '❓ No sé', en: '❓ Unknown' },
                ].map(s => (
                  <button key={s.val} type="button" onClick={() => set('sexo', s.val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${form.sexo === s.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                    {es ? s.es : s.en}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel label={es ? 'Descripción física' : 'Physical description'}
                hint={es ? 'Ropa, cabello, señas particulares, cicatrices, tatuajes...' : 'Clothing, hair, marks, scars, tattoos...'} />
              <textarea rows={2} placeholder={es ? 'Ej: Cabello negro corto, camisa azul, 1.70m, cicatriz en mejilla izquierda...' : 'E.g: Short black hair, blue shirt, 5\'7", scar on left cheek...'} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} className={`${inputCls} resize-none`} />
            </div>

            {/* Foto para identificar */}
            {!lowBw && (
              <div className="bg-[#F0F4FD] border border-blue-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-blue-800">
                  📷 {es ? 'Foto para identificación (opcional, muy útil)' : 'Photo for identification (optional, very helpful)'}
                </p>
                <p className="text-xs text-blue-700">
                  {es ? 'Una foto ayuda a los familiares a confirmar la identidad de la persona.' : 'A photo helps family members confirm the person\'s identity.'}
                </p>
                <FotosDragDrop category="encontrados" caseId={fotoId} caseLabel={form.nombre_o_descripcion || 'encontrado'} maxFiles={2} onUploaded={setFotoUrls} disabled={enviando} />
              </div>
            )}

            <div>
              <FieldLabel label={es ? '¿Cuándo lo/la encontraste?' : 'When did you find them?'}
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



          {/* Sección 4: Quién reporta */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '4. Tu información (quién reporta)' : '4. Your information (reporter)'}</h3>
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
            <div>
              <FieldLabel label={es ? 'Red social o WhatsApp' : 'Social media or WhatsApp'}
                hint={es ? 'Instagram, Telegram, WhatsApp... para que puedan contactarte' : 'Instagram, Telegram, WhatsApp... so they can reach you'} />
              <input placeholder={es ? 'Ej: @usuario, +58 414...' : 'E.g: @username, +58 414...'} value={form.reportado_por_red_social} onChange={e => set('reportado_por_red_social', e.target.value)} className={inputCls} />
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
            </>
          )}
          {modoRapido && (
            <>
              {resultado === 'err' && (
                <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
                  ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
                </div>
              )}
              <button
                type="submit"
                disabled={enviando || !form.nombre_o_descripcion || !form.condicion || !form.ubicacion_actual || !form.ciudad || !form.estado_region}
                className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {enviando ? <Loader2 size={20} className="animate-spin" /> : '🙋'}
                {es ? 'Enviar reporte rápido' : 'Submit quick report'}
              </button>
              <p className="text-center text-xs text-gray-400">{es ? 'En modo rápido. Cambia a versión completa si tienes más datos.' : 'Quick mode. Switch to full version if you have more data.'}</p>
            </>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}