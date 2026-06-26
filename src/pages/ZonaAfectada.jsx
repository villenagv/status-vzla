import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const SITUACION = [
  { val: 'a_salvo',     es: '✅ Estoy bien',                       en: '✅ I am OK' },
  { val: 'necesita_ayuda', es: '🆘 Necesito ayuda',                 en: '🆘 I need help' },
  { val: 'herido',      es: '🟡 Estoy con mi familia o grupo',      en: '🟡 I am with family or group' },
  { val: 'atrapado',    es: '🔴 Estoy atrapado o no puedo moverme', en: '🔴 Trapped or cannot move' },
  { val: 'traslado',    es: '🚗 Necesito traslado',                 en: '🚗 Need transport' },
  { val: 'atencion_urgente', es: '🏥 Necesito atención médica',     en: '🏥 Need medical attention' },
];

const NECESIDADES = [
  { val: 'agua',          es: '💧 Agua',                  en: '💧 Water' },
  { val: 'comida',        es: '🍞 Comida',                en: '🍞 Food' },
  { val: 'medicinas',     es: '💊 Medicinas',             en: '💊 Medicine' },
  { val: 'atencion_med',  es: '🏥 Atención médica',       en: '🏥 Medical care' },
  { val: 'refugio',       es: '🏠 Refugio',               en: '🏠 Shelter' },
  { val: 'transporte',    es: '🚗 Transporte',            en: '🚗 Transport' },
  { val: 'rescate',       es: '🆘 Rescate',               en: '🆘 Rescue' },
  { val: 'comunicacion',  es: '📱 Comunicarme c/ familia', en: '📱 Contact family' },
  { val: 'ninos',         es: '👶 Ayuda para niños',      en: '👶 Help for children' },
  { val: 'adultos_mayores',es:'👴 Adultos mayores',       en: '👴 Elderly people' },
  { val: 'discapacidad',  es: '♿ Persona con discapacidad', en: '♿ Person with disability' },
];

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

