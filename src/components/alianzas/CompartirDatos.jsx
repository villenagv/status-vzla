import { Database, Mail, Code } from 'lucide-react';
import SectionHeader from './SectionHeader';

export default function CompartirDatos({ t, es }) {
  return (
    <div>
      <SectionHeader
        icon={<Database size={15} style={{ color: '#60A5FA' }} />}
        title={t('¿Tienes datos que pueden ayudar?', 'Do you have data that can help?')}
        desc={t(
          'Si tu organización tiene información actualizada sobre personas, edificios, refugios o zonas afectadas, podemos integrarla para que llegue a más personas.',
          'If your organization has updated information about people, buildings, shelters or affected areas, we can integrate it to reach more people.'
        )}
      />

      {/* Email CTA */}
      <div style={{ marginBottom: 16, borderRadius: 12, padding: '14px 16px', background: 'rgba(36,113,163,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 12 }}>
          {t(
            'Escríbenos con el tipo de datos que tienes, la frecuencia de actualización y el formato (CSV, Excel, JSON, API). Lo analizamos y te contactamos.',
            'Write to us with the type of data you have, the update frequency and format (CSV, Excel, JSON, API). We\'ll review and contact you.'
          )}
        </p>
        <a href="mailto:villenagv@gmail.com?subject=Alianza%20StatusVzla%20-%20Datos" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px',
          background: '#2471A3', color: '#fff', borderRadius: 12, textDecoration: 'none',
          fontSize: 13, fontWeight: 700,
        }}>
          <Mail size={14} /> villenagv@gmail.com
        </a>
      </div>

      {/* GitHub */}
      <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', background: '#111318' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Code size={13} style={{ color: '#C4B5FD' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{t('Código abierto · GitHub', 'Open source · GitHub')}</p>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { emoji: '⭐', label: 'villenagv/status-vzla', sub: 'github.com/villenagv/status-vzla', url: 'https://github.com/villenagv/status-vzla', badge: 'GitHub ↗', color: '#C4B5FD' },
            { emoji: '📄', label: t('Documentación técnica (README)', 'Technical docs (README)'), sub: 'README', url: 'https://github.com/villenagv/status-vzla/blob/main/README.md', badge: 'README ↗', color: '#C4B5FD' },
            { emoji: '🐛', label: t('Reportar errores o sugerir mejoras', 'Report bugs / suggestions'), sub: 'GitHub Issues', url: 'https://github.com/villenagv/status-vzla/issues', badge: 'Issues ↗', color: '#F87171' },
          ].map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 12px', textDecoration: 'none',
            }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 10, color: '#9BA5B0', margin: 0 }}>{item.sub}</p>
              </div>
              <span style={{ fontSize: 10, color: item.color, fontWeight: 600, flexShrink: 0 }}>{item.badge}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quiénes */}
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
        {t('¿Quiénes pueden participar?', 'Who can participate?')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 16 }}>
        {[
          { icon: '🏥', es: 'Hospitales y clínicas',       en: 'Hospitals & clinics' },
          { icon: '🏛️', es: 'Alcaldías y gobernaciones',   en: 'Municipalities' },
          { icon: '🤝', es: 'ONGs y voluntarios',           en: 'NGOs & volunteers' },
          { icon: '📰', es: 'Medios de comunicación',       en: 'News outlets' },
          { icon: '🛠️', es: 'Desarrolladores',             en: 'Developers' },
          { icon: '🚒', es: 'Protección Civil',             en: 'Civil Protection' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', fontWeight: 500, lineHeight: 1.3 }}>{es ? item.es : item.en}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
          {t(
            'StatusVzla.com es una plataforma ciudadana sin fines de lucro. Toda alianza es voluntaria, transparente y orientada al bien común. No vendemos información ni datos personales.',
            'StatusVzla.com is a non-profit citizen platform. All partnerships are voluntary, transparent, and for the common good. We do not sell data or personal information.'
          )}
        </p>
      </div>
    </div>
  );
}