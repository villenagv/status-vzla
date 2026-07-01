import { useState } from 'react';
import { X, Bell, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import BuscadorEdificioSuscripcion from './BuscadorEdificioSuscripcion';

export default function ModalSuscripcionEdificio({ edificioId, edificioNombre, onClose }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  const [seleccionado, setSeleccionado] = useState(edificioId ? { id: edificioId, nombre: edificioNombre } : null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const suscribirse = async () => {
    if (!seleccionado || !email.trim()) return;
    setEnviando(true);
    setError('');
    try {
      await base44.functions.invoke('registrarSuscripcionEdificio', {
        edificio_id: seleccionado.id,
        email: email.trim(),
        nombre: nombre.trim(),
        lang,
      });
      setOk(true);
    } catch {
      setError(t('Error al suscribirse. Intenta de nuevo.', 'Error subscribing. Try again.', 'Erro ao se inscrever. Tente novamente.'));
    }
    setEnviando(false);
  };

  const nombreEdificio = seleccionado?.nombre || t('este edificio', 'this building', 'este edifício');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              🔔 {t('Alertas por email', 'Email alerts', 'Alertas por email')}
            </p>
            <h2 className="text-base font-black text-[#1A1F2E] leading-tight">
              {seleccionado
                ? t(`Suscribirte a ${nombreEdificio}`, `Subscribe to ${nombreEdificio}`, `Inscrever-se em ${nombreEdificio}`)
                : t('¿A qué edificio quieres suscribirte?', 'Which building do you want to follow?', 'A qual edifício você quer se inscrever?')}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer flex-shrink-0">
            <X size={14} className="text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {ok ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5">
              <Check size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-bold text-green-700">
                {t('¡Listo! Te avisaremos por email.', "Done! We'll notify you by email.", 'Pronto! Avisaremos por email.')}
              </p>
            </div>
          ) : !seleccionado ? (
            <BuscadorEdificioSuscripcion t={t} onSeleccionar={setSeleccionado} />
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {t('Te avisamos por email si cambia el estado o hay novedades. Sin cuenta necesaria.',
                   'We will email you if the status changes or there is news. No account needed.',
                   'Avisamos por email se o status mudar ou houver novidades. Sem conta necessária.')}
              </p>
              {!edificioId && (
                <button onClick={() => setSeleccionado(null)} className="text-xs text-blue-600 underline cursor-pointer">
                  {t('← Elegir otro edificio', '← Choose another building', '← Escolher outro edifício')}
                </button>
              )}
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder={t('Tu nombre (opcional)', 'Your name (optional)', 'Seu nome (opcional)')}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && suscribirse()}
                type="email"
                placeholder={t('Tu email...', 'Your email...', 'Seu email...')}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button onClick={suscribirse} disabled={enviando || !email.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                {enviando ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
                {t('Suscribirme', 'Subscribe', 'Inscrever-se')}
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                🔒 {t('Tu email no se muestra públicamente. Sin spam.', 'Your email is not shown publicly. No spam.', 'Seu email não é exibido publicamente. Sem spam.')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}