export default function ZonaAfectada() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [subModo, setSubModo] = useState(''); // '' | 'reportar' | 'ayuda' | 'refugio'
  const [situacion, setSituacion] = useState('');
  const [necesidades, setNecesidades] = useState([]);
  const [form, setForm] = useState({ ciudad: '', estado_region: '', ubicacion_texto: '', nombre: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleNec = (val) => setNecesidades(prev => prev.includes(val) ? prev.filter(n => n !== val) : [...prev, val]);

  const esCritico = ['atrapado', 'atencion_urgente'].includes(situacion);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    try {
      const persona = await base44.entities.PersonaCRIS.create({
        nombre: form.nombre,
        ciudad: form.ciudad,
        estado_region: form.estado_region,
        ubicacion_texto: form.ubicacion_texto,
        estado_actual: situacion || 'necesita_ayuda',
        nivel_verificacion: 'sin_verificar',
        fuente_inicial: 'ciudadano',
        notas_publicas: `${necesidades.join(', ')}. ${form.mensaje}`.trim(),
      });
      await base44.entities.EventoHistorial.create({
        persona_id: persona.id,
        tipo_evento: 'reportado',
        descripcion: `${situacion}. Necesidades: ${necesidades.join(', ')}. ${form.mensaje}`,
        ubicacion_texto: form.ubicacion_texto,
        ciudad: form.ciudad,
        fuente: 'ciudadano',
        nivel_confianza: 'medio',
        es_sensible: false,
        reportante_nombre: form.nombre,
      });
      setOk(true);
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  };

  if (ok) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-4 py-12">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-black text-[#1A1F2E]">{es ? 'Reporte enviado.' : 'Report sent.'}</h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{es ? 'Tu información fue registrada. Equipos de respuesta podrán verla.' : 'Your information has been registered. Response teams will be able to see it.'}</p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-8 py-4 rounded-2xl font-bold text-base">{es ? 'Volver al inicio' : 'Back to home'}</Link>
      </div>
    </div>
  );

  // Sub-menú: redirige a página de reporte de daños
  if (subModo === 'reportar') {
    window.location.href = '/reportar-dano';
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          🆘 {es ? 'Estoy en zona afectada' : 'I am in the affected area'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Elige qué necesitas hacer ahora mismo:'
            : 'Choose what you need to do right now:'}
        </p>

        {/* Sub-menú 3 opciones grandes */}
        {!subModo && (
          <div className="space-y-3 mb-6">
            <Link to="/reportar-dano"
              className="flex items-center gap-4 bg-[#B83A52] text-white rounded-2xl px-5 py-5 no-underline">
              <span className="text-3xl flex-shrink-0">🏚️</span>
              <div className="flex-1">
                <p className="font-black text-base leading-tight">{es ? 'Reportar daño o riesgo' : 'Report damage or risk'}</p>
                <p className="text-sm opacity-80 mt-0.5">{es ? 'Edificio, calle, gas, electricidad, personas atrapadas' : 'Building, street, gas, electricity, trapped people'}</p>
              </div>
              <ArrowRight size={20} className="opacity-60 flex-shrink-0" />
            </Link>

            <button onClick={() => setSubModo('ayuda')}
              className="flex items-center gap-4 bg-[#D48C2E] text-white rounded-2xl px-5 py-5 w-full text-left cursor-pointer">
              <span className="text-3xl flex-shrink-0">🏥</span>
              <div className="flex-1">
                <p className="font-black text-base leading-tight">{es ? 'Necesito ayuda o refugio' : 'I need help or shelter'}</p>
                <p className="text-sm opacity-80 mt-0.5">{es ? 'Agua, comida, médicos, rescate, transporte' : 'Water, food, doctors, rescue, transport'}</p>
              </div>
              <ArrowRight size={20} className="opacity-60 flex-shrink-0" />
            </button>

            <button onClick={() => setSubModo('refugio')}
              className="flex items-center gap-4 bg-[#1B5E20] text-white rounded-2xl px-5 py-5 w-full text-left cursor-pointer">
              <span className="text-3xl flex-shrink-0">🏕️</span>
              <div className="flex-1">
                <p className="font-black text-base leading-tight">{es ? 'Hay un refugio activo aquí cerca' : 'There is an active shelter nearby'}</p>
                <p className="text-sm opacity-80 mt-0.5">{es ? 'Informa a otros sobre este punto de ayuda' : 'Let others know about this help point'}</p>
              </div>
              <ArrowRight size={20} className="opacity-60 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Ayuda: mostrar lista de centros */}
        {subModo === 'ayuda' && (
          <div className="mb-6 space-y-3">
            <button onClick={() => setSubModo('')} className="flex items-center gap-1 text-sm text-gray-500 mb-2 cursor-pointer hover:text-[#1A1F2E]">
              <ChevronLeft size={14} /> {es ? 'Volver' : 'Back'}
            </button>
            <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-2xl px-4 py-3 mb-3">
              <p className="text-sm font-bold text-[#7A5000]">
                ⚠️ {es
                  ? 'Verifica que el centro esté activo antes de desplazarte.'
                  : 'Verify the center is active before traveling.'}
              </p>
            </div>
            <Link to="/centros-apoyo"
              className="flex items-center justify-center gap-2 bg-[#D48C2E] text-white font-black py-5 rounded-2xl text-base no-underline">
              🏥 {es ? 'Ver centros de apoyo activos' : 'View active help centers'}
            </Link>
            <Link to="/estoy-aqui"
              className="flex items-center justify-center gap-2 bg-[#1A1F2E] text-white font-bold py-4 rounded-2xl text-sm no-underline">
              📍 {es ? 'Registrar mi ubicación actual' : 'Register my current location'}
            </Link>
          </div>
        )}

        {/* Refugio: formulario rápido o ir a institucional */}
        {subModo === 'refugio' && (
          <div className="mb-6 space-y-3">
            <button onClick={() => setSubModo('')} className="flex items-center gap-1 text-sm text-gray-500 mb-2 cursor-pointer hover:text-[#1A1F2E]">
              <ChevronLeft size={14} /> {es ? 'Volver' : 'Back'}
            </button>
            <Link to="/institucional"
              className="flex items-center justify-center gap-2 bg-[#1B5E20] text-white font-black py-5 rounded-2xl text-base no-underline">
              🏕️ {es ? 'Registrar refugio o punto de ayuda' : 'Register shelter or help point'}
            </Link>
          </div>
        )}

        {/* Formulario de mi situación (debajo del sub-menú o directo) */}
        {esCritico && (
          <div className="flex gap-3 bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 mb-4">
            <AlertTriangle size={18} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-[#B83A52] leading-relaxed">
              {es
                ? 'Si tu vida está en peligro, busca ayuda inmediata con organismos de emergencia. Completa este reporte solo si puedes hacerlo de forma segura.'
                : 'If your life is in danger, seek immediate help from emergency services. Complete this report only if you can do so safely.'}
            </p>
          </div>
        )}

        {!subModo && <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-t border-[#EDEBE8] pt-4">{es ? 'O reporta tu situación personal:' : 'Or report your personal situation:'}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Situación */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '1. ¿Cuál es tu situación?' : '1. What is your situation?'}</h3>
            <div className="flex flex-col gap-2">
              {SITUACION.map(s => (
                <button key={s.val} type="button" onClick={() => setSituacion(s.val)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold border-2 text-left transition-colors cursor-pointer ${
                    situacion === s.val
                      ? (s.val === 'atrapado' || s.val === 'atencion_urgente' ? 'bg-[#B83A52] text-white border-[#B83A52]' : 'bg-[#1A1F2E] text-white border-[#1A1F2E]')
                      : 'bg-white border-[#EDEBE8] text-gray-700'
                  }`}>
                  {es ? s.es : s.en}
                </button>
              ))}
            </div>
          </div>

          {/* Necesidades */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '2. ¿Qué necesitas? (opcional)' : '2. What do you need? (optional)'}</h3>
            <div className="grid grid-cols-2 gap-2">
              {NECESIDADES.map(n => (
                <button key={n.val} type="button" onClick={() => toggleNec(n.val)}
                  className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer ${necesidades.includes(n.val) ? 'bg-[#D48C2E] text-white border-[#D48C2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                  {es ? n.es : n.en}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '3. ¿Dónde estás?' : '3. Where are you?'}</h3>
            <input placeholder={es ? 'Referencia: plaza, colegio, avenida principal...' : 'Reference: plaza, school, main avenue...'} value={form.ubicacion_texto} onChange={e => set('ubicacion_texto', e.target.value)} className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={es ? 'Ciudad' : 'City'} value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
              <input placeholder={es ? 'Estado' : 'State'} value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Nombre y mensaje */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-[#1A1F2E] mb-1.5">{es ? 'Tu nombre (opcional)' : 'Your name (optional)'}</label>
              <input placeholder={es ? 'Para que puedan identificarte' : 'So they can identify you'} value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1A1F2E] mb-1.5">{es ? 'Mensaje (opcional)' : 'Message (optional)'}</label>
              <textarea rows={3} placeholder={es ? 'Describe brevemente qué está pasando y qué necesitas...' : 'Briefly describe what is happening and what you need...'} value={form.mensaje} onChange={e => set('mensaje', e.target.value)} className="w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] resize-none placeholder-gray-400" />
            </div>
          </div>

          {error && (
            <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
              ⚠️ {es ? 'Error al enviar. Intenta de nuevo.' : 'Error submitting. Try again.'}
            </div>
          )}

          <button type="submit" disabled={enviando}
            className="w-full bg-[#B83A52] hover:bg-[#9e3046] disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
            {enviando ? <Loader2 size={20} className="animate-spin" /> : '🌍'}
            {es ? 'Enviar reporte' : 'Submit report'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}