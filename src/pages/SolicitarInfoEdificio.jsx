import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Search, Mail, Send, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const inputCls = "w-full border-2 border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] placeholder-gray-400";

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

export default function SolicitarInfoEdificio() {
  const { lang } = useLang();
  const es = lang === 'es';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_lugar: '',
    direccion: '',
    ciudad: '',
    estado_region: '',
    telefono_contacto: '',
    email_contacto: '',
    descripcion: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_lugar.trim() || !form.ciudad.trim()) return;
    setEnviando(true);
    try {
      const req = await base44.entities.SolicitudesInfoEdificio.create({
        nombre_lugar: form.nombre_lugar.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        estado_region: form.estado_region.trim(),
        telefono_contacto: form.telefono_contacto.trim(),
        email_contacto: form.email_contacto.trim(),
        descripcion: form.descripcion.trim(),
        estado_solicitud: 'pendiente',
      });
      setResultado('ok');
    } catch {
      setResultado('err');
    }
    setEnviando(false);
  };

  if (resultado === 'ok') return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
        <div className="text-5xl">📨</div>
        <h2 className="text-xl font-bold text-gray-900">{es ? 'Solicitud enviada' : 'Request sent'}</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          {es
            ? 'Tu solicitud de información del edificio fue registrada. Si hay datos disponibles, te contactaremos pronto.'
            : 'Your building information request was registered. If data is available, we will contact you soon.'}
        </p>
        <button onClick={() => navigate('/edificios')}
          className="bg-[#1A1F2E] text-white px-8 py-3 rounded-xl font-bold text-sm">
          {es ? 'Volver al directorio' : 'Back to directory'}
        </button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/edificios" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver al directorio' : 'Back to directory'}
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">📋</div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1F2E]">{es ? 'Solicitar información de un edificio' : 'Request building information'}</h1>
              <p className="text-sm text-gray-500">{es ? 'Si el edificio no aparece en el directorio, dinos cuál te interesa.' : "If the building isn't in the directory, tell us which one you're looking for."}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 font-medium flex gap-2">
            <Search size={14} className="flex-shrink-0 mt-0.5" />
            {es ? 'Completamos los datos del edificio apenas tengamos más información. Te avisaremos por los contactos que dejes.' : "We'll fill in the building details as we get more information. We'll notify you through the contacts provided."}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mb-4">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {es
              ? 'Esta es una solicitud de información, no un reporte de emergencia. Si el edificio presenta daños visibles o personas atrapadas, usa el botón "Reportar edificio" para alertar de inmediato.'
              : 'This is an information request, not an emergency report. If the building has visible damage or trapped people, use the "Report building" button to alert immediately.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-[#EDEBE8] p-4">
          <h2 className="text-sm font-bold text-[#1A1F2E]">{es ? '📝 Datos del edificio' : '📝 Building details'}</h2>

          <div>
            <FieldLabel label={es ? 'Nombre del edificio o lugar' : 'Building or place name'} required />
            <input value={form.nombre_lugar} onChange={e => set('nombre_lugar', e.target.value)}
              placeholder={es ? 'Ej: Edificio El Centro, Torre Capital...' : 'E.g: El Centro Building, Capital Tower...'}
              required className={inputCls} autoFocus />
          </div>

          <div>
            <FieldLabel label={es ? 'Dirección' : 'Address'} />
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)}
              placeholder={es ? 'Calle, avenida, referencia...' : 'Street, avenue, landmark...'}
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel label={es ? 'Ciudad' : 'City'} required />
              <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)}
                placeholder="Caracas" required className={inputCls} />
            </div>
            <div>
              <FieldLabel label={es ? 'Estado' : 'State'} />
              <input value={form.estado_region} onChange={e => set('estado_region', e.target.value)}
                placeholder="Miranda" className={inputCls} />
            </div>
          </div>

          <div>
            <FieldLabel label={es ? 'Descripción o detalles que conozcas' : 'Description or details you know'} />
            <textarea rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder={es ? 'Ej: Es un edificio de 10 pisos en la esquina de la plaza Bolívar. Vi grietas en el primer piso...' : 'E.g: It\'s a 10-story building at the corner of Bolívar square. I saw cracks on the first floor...'}
              className={`${inputCls} resize-none`} />
          </div>

          <hr className="border-[#EDEBE8]" />
          <h2 className="text-sm font-bold text-[#1A1F2E]">{es ? '📞 Tus datos de contacto' : '📞 Your contact info'}</h2>
          <div className="bg-[#F0F4FD] border border-blue-200 rounded-xl px-3 py-2">
            <p className="text-xs text-blue-800 font-medium">🔒 {es ? 'No se publicarán. Solo para avisarte los resultados.' : 'Not published. Only to notify you of the results.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel label={es ? 'Tu teléfono' : 'Your phone'} />
              <input value={form.telefono_contacto} onChange={e => set('telefono_contacto', e.target.value)}
                placeholder="+58 412..." className={inputCls} />
            </div>
            <div>
              <FieldLabel label={es ? 'Tu email' : 'Your email'} />
              <input type="email" value={form.email_contacto} onChange={e => set('email_contacto', e.target.value)}
                placeholder="correo@..." className={inputCls} />
            </div>
          </div>

          {resultado === 'err' && (
            <div className="bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
              ⚠️ {es ? 'Error al enviar. Verifica tu conexión e intenta de nuevo.' : 'Error submitting. Check your connection and try again.'}
            </div>
          )}

          <button type="submit" disabled={enviando || !form.nombre_lugar.trim() || !form.ciudad.trim()}
            className="w-full bg-[#1A1F2E] hover:bg-[#2d3549] disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
            {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
            {enviando ? (es ? 'Enviando...' : 'Sending...') : (es ? 'Solicitar información' : 'Request information')}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}