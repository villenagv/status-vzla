import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const TIPO_PISTA = [
  { val: 'vi_directamente',      es: '👁️ La vi personalmente',             en: '👁️ I saw them in person' },
  { val: 'me_contaron',          es: '💬 Me contaron sobre ella/él',        en: '💬 Someone told me about them' },
  { val: 'vi_en_foto',           es: '📷 La vi en foto o video',            en: '📷 I saw them in a photo or video' },
  { val: 'informacion_ubicacion',es: '📍 Tengo información de su ubicación', en: '📍 I have location information' },
  { val: 'otra',                 es: '💡 Otra información',                  en: '💡 Other information' },
];

const ESTADO_PISTA = [
  { val: 'a_salvo',       es: '✅ A salvo',              en: '✅ Safe' },
  { val: 'lesiones_leves', es: '🟡 Con lesiones leves',  en: '🟡 Minor injuries' },
  { val: 'lesiones_graves',es: '🔴 Con lesiones graves', en: '🔴 Severe injuries' },
  { val: 'no_se',         es: '❓ No lo sé',             en: '❓ I don\'t know' },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 placeholder-gray-400";

export default function Pista() {
  const [params] = useSearchParams();
  const personaId = params.get('persona');
  const { lang } = useLang();
  const es = lang === 'es';

  const [persona, setPersona] = useState(null);
  const [tipo, setTipo] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contacto, setContacto] = useState('');
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!personaId) return;
    base44.entities.PersonasBuscadas.get(personaId)
      .then(p => setPersona(p))
      .catch(() => {});
  }, [personaId]);

  const handleSubmit = async () => {
    if (!tipo || !ubicacion) return;
    setEnviando(true);
    setError(false);
    try {
      await base44.entities.PistasPersonas.create({
        persona_id: personaId,
        tipo_pista: tipo,
        ubicacion_pista: ubicacion,
        fecha_pista: fecha,
        estado_persona_pista: estado || 'no_se',
        descripcion,
        contacto_informante: contacto,
        nombre_informante: nombre,
      });
      // Actualizar estado de la persona a "con pistas"
      if (persona?.estado_caso === 'buscando') {
        await base44.entities.PersonasBuscadas.update(personaId, { estado_caso: 'informacion_recibida' });
      }
      // Notificar a suscriptores de la actualización (solo si hay un cambio real)
      if (persona) {
        base44.functions.invoke('notificarActualizacion', {
          persona_id: personaId,
          tipo_evento: 'actualizado',
          datos_persona: {
            nombre_completo: persona.nombre_completo || 'Persona',
            estado_caso: 'informacion_recibida',
            ubicacion: ubicacion,
          },
          lang: lang,
        }).catch(() => {});
      }
      setOk(true);
    } catch {
      setError(true);
    }
    setEnviando(false);
  };

  if (ok) return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
        <div className="text-5xl">💡</div>
        <h2 className="text-xl font-semibold text-gray-900">{es ? 'Pista enviada.' : 'Lead submitted.'}</h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          {es
            ? `Tu información sobre ${persona?.nombre_completo || 'esta persona'} fue registrada y la familia fue notificada.`
            : `Your information about ${persona?.nombre_completo || 'this person'} was recorded and the family was notified.`}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {personaId && (
            <Link to={`/persona?id=${personaId}`}
              className="bg-blue-600 text-white font-medium py-3 rounded-xl text-sm text-center no-underline">
              {es ? 'Ver ficha de la persona' : 'View person\'s record'}
            </Link>
          )}
          <Link to="/personas" className="border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm text-center no-underline">
            {es ? 'Volver al directorio' : 'Back to directory'}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        {personaId ? (
          <Link to={`/persona?id=${personaId}`} className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800">
            <ChevronLeft size={16} /> {es ? 'Volver a la ficha' : 'Back to record'}
          </Link>
        ) : (
          <Link to="/personas" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800">
            <ChevronLeft size={16} /> {es ? 'Directorio' : 'Directory'}
          </Link>
        )}

        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          💡 {es ? 'Dejar una pista' : 'Leave a lead'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Usa este formulario si tienes información real sobre esta persona. No publiques rumores. Tus datos de contacto no serán visibles públicamente.'
            : 'Use this form if you have real information about this person. Do not share rumors. Your contact details will not be public.'}
        </p>

        {/* Mini-tarjeta de la persona */}
        {persona && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
            {persona.foto_url
              ? <img src={persona.foto_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">👤</div>
            }
            <div>
              <p className="text-sm font-medium text-blue-900">{persona.nombre_completo}</p>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <MapPin size={10} /> {persona.ultima_ubicacion_conocida} · {persona.ciudad}
              </p>
            </div>
          </div>
        )}

        {!personaId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs text-amber-800">
              {es ? '⚠️ No se especificó una persona. Ve al directorio y elige a quién dejarle la pista.' : '⚠️ No person specified. Go to the directory and choose who to leave a lead for.'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* 1. Tipo de información */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-3">
              1. {es ? '¿Qué tipo de información tienes?' : 'What type of information do you have?'} <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-1.5">
              {TIPO_PISTA.map(t => (
                <button key={t.val} onClick={() => setTipo(t.val)}
                  className={`w-full py-2.5 px-3 rounded-lg text-sm text-left border cursor-pointer transition-colors ${tipo === t.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                  {es ? t.es : t.en}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dónde */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-800">
              2. {es ? '¿Dónde?' : 'Where?'} <span className="text-red-500">*</span>
            </h3>
            <input value={ubicacion} onChange={e => setUbicacion(e.target.value)}
              placeholder={es ? 'Ej: Refugio San José, Av. Principal, La Guaira' : 'E.g: San José shelter, Main Ave, La Guaira'}
              className={inputCls} />
          </div>

          {/* 3. Cuándo */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">
              3. {es ? '¿Cuándo? (opcional)' : 'When? (optional)'}
            </h3>
            <input value={fecha} onChange={e => setFecha(e.target.value)}
              placeholder={es ? 'Ej: Hoy a las 2 PM, ayer por la mañana...' : 'E.g: Today at 2 PM, yesterday morning...'}
              className={inputCls} />
          </div>

          {/* 4. Cómo estaba */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-3">
              4. {es ? '¿Cómo estaba? (opcional)' : 'How were they? (optional)'}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ESTADO_PISTA.map(e => (
                <button key={e.val} onClick={() => setEstado(e.val)}
                  className={`py-2.5 px-3 rounded-lg text-xs text-left border cursor-pointer transition-colors ${estado === e.val ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                  {es ? e.es : e.en}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Descripción */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-800 mb-2">
              5. {es ? 'Descripción (opcional)' : 'Description (optional)'}
            </h3>
            <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={300}
              placeholder={es ? 'Cualquier detalle que pueda ayudar...' : 'Any detail that might help...'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400 resize-none placeholder-gray-400" />
            <p className="text-right text-[10px] text-gray-400">{descripcion.length}/300</p>
          </div>

          {/* 6. Tu contacto */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-800">
              6. {es ? 'Tu contacto (opcional)' : 'Your contact (optional)'}
            </h3>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-800">
                🔒 {es ? 'Solo visible para el familiar que reportó. No se publica.' : 'Only visible to the person who filed the report. Not published.'}
              </p>
            </div>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
              className={inputCls} />
            <input value={contacto} onChange={e => setContacto(e.target.value)}
              placeholder={es ? 'Teléfono o WhatsApp (opcional)' : 'Phone or WhatsApp (optional)'}
              className={inputCls} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={enviando || !tipo || !ubicacion || !personaId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium py-4 rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer">
            {enviando ? <Loader2 size={18} className="animate-spin" /> : '💡'}
            {es ? 'Enviar pista' : 'Send lead'}
          </button>
          <p className="text-center text-xs text-gray-400">
            {es ? 'La familia de esta persona será notificada al instante.' : 'This person\'s family will be notified instantly.'}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}