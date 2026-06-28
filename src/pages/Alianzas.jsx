import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, Check, Globe, Database, Mail, Map } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const IFRAME_CODE = `<div style="position:relative;width:100%;height:500px;border-radius:12px;overflow:hidden;">
  <iframe
    src="https://statusvzla.com/mapa-danos"
    width="100%"
    height="100%"
    frameborder="0"
    title="Mapa de daños - StatusVzla"
    loading="lazy"
    allowfullscreen>
  </iframe>
  <div style="position:absolute;bottom:10px;right:10px;background:rgba(13,17,23,0.90);padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800;color:#F5C518;border:1px solid rgba(245,197,24,0.40);">
    Powered by StatusVzla.com
  </div>
</div>`;

export default function Alianzas() {
  const { lang } = useLang();
  const es = lang !== 'en';
  const [copiado, setCopiado] = useState(false);
  const [mapaVisible, setMapaVisible] = useState(false);

  const copiar = () => {
    navigator.clipboard.writeText(IFRAME_CODE);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const t = (esStr, enStr) => es ? esStr : enStr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      <TopBar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
          <ChevronLeft size={15} /> {t('Volver', 'Go back')}
        </Link>

        {/* Hero */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div style={{ fontSize: 32 }}>🤝</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F0F6FC', margin: 0, letterSpacing: '-0.02em' }}>
                {t('Compartimos nuestros datos', 'We share our data')}
              </h1>
              <p style={{ fontSize: 12, color: '#F5C518', margin: 0, fontWeight: 600 }}>StatusVzla.com</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, margin: 0 }}>
            {t(
              'Si tienes una plataforma, sitio web o aplicación relacionada con la emergencia en Venezuela, puedes integrar nuestro mapa de daños de forma gratuita. Solo copia y pega el código.',
              'If you have a platform, website or app related to the emergency in Venezuela, you can integrate our damage map for free. Just copy and paste the code.'
            )}
          </p>
        </div>

        {/* Aviso importante */}
        <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.25)' }}>
          <p style={{ fontSize: 13, color: '#FCD34D', lineHeight: 1.6, margin: 0 }}>
            <strong>⚡ {t('Importante:', 'Important:')}</strong>{' '}
            {t(
              'La precisión de los datos depende de los ciudadanos e instituciones que los reportan. Cuantas más fuentes compartan con nosotros, mejor será la información para todos.',
              'Data accuracy depends on the citizens and institutions that report it. The more sources that share with us, the better the information for everyone.'
            )}
          </p>
        </div>

        {/* Vista previa del mapa embebido */}
        <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#111318' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} style={{ color: '#6FCF97' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
                {t('Mapa embebido — para tu sitio web', 'Embedded map — for your website')}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
              {t('Copia el código y pégalo en cualquier página. Sin registro ni costo.', 'Copy the code and paste it into any page. No registration or cost.')}
            </p>
          </div>

          {/* Vista previa activable */}
          <div className="mx-5 mt-4">
            {!mapaVisible ? (
              <button
                onClick={() => setMapaVisible(true)}
                className="w-full flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer"
                style={{
                  height: 200, border: '2px dashed rgba(111,207,151,0.30)',
                  background: 'rgba(111,207,151,0.04)',
                }}
              >
                <Map size={32} style={{ color: '#6FCF97', opacity: 0.6 }} />
                <div className="text-center">
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#6FCF97', margin: 0 }}>
                    {t('▶ Ver vista previa del mapa', '▶ Preview the map')}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: '4px 0 0' }}>
                    {t('Clic para cargar (consume datos)', 'Click to load (uses data)')}
                  </p>
                </div>
              </button>
            ) : (
              <div style={{ position: 'relative', height: 380, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
                <iframe
                  src="/mapa-danos"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  title="Mapa de daños StatusVzla"
                  style={{ display: 'block', border: 'none' }}
                />
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  background: 'rgba(13,17,23,0.90)', border: '1px solid rgba(245,197,24,0.40)',
                  padding: '4px 10px', borderRadius: 8,
                  fontSize: 10, fontWeight: 800, color: '#F5C518',
                  pointerEvents: 'none',
                }}>
                  Powered by StatusVzla.com
                </div>
              </div>
            )}
          </div>

          {/* Código copiable */}
          <div className="relative mx-5 my-4">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {t('Código para tu web', 'Code for your website')}
            </p>
            <pre style={{
              background: '#0D1117', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10,
              padding: '14px 16px', fontSize: 10.5, color: '#93C5FD', overflowX: 'auto',
              lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {IFRAME_CODE}
            </pre>
            <button
              onClick={copiar}
              style={{
                position: 'absolute', top: 34, right: 8,
                background: copiado ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${copiado ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                color: copiado ? '#6FCF97' : 'rgba(255,255,255,0.65)',
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
              }}>
              {copiado ? <Check size={12} /> : <Copy size={12} />}
              {copiado ? t('¡Copiado!', 'Copied!') : t('Copiar', 'Copy')}
            </button>
          </div>

          <div className="mx-5 mb-5 rounded-lg px-4 py-3" style={{ background: 'rgba(111,207,151,0.07)', border: '1px solid rgba(111,207,151,0.20)' }}>
            <p style={{ fontSize: 11, color: '#6FCF97', margin: 0, lineHeight: 1.55 }}>
              📌 <strong>{t('Atribución requerida:', 'Attribution required:')}</strong>{' '}
              {t(
                'Al usar este código debes mantener visible el texto "Powered by StatusVzla.com". Ya está incluido en el código.',
                'When using this code you must keep "Powered by StatusVzla.com" visible. It\'s already included in the code.'
              )}
            </p>
          </div>
        </div>

        {/* ¿Tienes datos? */}
        <div className="mb-6 rounded-2xl p-5" style={{ background: 'rgba(36,113,163,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} style={{ color: '#60A5FA' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}>
              {t('¿Tienes datos que pueden ayudar?', 'Do you have data that can help?')}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, marginBottom: 14 }}>
            {t(
              'Si tu organización, municipio, ONG, hospital o institución tiene información actualizada sobre personas, edificios, refugios o zonas afectadas, escríbenos. Podemos integrarla para que llegue a más personas.',
              'If your organization, municipality, NGO, hospital or institution has updated information about people, buildings, shelters or affected areas, write to us. We can integrate it so it reaches more people.'
            )}
          </p>
          <a
            href="mailto:villenagv@gmail.com?subject=Alianza%20StatusVzla%20-%20Datos"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
              background: '#2471A3', color: '#fff', borderRadius: 12, textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
            }}>
            <Mail size={14} />
            villenagv@gmail.com
          </a>
        </div>

        {/* Quiénes pueden aliarse */}
        <div className="mb-6">
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            {t('¿Quiénes pueden participar?', 'Who can participate?')}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { icon: '🏥', es: 'Hospitales y clínicas', en: 'Hospitals & clinics' },
              { icon: '🏛️', es: 'Alcaldías y gobernaciones', en: 'Municipalities & governments' },
              { icon: '🤝', es: 'ONGs y voluntarios', en: 'NGOs & volunteers' },
              { icon: '📰', es: 'Medios de comunicación', en: 'News outlets' },
              { icon: '🛠️', es: 'Desarrolladores', en: 'Developers' },
              { icon: '🚒', es: 'Protección Civil y Bomberos', en: 'Civil Protection & Firefighters' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 500, lineHeight: 1.35 }}>{es ? item.es : item.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
            {t(
              'StatusVzla.com es una plataforma ciudadana sin fines de lucro. Toda alianza de datos es voluntaria, transparente y orientada al bien común. No vendemos información ni datos personales.',
              'StatusVzla.com is a non-profit citizen platform. All data partnerships are voluntary, transparent, and oriented toward the common good. We do not sell information or personal data.'
            )}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}