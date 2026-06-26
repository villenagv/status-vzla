import { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';

const ESTADO_OPTS = [
  { val: 'a_salvo', es: '✅ Estoy a salvo', en: '✅ I am safe' },
  { val: 'herido_leve', es: '🟡 Herido levemente', en: '🟡 Mildly injured' },
  { val: 'herido_grave', es: '🔴 Herido gravemente', en: '🔴 Seriously injured' },
  { val: 'en_refugio', es: '🏠 En refugio', en: '🏠 In shelter' },
  { val: 'en_hospital', es: '🏥 En hospital', en: '🏥 In hospital' },
  { val: 'evacuado', es: '🚌 Evacuado', en: '🚌 Evacuated' },
  { val: 'buscando_contacto', es: '📡 Buscando comunicarme', en: '📡 Trying to reach someone' },
];

export default function ActualizarEstado() {
  const { lang } = useLang();
  const es = lang === 'es';

  const [token, setToken] = useState('');
  const [persona, setPersona] = useState(null);
  const [tokenRecord, setTokenRecord] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tokenInvalido, setTokenInvalido] = useState(false);

  const [estado, setEstado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [nombreLugar, setNombreLugar] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setCargando(false); setTokenInvalido(true); return; }
    setToken(t);

    const cargar = async () => {
      try {
        const tokens = await base44.entities.TokensAutoUpdate.filter({ token: t });
        if (!tokens || tokens.length === 0) { setTokenInvalido(true); setCargando(false); return; }
        const rec = tokens[0];

        // Check expiry
        if (rec.expira && new Date(rec.expira) < new Date()) { setTokenInvalido(true); setCargando(false); return; }

        setTokenRecord(rec);
        const p = await base44.entities.PersonasBuscadas.get(rec.persona_id);
        setPersona(p);
        setTelefono(p?.contacto_telefono || '');
        setEmail(p?.contacto_email || '');
      } catch {
        setTokenInvalido(true);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!persona || !tokenRecord) return;
    setGuardando(true);
    try {
      const nuevoEstadoCaso =
        estado === 'a_salvo' ? 'encontrado_con_vida'
        : estado === 'en_hospital' || estado === 'herido_leve' || estado === 'herido_grave' ? 'en_hospital_refugio'
        : 'informacion_recibida';

      await base44.entities.PersonasBuscadas.update(persona.id, {
        estado_caso: nuevoEstadoCaso,
        notas_publicas: [persona.notas_publicas, mensaje ? `[Actualización propia]: ${mensaje}` : ''].filter(Boolean).join('\n'),
        contacto_telefono: telefono || persona.contacto_telefono,
        contacto_email: email || persona.contacto_email,
      });

      // Notify subscribers
      await base44.functions.invoke('notificarActualizacion', {
        persona_id: persona.id,
        tipo_evento: 'actualizacion_directa',
        datos_persona: {
          nombre_completo: persona.nombre_completo,
          estado_caso: nuevoEstadoCaso,
        },
      });

      // Mark token as used
      await base44.entities.TokensAutoUpdate.update(tokenRecord.id, { usado: true });

      setListo(true);
    } catch {
      alert(es ? 'Error al guardar. Intenta de nuevo.' : 'Error saving. Please try again.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
    </div>
  );

  if (tokenInvalido) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">{es ? 'Enlace inválido o expirado' : 'Invalid or expired link'}</h2>
        <p className="text-sm text-gray-500 mb-6">
          {es ? 'Este enlace no es válido o ya fue usado. Si necesitas actualizar tu estado, pide un nuevo enlace contactando a tu familiar.' : 'This link is invalid or already used. To update your status, ask your family member to resend the link.'}
        </p>
        <a href="/" className="bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">{es ? 'Ir al inicio' : 'Go home'}</a>
      </div>
    </div>
  );

  if (listo) return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <CheckCircle size={56} className="text-green-600 mb-4" />
        <h2 className="text-xl font-bold text-[#1A1F2E] mb-2">{es ? '¡Estado actualizado!' : 'Status updated!'}</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          {es ? 'Tus familiares y personas suscritas recibirán una notificación por email.' : 'Your family and subscribed people will receive an email notification.'}
        </p>
        <a href="/" className="bg-[#1A1F2E] text-white px-6 py-3 rounded-xl font-semibold text-sm">{es ? 'Ir al inicio' : 'Go home'}</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-bold text-[#1A1F2E] mb-1">
          {es ? '📡 Actualizar mi estado' : '📡 Update my status'}
        </h1>
        {persona && (
          <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold text-[#1A1F2E]">{persona.nombre_completo}</p>
            <p className="text-xs text-gray-500">{persona.ultima_ubicacion_conocida} · {persona.ciudad}, {persona.estado_region}</p>
          </div>
        )}

        <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 mb-5">
          <ShieldAlert size={16} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#B83A52]">
            {es ? 'Nunca envíes dinero a cambio de información. Esta plataforma no autoriza pagos ni rescates privados.' : 'Never send money in exchange for information. This platform does not authorize payments or private rescue fees.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '¿Cómo estás?' : 'How are you?'} *</h3>
            <div className="flex flex-col gap-2">
              {ESTADO_OPTS.map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setEstado(opt.val)}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border-2 text-left transition-colors ${
                    estado === opt.val ? 'bg-[#1A1F2E] text-white border-[#1A1F2E]' : 'bg-white border-[#EDEBE8] text-gray-700'
                  }`}
                >{es ? opt.es : opt.en}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? '¿Dónde estás ahora?' : 'Where are you now?'}</h3>
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Nombre del lugar' : 'Place name'}</label>
              <input placeholder={es ? 'Ej: Refugio El Valle, Hospital Central...' : 'E.g: El Valle Shelter, Central Hospital...'} value={nombreLugar} onChange={e => setNombreLugar(e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Dirección o referencia' : 'Address or landmark'}</label>
              <input placeholder={es ? 'Calle, avenida, ciudad...' : 'Street, avenue, city...'} value={ubicacion} onChange={e => setUbicacion(e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EDEBE8] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#1A1F2E]">{es ? 'Actualiza tu contacto' : 'Update your contact'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Teléfono' : 'Phone'}</label>
                <input placeholder="+58..." value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1">{es ? 'Mensaje para tu familia (opcional, público)' : 'Message for family (optional, public)'}</label>
            <textarea rows={3} placeholder={es ? 'Escribe lo que quieres que sepan...' : 'Write what you want them to know...'} value={mensaje} onChange={e => setMensaje(e.target.value)} className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E] resize-none" />
          </div>

          <button
            type="submit"
            disabled={guardando || !estado}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : '📡'}
            {es ? 'Actualizar mi estado' : 'Update my status'}
          </button>
        </form>
      </div>
    </div>
  );
}