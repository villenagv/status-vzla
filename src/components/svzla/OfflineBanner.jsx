/**
 * OfflineBanner — muestra un banner cuando el usuario está sin conexión
 * Props: offline (bool), onRetry (fn opcional)
 */
import { useLang } from '@/lib/LangContext';

export default function OfflineBanner({ offline, onRetry }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';

  if (!offline) return null;

  return (
    <div style={{
      position: 'fixed', top: 54, left: 0, right: 0, zIndex: 100,
      background: '#7F1D1D', borderBottom: '1px solid #991B1B',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#FCA5A5', margin: 0, lineHeight: 1.4 }}>
        📵 {es
          ? 'Sin conexión. Tu borrador se guardó. Intenta de nuevo cuando tengas señal.'
          : pt
          ? 'Sem conexão. Seu rascunho foi salvo. Tente novamente quando tiver sinal.'
          : 'Offline. Your draft was saved. Retry when you have signal.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: '#FCA5A5', color: '#7F1D1D', border: 'none',
            borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          {es ? 'Reintentar' : pt ? 'Tentar novamente' : 'Retry'}
        </button>
      )}
    </div>
  );
}