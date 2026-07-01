import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import ModalSuscripcionEdificio from './ModalSuscripcionEdificio';

/**
 * Botón flotante para suscribirse a alertas de edificios.
 * Sin props (Home / Directorio): modo genérico, permite buscar el edificio.
 * Con edificioId + edificioNombre (ficha de edificio): modo contextual,
 * el texto y el modal ya apuntan directo a ese edificio.
 */
export default function BotonSuscripcionEdificios({ edificioId, edificioNombre }) {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label={t('Suscribirse a alertas de edificio', 'Subscribe to building alerts', 'Inscrever-se em alertas de edifício')}
        style={{
          position: 'fixed', left: 14, bottom: 20, zIndex: 40,
          background: '#1D4ED8', color: '#fff', border: 'none',
          borderRadius: 999, padding: '13px 18px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}
      >
        <Bell size={15} />
        {edificioId
          ? t('Alertas de este edificio', 'Alerts for this building', 'Alertas deste edifício')
          : t('Suscribirme a un edificio', 'Subscribe to a building', 'Inscrever-se em um edifício')}
      </button>

      {abierto && (
        <ModalSuscripcionEdificio
          edificioId={edificioId}
          edificioNombre={edificioNombre}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
}