import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

export default function BotonNotificarme({ personaId, nombre, className }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const [suscribiendo, setSuscribiendo] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const suscribir = async () => {
    setSuscribiendo(true);
    setError('');
    try {
      const u = await base44.auth.me();
      if (!u || !u.email) {
        setError(es ? 'Debes iniciar sesión con un email.' : 'You must log in with an email.');
        setSuscribiendo(false);
        return;
      }
      const existentes = await base44.entities.Suscripciones.filter({ user_id: u.id, persona_id: personaId });
      if (existentes.some(s => s.activa)) {
        setOk(true);
        setSuscribiendo(false);
        return;
      }
      await base44.entities.Suscripciones.create({
        user_id: u.id,
        persona_id: personaId,
        email_notificacion: u.email,
        activa: true,
        es_creador: false,
      });
      setOk(true);
    } catch {
      setError(es ? 'Error al suscribirse. Intenta de nuevo.' : 'Error subscribing. Try again.');
    } finally {
      setSuscribiendo(false);
    }
  };

  return (
    <div className={className}>
      {ok ? (
        <span className="flex items-center gap-1 text-[10px] text-green-700 font-semibold">
          ✅ {es ? 'Suscripción activa' : 'Active subscription'}
        </span>
      ) : (
        <button
          onClick={suscribir}
          disabled={suscribiendo}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-[#D48C2E] bg-[#FFF8EE] border border-[#E6C195] rounded-lg px-2.5 py-1.5 disabled:opacity-50 cursor-pointer hover:bg-[#FFF0D0] transition-colors w-full justify-center"
        >
          {suscribiendo ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
          {es ? 'Notificarme' : 'Notify me'}
        </button>
      )}
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}