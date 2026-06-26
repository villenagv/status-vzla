import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, MapPin, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const ESTADO_OPCIONES = [
  { val: 'a_salvo',       es: '✅ Estoy bien',                    en: '✅ I am OK' },
  { val: 'herido',        es: '🟡 Estoy herido/a, pero consciente', en: '🟡 Injured but conscious' },
  { val: 'atencion_urgente', es: '🔴 Necesito atención médica urgente', en: '🔴 Need urgent medical attention' },
  { val: 'necesita_ayuda',es: '🆘 Necesito ayuda para moverme',  en: '🆘 Need help moving' },
];

const UBICACION_TIPO = [
  { val: 'hospital',    es: '🏥 Hospital',          en: '🏥 Hospital' },
  { val: 'cdi',         es: '💊 CDI / ambulatorio',  en: '💊 Medical center' },
  { val: 'refugio',     es: '🏠 Refugio',            en: '🏠 Shelter' },
  { val: 'escuela',     es: '🏫 Escuela / liceo',    en: '🏫 School' },
  { val: 'iglesia',     es: '⛪ Iglesia',            en: '⛪ Church' },
  { val: 'plaza',       es: '🌳 Plaza / parque',     en: '🌳 Plaza / park' },
  { val: 'casa_vecino', es: '🏡 Casa de vecino',     en: '🏡 Neighbor\'s home' },
  { val: 'calle',       es: '🛣️ Calle / zona abierta', en: '🛣️ Street / open area' },
  { val: 'no_sabe',     es: '❓ No sé exactamente',  en: '❓ Not sure exactly' },
];

const NECESIDADES = [
  { val: 'agua',          es: '💧 Agua',             en: '💧 Water' },
  { val: 'comida',        es: '🍞 Comida',           en: '🍞 Food' },
  { val: 'medicinas',     es: '💊 Medicinas',        en: '💊 Medicine' },
  { val: 'traslado',      es: '🚗 Traslado',         en: '🚗 Transport' },
  { val: 'ninos',         es: '👶 Estoy con niños',  en: '👶 With children' },
  { val: 'adultos_mayores',es: '👴 Adultos mayores', en: '👴 Elderly' },
];

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

function genCodigo() {
  return 'CRIS-' + Math.random().toString(36).toUpperCase().slice(2, 8);
}

