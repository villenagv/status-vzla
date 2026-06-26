import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import { useLowBw } from '@/lib/LowBwContext';
import TopBar from '@/components/svzla/TopBar';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const SEXO = [
  { val: 'femenino', es: 'Femenino', en: 'Female' },
  { val: 'masculino', es: 'Masculino', en: 'Male' },
  { val: 'otro', es: 'Otro / No sé', en: 'Other / Unknown' },
];

export default function BuscarPersona() {
  const { lang } = useLang();
  const { lowBw } = useLowBw();
  const es = lang === 'es';

  const [form, setForm] = useState({
    nombre_completo: '',
    apodo: '',
    edad_aprox: '',
    sexo: '',
    descripcion_fisica: '',
    ultima_ubicacion_conocida: '',
    ciudad: '',
    estado_region: '',
    fecha_ultima_vez: '',
    telefono_persona: '',
    email_persona: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: '',
    contacto_whatsapp: '',
    notas_publicas: '',
  });
  const [fotoUrls, setFotoUrls] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [personaId] = useState(() => `persona-${Date.now()}`);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await base44.entities.PersonasBuscadas.create({
        ...form,
        foto_url: fotoUrls[0] || '',
        fuente: 'web_publica',
        estado_caso: 'buscando',
      });
      setResultado('ok');
    } catch {
      setResultado('err');
    } finally {
      setEnviando(false);
    }
  };

  if (resultado === 'ok') return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">
          {es ? 'Reporte enviado.' : 'Report submitted.'}
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          {es
            ? 'La información fue registrada. Si alguien la encuentra, usaremos tu contacto para avisarte.'
            : 'The information was recorded. If someone finds them, we will use your contact to notify you.'}
        </p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">
          {es ? 'Volver al inicio' : 'Back to home'}
        </Link>
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

        {/* Header */}
        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">
          {es ? '🔎 Estoy buscando a alguien' : '🔎 I am looking for someone'}
        </h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          {es
            ? 'Completa este formulario con la información que tienes. No necesitas saberlo todo. Tus datos de contacto no se publicarán.'
            : 'Fill in this form with the information you have. You don\'t need to know everything. Your contact details will not be published.'}
        </p>

        {/* Anti-extortion warning */}
        <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 mb-5">
          <ShieldAlert size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52] leading-relaxed">
            {es
              ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos, rescates privados ni intermediarios anónimos. Si alguien pide dinero, repórtalo.'
              : 'Never send money in exchange for information. This platform does not authorize payments, private rescue fees, or anonymous intermediaries. If someone asks for money, report it.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Sección 1: Datos de la persona ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              {es ? '1. Datos de la persona buscada' : '1. Information about the missing person'}
            </h3>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Nombre completo' : 'Full name'} *
              </label>
              <input
                required
                placeholder={es ? 'Ej: María González Pérez' : 'E.g: María González Pérez'}
                value={form.nombre_completo}
                onChange={e => set('nombre_completo', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? 'Apodo (opcional)' : 'Nickname (optional)'}
                </label>
                <input
                  placeholder={es ? 'Ej: Marite' : 'E.g: Marite'}
                  value={form.apodo}
                  onChange={e => set('apodo', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? 'Edad aprox.' : 'Approx. age'}
                </label>
                <input
                  placeholder={es ? 'Ej: 35 años' : 'E.g: 35 years'}
                  value={form.edad_aprox}
                  onChange={e => set('edad_aprox', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-2">
                {es ? 'Sexo' : 'Sex'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {SEXO.map(s => (
                  <button
                    key={s.val} type="button"
                    onClick={() => set('sexo', s.val)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      form.sexo === s.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-600'
                    }`}
                  >{es ? s.es : s.en}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Descripción física (opcional)' : 'Physical description (optional)'}
              </label>
              <textarea
                rows={2}
                placeholder={es ? 'Ej: cabello negro corto, ropa azul, 1.65m...' : 'E.g: short black hair, blue clothing, 5\'5"...'}
                value={form.descripcion_fisica}
                onChange={e => set('descripcion_fisica', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none"
              />
            </div>
          </div>

          {/* ── Sección 2: Última ubicación ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              {es ? '2. Última ubicación conocida' : '2. Last known location'}
            </h3>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Lugar específico' : 'Specific place'} *
              </label>
              <input
                required
                placeholder={es ? 'Ej: Av. Libertador cerca del metro Chacaíto' : 'E.g: Av. Libertador near Chacaíto metro station'}
                value={form.ultima_ubicacion_conocida}
                onChange={e => set('ultima_ubicacion_conocida', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Ciudad' : 'City'} *</label>
                <input
                  required
                  placeholder="Caracas"
                  value={form.ciudad}
                  onChange={e => set('ciudad', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Estado' : 'State'} *</label>
                <input
                  required
                  placeholder="Miranda"
                  value={form.estado_region}
                  onChange={e => set('estado_region', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Fecha / hora aproximada' : 'Approximate date / time'}
              </label>
              <input
                type="datetime-local"
                value={form.fecha_ultima_vez}
                onChange={e => set('fecha_ultima_vez', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          {/* ── Sección 3: Contacto de la persona ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              {es ? '3. Datos de contacto de la persona (si los tienes)' : '3. Missing person\'s contact info (if known)'}
            </h3>
            <p className="text-xs text-gray-400">
              {es ? 'No se publicarán. Solo se usarán internamente si la persona es encontrada.' : 'Not published. Only used internally if the person is found.'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? 'Teléfono de la persona' : 'Person\'s phone'}
                </label>
                <input
                  placeholder="+58..."
                  value={form.telefono_persona}
                  onChange={e => set('telefono_persona', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? 'Email de la persona' : 'Person\'s email'}
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email_persona}
                  onChange={e => set('email_persona', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
            </div>
          </div>

          {/* ── Sección 4: Tu contacto (quien busca) ── */}
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">
              {es ? '4. Tu contacto — para avisarte si la encontramos' : '4. Your contact — to notify you if found'}
            </h3>
            <p className="text-xs text-gray-400">
              {es ? 'Esta información no se mostrará públicamente.' : 'This information will not be shown publicly.'}
            </p>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Tu nombre' : 'Your name'}
              </label>
              <input
                placeholder={es ? 'Ej: Carlos García' : 'E.g: Carlos García'}
                value={form.contacto_nombre}
                onChange={e => set('contacto_nombre', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? 'Tu teléfono' : 'Your phone'} *
                </label>
                <input
                  required
                  placeholder="+58..."
                  value={form.contacto_telefono}
                  onChange={e => set('contacto_telefono', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                  {es ? 'Tu WhatsApp' : 'Your WhatsApp'}
                </label>
                <input
                  placeholder="+58..."
                  value={form.contacto_whatsapp}
                  onChange={e => set('contacto_whatsapp', e.target.value)}
                  className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Tu email' : 'Your email'}
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.contacto_email}
                onChange={e => set('contacto_email', e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          {/* Notas públicas */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
              {es ? 'Información adicional (opcional, se mostrará públicamente)' : 'Additional info (optional, shown publicly)'}
            </label>
            <textarea
              rows={2}
              placeholder={es ? 'Ej: Salió de casa a las 8am, no volvió. Tiene una cicatriz en el brazo derecho...' : 'E.g: Left home at 8am, did not return. Has a scar on right arm...'}
              value={form.notas_publicas}
              onChange={e => set('notas_publicas', e.target.value)}
              className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none"
            />
          </div>

          {/* Foto */}
          {!lowBw && (
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">
                {es ? 'Foto de la persona (máx. 2, opcional)' : 'Photo of the person (max 2, optional)'}
              </label>
              <FotosDragDrop
                category="personas"
                caseId={personaId}
                caseLabel={form.nombre_completo || 'persona-nueva'}
                maxFiles={2}
                onUploaded={setFotoUrls}
                disabled={enviando}
              />
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
            {es ? 'Registrar búsqueda' : 'Register search'}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            {es
              ? 'Tus datos de contacto no se publicarán. Solo se usan para notificarte si hay información.'
              : 'Your contact details will not be published. They are only used to notify you if there is information.'}
          </p>
        </form>
      </div>
    </div>
  );
}