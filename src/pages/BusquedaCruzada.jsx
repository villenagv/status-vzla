import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Search, Loader2, Phone, Mail, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const inputCls = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-500 placeholder-gray-400";

export default function BusquedaCruzada() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [form, setForm] = useState({
    nombre_creador: '', telefono: '', email: '', red_social: '',
    red_social_tipo: '', ciudad: '', estado_region: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [matches, setMatches] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_creador.trim()) return;
    setEnviando(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('cruceBusqueda', {
        nombre: form.nombre_creador,
        telefono: form.telefono,
        email: form.email,
        red_social: form.red_social,
        ciudad: form.ciudad,
        estado_region: form.estado_region,
      });
      setResultado(res.data?.ok ? 'ok' : 'err');
      setMatches(res.data?.matches || []);
    } catch {
      setResultado('err');
    }
    setEnviando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-3">
          <ChevronLeft size={16} /> {es ? 'Inicio' : 'Home'}
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-2">{es ? '🔗 Búsqueda cruzada' : '🔗 Cross search'}</h1>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          {es
            ? 'Regístrate con tus datos: si alguien te busca, o si reconocemos tu nombre en la base de búsqueda, podremos conectarte.'
            : 'Register your data: if someone is looking for you, or we find your name in the search database, we can connect you.'}
        </p>

        {/* Anti-extorsión */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div>
            <p className="text-xs font-bold text-amber-800 mb-1">{es ? '⚠️ Privacidad y seguridad' : '⚠️ Privacy & security'}</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              {es
                ? 'Nunca envíes dinero a cambio de información. Tus datos de contacto solo serán visibles para coincidencias verificadas.'
                : 'Never send money in exchange for information. Your contact info is only shown for verified matches.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">1. {es ? '¿Quién eres?' : 'Who are you?'} <span className="text-red-500">*</span></h2>
            <input required value={form.nombre_creador} onChange={e => set('nombre_creador', e.target.value)}
              placeholder={es ? 'Nombre completo...' : 'Full name...'} className={inputCls} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">2. {es ? 'Tus datos de contacto' : 'Your contact info'}</h2>
            <p className="text-xs text-gray-400 mb-2">{es ? 'Cuanto más datos ingreses, más fácil será encontrarte.' : 'The more data you provide, the easier it is to find you.'}</p>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Phone size={12} /> {es ? 'Teléfono o WhatsApp' : 'Phone or WhatsApp'}</p>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+58 412..." className={inputCls} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Mail size={12} /> Email</p>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" className={inputCls} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Globe size={12} /> {es ? 'Red social' : 'Social network'}</p>
              <div className="grid grid-cols-2 gap-2">
                <select value={form.red_social_tipo} onChange={e => set('red_social_tipo', e.target.value)} className={inputCls}>
                  <option value="">{es ? 'Tipo...' : 'Type...'}</option>
                  <option value="instagram">Instagram</option>
                  <option value="telegram">Telegram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="otro">{es ? 'Otro' : 'Other'}</option>
                </select>
                <input value={form.red_social} onChange={e => set('red_social', e.target.value)} placeholder="@usuario" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">3. {es ? 'Ubicación (opcional)' : 'Location (optional)'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder={es ? 'Ciudad' : 'City'} className={inputCls} />
              <input value={form.estado_region} onChange={e => set('estado_region', e.target.value)} placeholder={es ? 'Estado' : 'State'} className={inputCls} />
            </div>
          </div>

          {resultado === 'err' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">{es ? 'Error al guardar. Verifica tu conexión.' : 'Error. Check your connection.'}</div>
          )}

          <button type="submit" disabled={enviando || !form.nombre_creador.trim()}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl text-base disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
            {enviando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {enviando ? (es ? 'Buscando...' : 'Searching...') : (es ? 'Registrarme y buscar coincidencias' : 'Register & search for matches')}
          </button>
        </form>

        {/* Resultados */}
        {resultado === 'ok' && (
          <div className="mt-6 space-y-4">
            <div className={`rounded-xl p-4 border ${matches.length > 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {matches.length > 0 ? '🔍' : '✅'}
                <span className="text-sm font-bold text-gray-900">
                  {es ? (matches.length > 0 ? 'Posibles coincidencias encontradas' : 'Registro guardado') : (matches.length > 0 ? 'Possible matches found' : 'Registration saved')}
                </span>
              </div>
              <p className="text-xs text-gray-600">{es
                ? 'Tu registro quedó guardado en el sistema de búsqueda cruzada.'
                : 'Your registration is saved in the cross-search system.'}</p>
            </div>

            {matches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">{matches.length} {es ? 'coincidencia(s)' : 'match(es)'}</p>
                {matches.slice(0, 5).map((m, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.nivel_similitud > 80 ? 'bg-red-100 text-red-700' : m.nivel_similitud > 60 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {m.nivel_similitud}% {es ? 'coincidencia' : 'match'}
                      </span>
                      <span className="text-[10px] text-gray-400">{m.tipo === 'buscada' ? (es ? 'Buscada' : 'Searched') : (es ? 'Encontrada' : 'Found')}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{m.nombre}</p>
                    <p className="text-xs text-gray-500">📍 {m.ultima_ubicacion_conocida || m.ubicacion_actual || ''} · {m.ciudad}</p>
                    {m.contacto && <p className="text-xs text-blue-600 mt-1">📞 {m.contacto}</p>}
                    {m.tipo === 'buscada' && (
                      <Link to={`/persona?id=${m.id_origen}`} className="inline-block text-xs text-blue-700 underline mt-1">
                        {es ? 'Ver perfil de búsqueda →' : 'View search profile →'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              {es
                ? '💡 Si eres la persona buscada, contacta al familiar usando la información del perfil. Si alguien muestra tu nombre, revisa los detalles.'
                : '💡 If you are the person being searched, contact the family using the profile info. If someone shows your name, check the details.'}
            </p>
          </div>
        )}

        {!resultado && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-800">{es ? '🔍 ¿Cómo funciona?' : '🔍 How it works?'}</strong><br />
              {es
                ? '1. Registra tus datos aquí — teléfono, email y redes sociales.'
                : '1. Register your data here — phone, email, and social media.'}<br />
              {es
                ? '2. El sistema busca tu nombre en la base de personas buscadas.'
                : '2. The system searches your name in the missing persons database.'}<br />
              {es
                ? '3. Si hay coincidencias, te mostramos los datos para que puedas contactar a quienes te buscan.'
                : '3. If there are matches, we show the info so you can contact those looking for you.'}<br />
              {es
                ? '4. Tus datos quedan guardados para futuras búsquedas y notificaciones.'
                : '4. Your data stays saved for future searches and notifications.'}
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}