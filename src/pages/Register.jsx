import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const GoogleSVG = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" className="flex-shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [reenvioOk, setReenvioOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Verifica e intenta de nuevo.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, full_name: nombre });
      setShowOtp(true);
    } catch (err) {
      setError(err.message?.includes('already') || err.message?.includes('existe')
        ? "Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?"
        : "Error al crear cuenta. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = "/";
    } catch (err) {
      setError("Código incorrecto o expirado. Revisa tu email e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      setReenvioOk(true);
      setTimeout(() => setReenvioOk(false), 4000);
    } catch (err) {
      setError("No pudimos reenviar el código. Verifica tu conexión.");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  // ── OTP screen ──
  if (showOtp) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
        <div className="bg-[#1A1F2E] px-5 py-4">
          <Link to="/" className="inline-flex flex-col leading-tight">
            <span className="font-bold text-lg text-white">Status<span className="text-[#D48C2E]">Venezuela</span></span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
          <div className="mb-7 text-center">
            <div className="text-4xl mb-3">📧</div>
            <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">Verifica tu correo</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Te enviamos un código de 6 dígitos a<br />
              <span className="font-bold text-[#1A1F2E]">{email}</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">El código llega en español. Revisa también tu carpeta de spam o correo no deseado.</p>
          </div>

          {error && (
            <div className="mb-4 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
              {error}
            </div>
          )}

          {reenvioOk && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 text-center">
              ✅ Código reenviado. Revisa tu email.
            </div>
          )}

          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-14 h-16 text-2xl font-bold" />
                <InputOTPSlot index={1} className="w-14 h-16 text-2xl font-bold" />
                <InputOTPSlot index={2} className="w-14 h-16 text-2xl font-bold" />
                <InputOTPSlot index={3} className="w-14 h-16 text-2xl font-bold" />
                <InputOTPSlot index={4} className="w-14 h-16 text-2xl font-bold" />
                <InputOTPSlot index={5} className="w-14 h-16 text-2xl font-bold" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otpCode.length < 6}
            className="w-full bg-[#1A1F2E] hover:bg-[#2d3549] disabled:opacity-50 text-white font-bold py-5 rounded-xl text-lg transition-colors flex items-center justify-center gap-2 mb-4"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? 'Verificando...' : '✓ Confirmar y entrar'}
          </button>

          <p className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            ¿No llegó?{" "}
            <button onClick={handleResend} className="text-[#D48C2E] font-bold hover:underline text-base py-2 px-4">
              Reenviar código
            </button>
          </p>
          <p className="text-center text-xs text-gray-400 mt-3">También puede llegar como "tu código es 847895". Escribe los 6 dígitos.</p>
          <p className="text-center text-xs text-gray-400 mt-3">
            <button onClick={() => { setShowOtp(false); setOtpCode(''); setError(''); }} className="hover:text-[#1A1F2E]">
              ← Volver y cambiar email
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Register form ──
  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <div className="bg-[#1A1F2E] px-5 py-4">
        <Link to="/" className="inline-flex flex-col leading-tight">
          <span className="font-bold text-lg text-white">Status<span className="text-[#D48C2E]">Venezuela</span></span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
        <div className="mb-7 text-center">
          <div className="text-4xl mb-3">🙋</div>
          <h1 className="text-2xl font-black text-[#1A1F2E] mb-1">Crear cuenta gratis</h1>
          <p className="text-sm text-gray-500">Para recibir alertas cuando haya novedades sobre alguien que buscas</p>
        </div>

        {/* Google — primary */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#EDEBE8] rounded-2xl py-4 text-sm font-bold text-[#1A1F2E] hover:border-[#1A1F2E] hover:shadow-sm transition-all mb-5"
        >
          <GoogleSVG />
          Registrarme con Google — más rápido
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#EDEBE8]" />
          <span className="text-xs text-gray-400 font-medium">o con email</span>
          <div className="flex-1 h-px bg-[#EDEBE8]" />
        </div>

        {error && (
          <div className="mb-4 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3 text-sm text-[#B83A52]">
            {error}{" "}
            {error.includes('sesión') && (
              <Link to="/login" className="font-bold underline">Iniciar sesión</Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1.5">Tu nombre</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Ej: María García"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-[#EDEBE8] rounded-xl pl-10 pr-4 py-3.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1.5">Correo electrónico *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-[#EDEBE8] rounded-xl pl-10 pr-4 py-3.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1.5">Contraseña * <span className="text-gray-400 font-normal">(mín. 6 caracteres)</span></label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-[#EDEBE8] rounded-xl pl-10 pr-11 py-3.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1F2E] mb-1.5">Confirmar contraseña *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-[#EDEBE8] rounded-xl pl-10 pr-4 py-3.5 text-sm bg-white focus:outline-none focus:border-[#1A1F2E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A1F2E] hover:bg-[#2d3549] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Creando cuenta...' : 'Crear cuenta y recibir alertas'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-[#D48C2E] font-bold hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          <Link to="/" className="hover:text-[#1A1F2E]">← Volver al inicio sin registrarse</Link>
        </p>
      </div>
    </div>
  );
}