export default function EstoyAqui() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [form, setForm] = useState({
    nombre: '', apellido: '', apodo: '', edad_aproximada: '',
    telefono_parcial: '', familiar_nombre: '',
    ubicacion_tipo: '', ubicacion_texto: '',
    ciudad: '', estado_region: '',
    estado_actual: '', necesidades: [],
    mensaje: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [codigoCRIS, setCodigoCRIS] = useState(null);
  const [error, setError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleNec = (val) => setForm(f => ({
    ...f,
    necesidades: f.necesidades.includes(val)
      ? f.necesidades.filter(n => n !== val)
      : [...f.necesidades, val],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    const codigo = genCodigo();
    try {
      const persona = await base44.entities.PersonaCRIS.create({
        nombre: form.nombre,
        apellido: form.apellido,
        apodo: form.apodo,
        edad_aproximada: form.edad_aproximada,
        telefono_parcial: form.telefono_parcial,
        ubicacion_texto: `${form.ubicacion_tipo ? form.ubicacion_tipo + ' — ' : ''}${form.ubicacion_texto}`,
        ciudad: form.ciudad,
        estado_region: form.estado_region,
        estado_actual: form.estado_actual || 'estoy_aqui',
        nivel_verificacion: 'sin_verificar',
        codigo_cris: codigo,
        fuente_inicial: 'ciudadano',
        notas_publicas: form.mensaje,
      });
      await base44.entities.EventoHistorial.create({
        persona_id: persona.id,
        tipo_evento: 'estoy_aqui',
        descripcion: form.mensaje || (es ? 'La persona reportó que está viva y registró su ubicación.' : 'Person reported being alive and registered their location.'),
        ubicacion_texto: form.ubicacion_texto,
        ciudad: form.ciudad,
        fuente: 'ciudadano',
        nivel_confianza: 'medio',
        es_sensible: false,
        reportante_nombre: `${form.nombre} ${form.apellido}`.trim(),
      });
      setCodigoCRIS(codigo);
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  };

  if (codigoCRIS) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-5 py-12">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-black text-[#1A1F2E]">{es ? 'Tu reporte fue registrado.' : 'Your report was registered.'}</h2>
        <div className="bg-[#1A1F2E] text-white rounded-2xl px-6 py-4 w-full max-w-xs">
          <p className="text-xs text-gray-400 mb-1">{es ? 'Tu código CRIS:' : 'Your CRIS code:'}</p>
          <p className="text-2xl font-black tracking-widest">{codigoCRIS}</p>
          <p className="text-xs text-gray-400 mt-1">{es ? 'Guarda este código o toma una captura de pantalla.' : 'Save this code or take a screenshot.'}</p>
        </div>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          {es ? 'Puedes actualizar tu estado más tarde usando este código.' : 'You can update your status later using this code.'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link to="/fuera-zona" className="bg-[#D48C2E] text-white font-black py-4 rounded-2xl text-center text-sm">
            {es ? '→ Buscar a mi familia fuera de la zona' : '→ Find my family outside the area'}
          </Link>
          <Link to="/" className="bg-[#1A1F2E] text-white font-bold py-3 rounded-2xl text-center text-sm">
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

        <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">
          📍 {es ? 'Estoy aquí' : 'I am here'}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Usa esta opción si estás vivo/a y quieres avisar dónde estás, cómo estás o buscar a tu familia. No hace falta saberlo todo.'
            : 'Use this option if you are alive and want to say where you are, how you are, or find your family. You don\'t need to know everything.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Datos básicos */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '1. ¿Quién eres?' : '1. Who are you?'}</h3>
            <p className="text-xs text-gray-400">{es ? 'Escribe solo lo que recuerdes o sepas. Todo es opcional.' : 'Write only what you remember or know. Everything is optional.'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Nombre' : 'First name'}</label>
                <input placeholder={es ? 'María' : 'María'} value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Apellido' : 'Last name'}</label>
                <input placeholder={es ? 'González' : 'González'} value={form.apellido} onChange={e => set('apellido', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Apodo (opcional)' : 'Nickname (opt.)'}</label>
                <input placeholder="Marite" value={form.apodo} onChange={e => set('apodo', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Edad aprox.' : 'Approx. age'}</label>
                <input placeholder="35" value={form.edad_aproximada} onChange={e => set('edad_aproximada', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Teléfono / WhatsApp' : 'Phone / WhatsApp'}</label>
                <input placeholder="+58..." value={form.telefono_parcial} onChange={e => set('telefono_parcial', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Familiar que te busca' : 'Family looking for you'}</label>
                <input placeholder={es ? 'Ej: mi mamá Carmen' : 'E.g: my mom Carmen'} value={form.familiar_nombre} onChange={e => set('familiar_nombre', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E] flex items-center gap-2">
              <MapPin size={16} className="text-[#D48C2E]" /> {es ? '2. ¿Dónde estás?' : '2. Where are you?'}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {UBICACION_TIPO.map(u => (
                <button key={u.val} type="button" onClick={() => set('ubicacion_tipo', u.val)}
                  className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-colors text-center cursor-pointer ${form.ubicacion_tipo === u.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                  {es ? u.es : u.en}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Referencia del lugar' : 'Location reference'}</label>
              <input
                placeholder={es ? 'Ej: cerca de la plaza, frente al colegio, en el CDI...' : 'E.g: near the plaza, across from school, at the CDI...'}
                value={form.ubicacion_texto}
                onChange={e => set('ubicacion_texto', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Ciudad' : 'City'}</label>
                <input placeholder="Caracas" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1A1F2E] mb-1">{es ? 'Estado' : 'State'}</label>
                <input placeholder="Miranda" value={form.estado_region} onChange={e => set('estado_region', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Estado actual */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '3. ¿Cómo estás?' : '3. How are you?'}</h3>
            <div className="flex flex-col gap-2">
              {ESTADO_OPCIONES.map(o => (
                <button key={o.val} type="button" onClick={() => set('estado_actual', o.val)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold border-2 text-left transition-colors cursor-pointer ${
                    form.estado_actual === o.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'
                  }`}>
                  {es ? o.es : o.en}
                </button>
              ))}
            </div>
          </div>

          {/* Necesidades */}
          <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-base font-black text-[#1A1F2E]">{es ? '4. ¿Qué necesitas? (opcional)' : '4. What do you need? (optional)'}</h3>
            <div className="grid grid-cols-2 gap-2">
              {NECESIDADES.map(n => (
                <button key={n.val} type="button" onClick={() => toggleNec(n.val)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer ${form.necesidades.includes(n.val) ? 'bg-[#D48C2E] text-white border-[#D48C2E]' : 'bg-white border-[#EDEBE8] text-gray-700'}`}>
                  {es ? n.es : n.en}
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-bold text-[#1A1F2E] mb-1.5">{es ? 'Mensaje (opcional)' : 'Message (optional)'}</label>
            <textarea
              rows={3}
              placeholder={es ? 'Ej: Estoy vivo. Estoy en el refugio del liceo cerca de la plaza. Por favor avísenle a mi mamá Carmen.' : 'E.g: I am alive. I am at the school shelter near the plaza. Please tell my mom Carmen.'}
              value={form.mensaje}
              onChange={e => set('mensaje', e.target.value)}
              className="w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] resize-none placeholder-gray-400"
            />
          </div>

          {error && (
            <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
              ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-[#B83A52] hover:bg-[#9e3046] disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {enviando ? <Loader2 size={20} className="animate-spin" /> : '📍'}
            {es ? 'Publicar que estoy aquí' : 'Publish that I am here'}
          </button>

          <div className="bg-[#F0F4FD] rounded-2xl px-4 py-3">
            <p className="text-xs text-blue-800 font-medium">
              🔒 {es ? 'Tu teléfono y datos privados no se mostrarán públicamente.' : 'Your phone and private data will not be shown publicly.'}
            </p>
          </div>

          <div className="text-center">
            <Link to="/fuera-zona" className="text-sm text-[#D48C2E] underline underline-offset-2 font-semibold">
              {es ? '→ Quiero encontrar a mi familia fuera de la zona' : '→ I want to find my family outside the area'}
            </Link>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}