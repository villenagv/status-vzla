export default function AttributionNote({ t }) {
  return (
    <div style={{ marginTop: 12, borderRadius: 10, padding: '10px 14px', background: 'rgba(111,207,151,0.06)', border: '1px solid rgba(111,207,151,0.18)' }}>
      <p style={{ fontSize: 11, color: '#6FCF97', margin: 0, lineHeight: 1.5 }}>
        📌 <strong>{t('Atribución requerida:', 'Attribution required:')}</strong>{' '}
        {t(
          'Debes mantener visible el texto "Powered by StatusVzla.com". Ya está incluido en el código.',
          'You must keep "Powered by StatusVzla.com" visible. Already included in the code.'
        )}
      </p>
    </div>
  );
}