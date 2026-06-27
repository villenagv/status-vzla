import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" className="flex-shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// Steps: 'menu' | 'registro' | 'otp' | 'login' | 'done'
export default function PostReporteLogin({ es, onSkip }) {
  const [paso, setPaso] = useState('menu');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [reenvioOk, setReenvioOk] = useState(false);

  const handleGoogle = () => {
    base44.auth.loginWithProvider('google', window.location.href);
  };

  // ── Registro con email ──
  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    if (pass !== passConfirm) { setError(es ? 'Las contraseñas no coinciden.' : 'Passwords do not match.'); return; }
    if (pass.length < 6) { setError(es ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.'); return; }
    setCargando(true);
    try {
      await base44.auth.register({ email, password: pass, full_name: nombre });
      setPaso('otp');
    } catch (err) {
      if (err.message?.toLowerCase().includes('already') || err.message?.toLowerCase().includes('exist')) {
        setError(es ? '¿Ya tienes cuenta? Inicia sesión en lugar de registrarte.' : 'Already have an account? Log in instead.');
      } else {
        setError(es ? 'Error al crear cuenta. Verifica tu conexión.' : 'Error creating account. Check your connection.');
      }
    } finally {
      setCargando(false);
    }
  };

  // ── Verificar OTP ──
  const handleVerify = async () => {
    setError('');
    setCargando(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      setPaso('done');
    } catch {
      setError(es ? 'Código incorrecto o expirado. Intenta de nuevo.' : 'Incorrect or expired code. Try again.');
    } finally {
      setCargando(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await base44.auth.resendOtp(email);
      setReenvioOk(true);
      setTimeout(() => setReenvioOk(false), 4000);
    } catch {
      setError(es ? 'No pudimos reenviar. Verifica tu conexión.' : 'Could not resend. Check your connection.');
    }
  };

  // ── Login con email ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await base44.auth.loginViaEmailPassword(email, pass);
      window.location.href = window.location.href;
    } catch {
      setError(es ? 'Email o contraseña incorrectos.' : 'Incorrect email or password.');
    } finally {
      setCargando(false);
    }
  };

  // ── Done ──
  if (paso === 'done') return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-2">
      <div className="text-3xl">✅</div>
      <p className="text-sm font-bold text-green-800">{es ? '¡Cuenta creada y verificada!' : 'Account created and verified!'}</p>
      <p className="text-xs text-green-700">{es ? 'Te avisaremos por email si hay novedades.' : "We'll email you if there are updates."}</p>
    </div>
  );

  // ── OTP ──
  if (paso === 'otp') return (
    <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <div className="text-3xl mb-1">📧</div>
        <h3 className="font-bold text-[#1A1F2E] text-base">{es ? 'Confirma tu email' : 'Confirm your email'}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {es ? 'Enviamos un código de 6 dígitos a' : 'We sent a 6-digit code to'} <span className="font-bold">{email}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{es ? 'Revisa también tu carpeta de spam' : 'Check your spam folder too'}</p>
      </div>

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      {reenvioOk && <p className="text-xs text-green-700 text-center">✅ {es ? 'Código reenviado.' : 'Code resent.'}</p>}

      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <button
        onClick={handleVerify}
        disabled={cargando || otpCode.length < 6}
        className="w-full bg-[#1A1F2E] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
        {es ? 'Verificar y activar cuenta' : 'Verify & activate account'}
      </button>

      <p className="text-center text-xs text-gray-500">
        {es ? '¿No llegó?' : "Didn't arrive?"}{' '}
        <button onClick={handleResend} className="text-[#D48C2E] font-bold hover:underline">{es ? 'Reenviar código' : 'Resend code'}</button>
      </p>
      <button onClick={() => { setPaso('registro'); setOtpCode(''); setError(''); }} className="w-full text-xs text-gray-400 py-1">
        ← {es ? 'Volver y cambiar email' : 'Back to change email'}
      </button>
    </div>
  );

  // ── Login ──
  if (paso === 'login') return (
    <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <div className="text-2xl mb-1">🔐</div>
        <h3 className="font-bold text-[#1A1F2E] text-base">{es ? 'Iniciar sesión' : 'Log in'}</h3>
        <p className="text-xs text-gray-500 mt-1">{es ? 'Accede para recibir alertas sobre esta búsqueda' : 'Log in to get alerts about this search'}</p>
      </div>

      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDEBE8] rounded-xl py-3 text-sm font-semibold text-[#1A1F2E] hover:bg-gray-50"
      >
        <GoogleSVG /> {es ? 'Entrar con Google' : 'Log in with Google'}
      </button>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#EDEBE8]" />
        <span className="text-xs text-gray-400">{es ? 'o con email' : 'or email'}</span>
        <div className="flex-1 h-px bg-[#EDEBE8]" />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
        />
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 pr-10 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-[#1A1F2E] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
          {es ? 'Entrar' : 'Log in'}
        </button>
      </form>

      <div className="flex justify-between text-xs text-gray-400">
        <button onClick={() => setPaso('menu')} className="hover:text-gray-600">← {es ? 'Volver' : 'Back'}</button>
        <Link to="/forgot-password" className="text-[#D48C2E] hover:underline">{es ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}</Link>
      </div>
    </div>
  );

  // ── Registro ──
  if (paso === 'registro') return (
    <div className="bg-[#FFF8EE] border border-[#E6C195] rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <div className="text-2xl mb-1">🔔</div>
        <h3 className="font-bold text-[#1A1F2E] text-base">{es ? 'Crear cuenta gratis' : 'Create free account'}</h3>
        <p className="text-xs text-gray-500 mt-1">{es ? 'Para recibir alertas por email si hay novedades' : 'To receive email alerts about updates'}</p>
      </div>

      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDEBE8] rounded-xl py-3 text-sm font-semibold text-[#1A1F2E] hover:bg-gray-50"
      >
        <GoogleSVG /> {es ? 'Registrarme con Google — más rápido' : 'Sign up with Google — faster'}
      </button>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#EDEBE8]" />
        <span className="text-xs text-gray-400">{es ? 'o con email' : 'or email'}</span>
        <div className="flex-1 h-px bg-[#EDEBE8]" />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <form onSubmit={handleRegistro} className="space-y-3">
        <input
          placeholder={es ? 'Tu nombre (opcional)' : 'Your name (optional)'}
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
        />
        <input
          type="email"
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
        />
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            required
            placeholder={es ? 'Contraseña (mín. 6 caracteres)' : 'Password (min. 6 chars)'}
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 pr-10 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
          />
          <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <input
          type={showPass ? 'text' : 'password'}
          required
          placeholder={es ? 'Repetir contraseña' : 'Confirm password'}
          value={passConfirm}
          onChange={e => setPassConfirm(e.target.value)}
          className="w-full border border-[#EDEBE8] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
        />
        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-[#D48C2E] hover:bg-[#b87724] text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
          {es ? 'Crear cuenta y recibir alertas' : 'Create account & get alerts'}
        </button>
      </form>

      <div className="flex justify-between text-xs text-gray-400">
        <button onClick={() => setPaso('menu')} className="hover:text-gray-600">← {es ? 'Volver' : 'Back'}</button>
        <button onClick={() => { setPaso('login'); setError(''); }} className="text-[#D48C2E] hover:underline">
          {es ? '¿Ya tienes cuenta? Entra aquí' : 'Already have account? Log in'}
        </button>
      </div>
    </div>
  );

  // ── Menu principal ──
  return (
    <div className="bg-[#FFF8EE] border-2 border-[#E6C195] rounded-2xl p-5 space-y-4">
      <div className="text-center">
        <div className="text-3xl mb-1">✅</div>
        <h3 className="font-bold text-[#1A1F2E] text-base">
          {es ? '¡Tu reporte fue enviado!' : 'Your report was submitted!'}
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {es
            ? 'Cualquier persona puede reportar sin cuenta. Pero si creas una, obtienes ventajas importantes:'
            : 'Anyone can report without an account. But if you create one, you get important benefits:'}
        </p>
      </div>

      {/* Por qué crear cuenta */}
      <div className="bg-white border border-[#E6C195] rounded-xl px-4 py-3 space-y-2">
        {[
          { icon: '🔔', es: 'Recibir alertas por email cuando alguien actualice tu reporte', en: 'Get email alerts when someone updates your report' },
          { icon: '✏️', es: 'Editar o actualizar tus reportes directamente', en: 'Edit or update your reports directly' },
          { icon: '📋', es: 'Ver todos tus reportes en un solo lugar', en: 'See all your reports in one place' },
          { icon: '🔒', es: 'Proteger tu información — solo tú puedes ver tus datos privados', en: 'Protect your info — only you can see your private data' },
        ].map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">{b.icon}</span>
            <p className="text-xs text-gray-700 leading-snug">{es ? b.es : b.en}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#EDEBE8] rounded-xl py-3.5 text-sm font-bold text-[#1A1F2E] hover:border-[#D48C2E] transition-colors"
        >
          <GoogleSVG />
          {es ? 'Crear cuenta con Google — 1 clic' : 'Create account with Google — 1 click'}
        </button>

        <button
          onClick={() => { setPaso('registro'); setError(''); }}
          className="w-full py-3.5 text-sm text-[#1A1F2E] border border-[#EDEBE8] rounded-xl bg-white hover:bg-gray-50 font-semibold"
        >
          {es ? '✉️ Crear cuenta con email' : '✉️ Create account with email'}
        </button>

        <button
          onClick={() => { setPaso('login'); setError(''); }}
          className="w-full py-2.5 text-sm text-[#D48C2E] font-semibold hover:underline"
        >
          {es ? '¿Ya tienes cuenta? Iniciar sesión' : 'Already have account? Log in'}
        </button>

        <button onClick={onSkip} className="w-full text-xs text-gray-400 py-1 hover:text-gray-600">
          {es ? 'No por ahora — continuar sin cuenta' : 'Not now — continue without account'}
        </button>
      </div>
    </div>
  );
}