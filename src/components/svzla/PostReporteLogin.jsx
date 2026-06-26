import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

// Shown after submitting a report — invites user to create account for alerts
export default function PostReporteLogin({ es, onSkip }) {
  const [modo, setModo] = useState(null); // null | 'google' | 'email'
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = () => {
    base44.auth.loginWithProvider('google', window.location.href);
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await base44.auth.register({ email, password: pass, full_name: nombre });
      setHecho(true);
    } catch (err) {
      setError(es ? 'Error al crear cuenta. ¿Ya tienes una? Intenta iniciar sesión.' : 'Error creating account. Already have one? Try logging in.');
    } finally {
      setCargando(false);
    }
  };

  if (hecho) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-2">
      <div className="text-3xl">📧</div>
      <p className="text-sm font-bold text-green-800">{es ? '¡Cuenta creada!' : 'Account created!'}</p>
      <p className="text-xs text-green-700">{es ? 'Revisa tu email para confirmar. Te avisaremos si hay novedades.' : 'Check your email to confirm. We\'ll notify you of updates.'}</p>
    </div>
  );

  return (
    <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <div className="text-2xl mb-1">🔔</div>
        <h3 className="font-bold text-[#1A1F2E] text-base">
          {es ? 'Recibe alertas si hay novedades' : 'Get alerts if there are updates'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {es
            ? 'Crea una cuenta gratis en 30 segundos. Te avisamos por email si el estado cambia.'
            : 'Create a free account in 30 seconds. We\'ll email you if the status changes.'}
        </p>
      </div>

      {!modo && (
        <div className="space-y-2">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#EDEBE8] rounded-xl py-3 text-sm font-semibold text-[#1A1F2E] hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            {es ? 'Continuar con Google' : 'Continue with Google'}
          </button>
          <button
            onClick={() => setModo('email')}
            className="w-full py-3 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50 transition-colors font-medium"
          >
            {es ? 'Registrarme con email y contraseña' : 'Sign up with email & password'}
          </button>
          <button onClick={onSkip} className="w-full text-xs text-gray-400 py-1 hover:text-gray-600">
            {es ? 'Ahora no, gracias' : 'Not now, thanks'}
          </button>
        </div>
      )}

      {modo === 'email' && (
        <form onSubmit={handleEmail} className="space-y-3">
          <input
            required
            placeholder={es ? 'Tu nombre' : 'Your name'}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          <input
            required
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          <input
            required
            type="password"
            placeholder={es ? 'Contraseña (mínimo 6 caracteres)' : 'Password (min. 6 characters)'}
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#D48C2E] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
            {es ? 'Crear cuenta y recibir alertas' : 'Create account & get alerts'}
          </button>
          <button type="button" onClick={() => setModo(null)} className="w-full text-xs text-gray-400 py-1">← {es ? 'Volver' : 'Back'}</button>
        </form>
      )}
    </div>
  );
}