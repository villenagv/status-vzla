import { Link } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';

export default function SuscripcionEdificio({
  subNombre, setSubNombre, subEmail, setSubEmail, suscribiendo, suscribirse, suscrito, totalSuscriptores, t,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-1">
        <Bell size={14} className="text-blue-600" />
        <h2 className="text-sm font-bold text-gray-800">{t('Recibir actualizaciones por email', 'Get email updates', 'Receber atualizações por email')}</h2>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        {t('Te avisamos si cambia el estado, hay nueva información o reportan personas. Sin cuenta necesaria.',
           'We notify you if the status changes, there is new info, or people are reported. No account needed.',
           'Avisamos se o status mudar, houver nova informação ou pessoas reportadas. Sem conta necessária.')}
      </p>
      {totalSuscriptores !== null && totalSuscriptores > 0 && !suscrito && (
        <p className="text-[11px] text-blue-600 font-semibold mb-2">
          👥 {totalSuscriptores} {t('persona(s) esperando actualizaciones', 'person(s) waiting for updates', 'pessoa(s) aguardando atualizações')}
        </p>
      )}
      {suscrito ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
          <p className="text-sm font-bold text-green-700">✅ {t('¡Suscrito! Te avisaremos por email.', 'Subscribed! We will notify you by email.', 'Inscrito! Te avisaremos por email.')}</p>
          <p className="text-xs text-green-600">
            {t('Para seguir múltiples edificios, crea una cuenta gratuita.', 'To follow multiple buildings, create a free account.', 'Para seguir múltiplos edifícios, crie uma conta gratuita.')}
          </p>
          <Link to="/register" className="inline-block text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg no-underline transition-colors">
            {t('Crear cuenta →', 'Create account →', 'Criar conta →')}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <input value={subNombre} onChange={e => setSubNombre(e.target.value)} placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          <div className="flex gap-2">
            <input value={subEmail} onChange={e => setSubEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && suscribirse()} placeholder={t('Tu email...', 'Your email...', 'Seu email...')} className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <button onClick={suscribirse} disabled={suscribiendo || !subEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-40 cursor-pointer transition-colors flex items-center gap-1.5">
              {suscribiendo ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
              {t('Avisarme', 'Notify me', 'Me avisar')}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            🔒 {t('Tu email no se muestra públicamente. Sin spam.', 'Your email is not shown publicly. No spam.', 'Seu email não é exibido publicamente. Sem spam.')}
          </p>
        </div>
      )}
    </div>
  );
}