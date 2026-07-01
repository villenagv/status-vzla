import { Link } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';

export default function PopupAvisame({
  avisameEdificio, cerrarAvisame,
  avisameNombre, setAvisameNombre,
  avisameEmail, setAvisameEmail,
  avisameEnviando, avisameOk, handleAvisame, t,
}) {
  if (!avisameEdificio) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={cerrarAvisame}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {avisameOk ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-4xl">✅</p>
            <p className="text-base font-black text-gray-900">
              {t('¡Listo! Te avisaremos por email.', "Done! We'll notify you by email.", 'Pronto! Avisaremos por email.')}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t(
                'Recibirás un correo cada vez que haya una actualización de este edificio.',
                'You will receive an email every time there is an update for this building.',
                'Você receberá um e-mail cada vez que houver uma atualização deste edifício.'
              )}
            </p>
            <button onClick={cerrarAvisame} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl cursor-pointer mt-2">
              {t('Cerrar', 'Close', 'Fechar')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-green-600 flex-shrink-0" />
                <h2 className="text-base font-black text-gray-900">{t('Recibir actualizaciones', 'Get updates', 'Receber atualizações')}</h2>
              </div>
              <button onClick={cerrarAvisame} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">✕</button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs font-bold text-gray-800 truncate">🏗️ {avisameEdificio.nombre}</p>
              {(avisameEdificio.direccion || avisameEdificio.ciudad) && (
                <p className="text-[11px] text-gray-500 truncate mt-0.5">📍 {[avisameEdificio.direccion, avisameEdificio.ciudad].filter(Boolean).join(' · ')}</p>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {t(
                'Ingresa tu email y te avisaremos cada vez que haya una actualización: cambio de estado, nuevas fotos, personas reportadas o riesgos nuevos.',
                'Enter your email and we will notify you every time there is an update: status change, new photos, reported people, or new risks.',
                'Digite seu e-mail e avisaremos cada vez que houver uma atualização.'
              )}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <Link
                to={`/register?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                onClick={cerrarAvisame}
                className="flex flex-col items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-2 rounded-xl text-xs text-center no-underline transition-colors"
              >
                <span className="text-lg">👤</span>
                {t('Crear cuenta', 'Create account', 'Criar conta')}
                <span className="font-normal text-blue-200 text-[10px] leading-tight">{t('Sigue múltiples edificios', 'Follow multiple buildings', 'Siga vários edifícios')}</span>
              </Link>
              <Link
                to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                onClick={cerrarAvisame}
                className="flex flex-col items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-2 rounded-xl text-xs text-center no-underline transition-colors"
              >
                <span className="text-lg">🔑</span>
                {t('Ya tengo cuenta', 'Sign in', 'Já tenho conta')}
                <span className="font-normal text-gray-400 text-[10px] leading-tight">{t('Iniciar sesión', 'Log in', 'Entrar')}</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium">{t('o sin cuenta', 'or without account', 'ou sem conta')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2 mb-4">
              <input
                value={avisameNombre}
                onChange={e => setAvisameNombre(e.target.value)}
                placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 placeholder-gray-400"
              />
              <input
                value={avisameEmail}
                onChange={e => setAvisameEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAvisame()}
                type="email"
                placeholder={t('Tu email *', 'Your email *', 'Seu email *')}
                className="w-full border-2 border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleAvisame}
              disabled={avisameEnviando || !avisameEmail.trim()}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              {avisameEnviando ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              {avisameEnviando ? t('Registrando...', 'Registering...', 'Registrando...') : t('Avísame solo por email', 'Notify me by email only', 'Me avise só por email')}
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
              🔒 {t('Tu email no se muestra públicamente. Sin spam. Puedes cancelar en cualquier momento.', 'Your email is not shown publicly. No spam. You can unsubscribe anytime.', 'Seu e-mail não é exibido publicamente. Sem spam.')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}