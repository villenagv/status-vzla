import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import WidgetMapa from '@/components/alianzas/WidgetMapa';
import WidgetBoton from '@/components/alianzas/WidgetBoton';
import ApiPublica from '@/components/alianzas/ApiPublica';
import CompartirDatos from '@/components/alianzas/CompartirDatos';

const TABS = (t) => [
  { key: 'mapa',   icon: '🗺️', label: t('Widget Mapa',     'Map Widget') },
  { key: 'boton',  icon: '📍', label: t('Botón Reporte',   'Report Button') },
  { key: 'api',    icon: '⚙️', label: t('API Pública',     'Public API') },
  { key: 'datos',  icon: '📦', label: t('Compartir datos', 'Share Data') },
];

export default function Alianzas() {
  const { lang } = useLang();
  const es = lang !== 'en';
  const t = (esStr, enStr) => es ? esStr : enStr;
  const [tab, setTab] = useState('mapa');
  const tabs = TABS(t);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      <TopBar />
      <div style={{ maxWidth: 680, margin: '0 auto', width: '100%', padding: '24px 16px', flex: 1 }}>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginBottom: 20 }}>
          <ChevronLeft size={15} /> {t('Volver', 'Go back')}
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🤝</span>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#F0F6FC', margin: 0, letterSpacing: '-0.02em' }}>
                {t('Compartimos nuestros datos', 'We share our data')}
              </h1>
              <p style={{ fontSize: 11, color: '#F5C518', margin: 0, fontWeight: 600 }}>
                StatusVzla.com · {t('Integración gratuita', 'Free integration')}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>
            {t(
              'Si tienes una plataforma o sitio web relacionado con la emergencia en Venezuela, integra nuestros widgets de forma gratuita. Sin registro ni costo.',
              'If you have a platform or website related to the emergency in Venezuela, integrate our widgets for free. No registration or cost.'
            )}
          </p>
        </div>

        {/* Aviso */}
        <div style={{ marginBottom: 18, borderRadius: 12, padding: '10px 14px', background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.22)' }}>
          <p style={{ fontSize: 12, color: '#FCD34D', lineHeight: 1.55, margin: 0 }}>
            ⚡ {t(
              'La precisión de los datos depende de quienes los reportan. Cuantas más fuentes compartan con nosotros, mejor será la información para todos.',
              'Data accuracy depends on who reports it. The more sources share with us, the better the information for everyone.'
            )}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} style={{
              padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === tb.key ? '#F0F6FC' : 'rgba(255,255,255,0.06)',
              color: tab === tb.key ? '#0D1117' : 'rgba(255,255,255,0.65)',
              border: `1px solid ${tab === tb.key ? 'transparent' : 'rgba(255,255,255,0.10)'}`,
              whiteSpace: 'nowrap', transition: 'all 150ms',
            }}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* Contenido por tab */}
        {tab === 'mapa'  && <WidgetMapa t={t} />}
        {tab === 'boton' && <WidgetBoton t={t} />}
        {tab === 'api'   && <ApiPublica t={t} es={es} />}
        {tab === 'datos' && <CompartirDatos t={t} es={es} />}

      </div>
      <Footer />
    </div>
  );
}