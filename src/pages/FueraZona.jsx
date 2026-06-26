import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const MODO = [
  { val: 'buscar',   es: '🔎 Busco a alguien en la zona afectada',    en: '🔎 Looking for someone in the area' },
  { val: 'mensaje',  es: '💬 Quiero que mi familiar me encuentre',     en: '💬 I want my family to find me' },
  { val: 'ayudar',   es: '🤝 Puedo ayudar',                          en: '🤝 I can help' },
];

const RELACION = ['Mamá', 'Papá', 'Hijo/a', 'Hermano/a', 'Pareja', 'Abuelo/a', 'Tío/a', 'Vecino/a', 'Otro'];
const RELACION_EN = ['Mom', 'Dad', 'Son/Daughter', 'Brother/Sister', 'Partner', 'Grandparent', 'Uncle/Aunt', 'Neighbor', 'Other'];

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

export default function FueraZona() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [modo, setModo] = useState('');
  const [form, setForm] = useState({ mi_nombre: '', mi_telefono: '', mi_ciudad: '', mi_pais: '', mi_email: '' });
  const [familiares, setFamiliares] = useState([{ nombre: '', apellido: '', relacion: '', edad: '', ultima_ubicacion: '', telefono: '' }]);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addFamiliar = () => setFamiliares(prev => [...prev, { nombre: '', apellido: '', relacion: '', edad: '', ultima_ubicacion: '', telefono: '' }]);
  const setFamiliar = (i, k, v) => setFamiliares(prev => prev.map((f, idx) => idx === i ? { ...f, [k]: v } : f));
  const removeFamiliar = (i) => setFamiliares(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(false);
    try {
      for (const fam of familiares) {
        if (!fam.nombre) continue;
        await base44.entities.AlertaFamiliar.create({
          persona_buscada_nombre: fam.nombre,
          persona_buscada_apellido: fam.apellido,
          persona_buscada_edad: fam.edad,
          ultima_ubicacion: fam.ultima_ubicacion,
          familiar_nombre: form.mi_nombre,
          familiar_relacion: fam.relacion,
          familiar_telefono: form.mi_telefono,
          familiar_email: form.mi_email,
          familiar_ciudad: form.mi_ciudad,
          familiar_pais: form.mi_pais,
          esta_fuera_zona: true,
          mensaje_para_buscado: mensaje || `${es ? 'Estoy fuera de la zona. Estoy bien. Te estoy buscando.' : 'I am outside the area. I am safe. I am looking for you.'}`,
          estado_alerta: 'activa',
        });
      }
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
        <h2 className="text-2xl font-black text-[#1A1F2E]">{es ? 'Mensaje registrado.' : 'Message registered.'}</h2>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          {es
            ? 'Si tu familiar usa CRIS, podremos mostrarle que lo estás buscando y dónde puede contactarte.'
            : 'If your family member uses CRIS, we can show them that you are looking for them and how to contact you.'}
        </p>
        <Link to="/" className="bg-[#1A1F2E] text-white px-8 py-4 rounded-2xl font-bold text-base">{es ? 'Volver al inicio' : 'Back to home'}</Link>
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
          ✈️ {es ? 'Estoy fuera de la zona' : "I'm outside the affected area"}
        </h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Usa esta opción si estás a salvo fuera del área afectada, buscas a alguien o quieres dejar un mensaje para que tu familiar pueda encontrarte.'
            : 'Use this option if you are safe outside the affected area, looking for someone, or want to leave a message so your family can find you.'}
        </p>

        {/* Selección de modo */}
        {!modo && (
          <div className="space-y-2.5">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-4 py-3 mb-1">
              <p className="text-sm font-bold text-green-800">✅ {es ? 'Entendemos que estás a salvo. ¿Qué quieres hacer?' : 'We understand you are safe. What would you like to do?'}</p>
            </div>
            {MODO.map(m => (
              <button key={m.val} onClick={() => setModo(m.val)}
                className="w-full flex items-center gap-4 bg-white border-2 border-[#EDEBE8] rounded-2xl px-5 py-4 text-left hover:border-[#1A1F2E] transition-colors cursor-pointer">
                <span className="text-2xl">{m.val === 'buscar' ? '🔎' : m.val === 'mensaje' ? '💬' : '🤝'}</span>
                <span className="font-bold text-base text-[#1A1F2E]">{es ? m.es : m.en}</span>
              </button>
            ))}
          </div>
        )}

        {/* Modo: buscar / mensaje */}
        {(modo === 'buscar' || modo === 'mensaje') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mis datos */}
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-base font-black text-[#1A1F2E]">{es ? '1. Tu información' : '1. Your information'}</h3>
              <div className="bg-[#F0F4FD] rounded-xl px-3 py-2 mb-1">
                <p className="text-xs text-blue-800 font-medium">🔒 {es ? 'No se publicará públicamente.' : 'Will not be shown publicly.'}</p>
              </div>
              <input placeholder={es ? 'Tu nombre' : 'Your name'} value={form.mi_nombre} onChange={e => set('mi_nombre', e.target.value)} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={es ? 'Tu teléfono / WhatsApp' : 'Your phone / WhatsApp'} value={form.mi_telefono} onChange={e => set('mi_telefono', e.target.value)} className={inputCls} />
                <input type="email" placeholder={es ? 'Tu email' : 'Your email'} value={form.mi_email} onChange={e => set('mi_email', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={es ? 'Ciudad donde estás' : 'Your city'} value={form.mi_ciudad} onChange={e => set('mi_ciudad', e.target.value)} className={inputCls} />
                <input placeholder={es ? 'País' : 'Country'} value={form.mi_pais} onChange={e => set('mi_pais', e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Familiares */}
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-4 space-y-3">
              <h3 className="text-base font-black text-[#1A1F2E]">{es ? '2. ¿A quién buscas?' : '2. Who are you looking for?'}</h3>
              {familiares.map((fam, i) => (
                <div key={i} className="bg-[#F4F4F8] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500">{es ? `Familiar ${i + 1}` : `Family member ${i + 1}`}</p>
                    {familiares.length > 1 && (
                      <button type="button" onClick={() => removeFamiliar(i)} className="text-[#B83A52] cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder={es ? 'Nombre' : 'First name'} value={fam.nombre} onChange={e => setFamiliar(i, 'nombre', e.target.value)} className={inputCls} />
                    <input placeholder={es ? 'Apellido' : 'Last name'} value={fam.apellido} onChange={e => setFamiliar(i, 'apellido', e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={fam.relacion} onChange={e => setFamiliar(i, 'relacion', e.target.value)} className={inputCls}>
                      <option value="">{es ? 'Relación' : 'Relation'}</option>
                      {(es ? RELACION : RELACION_EN).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input placeholder={es ? 'Edad aprox.' : 'Approx. age'} value={fam.edad} onChange={e => setFamiliar(i, 'edad', e.target.value)} className={inputCls} />
                  </div>
                  <input placeholder={es ? 'Última ubicación conocida' : 'Last known location'} value={fam.ultima_ubicacion} onChange={e => setFamiliar(i, 'ultima_ubicacion', e.target.value)} className={inputCls} />
                </div>
              ))}
              <button type="button" onClick={addFamiliar}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#EDEBE8] rounded-xl py-3 text-sm text-gray-500 font-semibold cursor-pointer hover:border-[#1A1F2E]">
                <Plus size={14} /> {es ? 'Agregar otro familiar' : 'Add another family member'}
              </button>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-bold text-[#1A1F2E] mb-1.5">{es ? 'Mensaje para ellos (opcional)' : 'Message for them (optional)'}</label>
              <textarea rows={3}
                placeholder={es
                  ? 'Ej: Estoy fuera de la zona. Estoy bien. Te estoy buscando. Si ves este mensaje, repórtate en CRIS o pide a alguien que te ayude.'
                  : 'E.g: I am outside the area. I am safe. I am looking for you. If you see this message, report to CRIS or ask someone to help you.'}
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                className="w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:border-[#1A1F2E] resize-none placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="bg-[#FDF1F0] border-2 border-[#E8B4B0] rounded-2xl p-4 text-sm text-[#B83A52] font-medium">
                ⚠️ {es ? 'Error al enviar. Intenta de nuevo.' : 'Error submitting. Try again.'}
              </div>
            )}

            <button type="submit" disabled={enviando}
              className="w-full bg-[#1A1F2E] hover:bg-[#2d3549] disabled:opacity-40 text-white font-black py-5 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
              {enviando ? <Loader2 size={20} className="animate-spin" /> : '💬'}
              {es ? 'Registrar mensaje para mi familiar' : 'Register message for my family'}
            </button>

            <button type="button" onClick={() => setModo('')} className="w-full text-sm text-gray-400 py-2 cursor-pointer">{es ? '← Volver' : '← Back'}</button>
          </form>
        )}

        {/* Modo: ayudar */}
        {modo === 'ayudar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#EDEBE8] p-5 text-center space-y-3">
              <p className="text-4xl">🤝</p>
              <p className="font-black text-lg text-[#1A1F2E]">{es ? '¡Gracias por querer ayudar!' : 'Thank you for wanting to help!'}</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {es
                  ? 'Puedes contribuir reportando información de personas encontradas, actualizando fichas existentes o contactando instituciones de respuesta en tu zona.'
                  : 'You can contribute by reporting information about found people, updating existing records, or contacting response institutions in your area.'}
              </p>
            </div>
            <Link to="/reportar-encontrado" className="block bg-[#D48C2E] text-white font-black py-4 rounded-2xl text-center">{es ? '→ Reportar persona encontrada' : '→ Report found person'}</Link>
            <Link to="/consultar" className="block bg-white border-2 border-[#EDEBE8] text-[#1A1F2E] font-bold py-4 rounded-2xl text-center">{es ? '→ Ver refugios y hospitales' : '→ View shelters and hospitals'}</Link>
            <button onClick={() => setModo('')} className="w-full text-sm text-gray-400 py-2 cursor-pointer">{es ? '← Volver' : '← Back'}</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}