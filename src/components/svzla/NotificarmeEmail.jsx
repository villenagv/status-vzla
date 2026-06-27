import { useState } from 'react';
import { Bell, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

/**
 * Botón "Notificarme" que acepta email sin necesidad de login.
 * Se guarda en SuscriptoresSeguimiento (campo telefono_whatsapp = email).
 * Props:
 *   entidadId   — ID del reporte / persona / edificio
 *   tipoReporte — 'persona' | 'dano' | 'refugio'
 *   compact     — boolean (sólo icono + texto corto, sin formulario visible)
 */
export default function NotificarmeEmail({ entidadId, tipoReporte = 'persona', compact = false }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  // Intenta usar el email del usuario logueado si está disponible
  const abrir = async () => {
    try {
      const u = await base44.auth.me();
      if (u?.email) setEmail(u.email);
    } catch {}
    setAbierto(true);
  };

  const suscribir = async () => {
    const em = email.trim().toLowerCase();
    if (!em || !em.includes('@')) {
      setError(es ? 'Ingresa un email válido.' : 'Enter a valid email.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      // Evitar duplicados
      const existe = await base44.entities.SuscriptoresSeguimiento.filter({
        reporte_id: entidadId,
        tipo_reporte: tipoReporte,
      });
      if (existe.some(s => s.telefono_whatsapp?.toLowerCase() === em)) {
        setOk(true);
        setGuardando(false);
        return;
      }
      await base44.entities.SuscriptoresSeguimiento.create({
        reporte_id: entidadId,
        tipo_reporte: tipoReporte,
        telefono_whatsapp: em,   // campo reutilizado para guardar email
        activo: true,
      });
      setOk(true);
    } catch {
      setError(es ? 'Error al suscribirse. Intenta de nuevo.' : 'Error subscribing. Try again.');
    }
    setGuardando(false);
  };

  if (ok) return (
    <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 rounded-xl px-3 py-2">
      <Check size={12} /> {es ? 'Te avisaremos por email' : 'We will email you'}
    </div>
  );

  if (!abierto) return (
    <button
      onClick={abrir}
      className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-amber-100 transition-colors w-full justify-center"
    >
      <Bell size={12} />
      {es ? '🔔 Notificarme de cambios' : '🔔 Notify me of changes'}
    </button>
  );

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-800">
        🔔 {es ? 'Recibirás un email cuando haya novedades.' : 'You will receive an email when there are updates.'}
      </p>
      <p className="text-[10px] text-amber-700">
        {es ? 'Sin cuenta. Tu email no se publica.' : 'No account needed. Your email is not published.'}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && suscribir()}
          placeholder={es ? 'tu@email.com' : 'your@email.com'}
          className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-500 min-w-0"
        />
        <button
          onClick={suscribir}
          disabled={guardando || !email.trim()}
          className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-40 cursor-pointer flex-shrink-0 flex items-center gap-1"
        >
          {guardando ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
          {es ? 'Avisar' : 'Alert'}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
      <button onClick={() => setAbierto(false)} className="text-[10px] text-amber-600 underline cursor-pointer">
        {es ? 'Cancelar' : 'Cancel'}
      </button>
    </div>
  );
}