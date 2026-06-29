import { MousePointerClick } from 'lucide-react';
import CodeBlock from './CodeBlock';
import AttributionNote from './AttributionNote';
import SectionHeader from './SectionHeader';

// Opción 1 — script externo autoinstalable
const SNIPPET_SCRIPT = `<!-- Botón flotante de reporte — StatusVzla.com -->
<!-- INSTRUCCIONES / INSTRUCTIONS:
  ES: Pega este código justo antes de </body> en tu sitio.
      El botón aparecerá en la esquina inferior derecha automáticamente.
  EN: Paste this code just before </body> in your site.
      The button will appear in the bottom-right corner automatically.
-->
<script src="https://statusvzla.com/widget-reportar.js"><\/script>`;

// Opción 2 — HTML puro sin scripts externos
const SNIPPET_HTML = `<!-- Botón de reporte — StatusVzla.com (HTML puro / Plain HTML) -->
<!-- INSTRUCCIONES / INSTRUCTIONS:
  ES: Pega donde quieras que aparezca el botón.
      No requiere JavaScript externo.
  EN: Paste where you want the button to appear.
      No external JavaScript required.
-->
<a href="https://statusvzla.com/reportar-dano"
   target="_blank"
   rel="noopener noreferrer"
   style="display:inline-flex;align-items:center;gap:7px;
          background:#C0392B;color:#fff;padding:13px 20px;
          border-radius:999px;text-decoration:none;font-weight:700;
          font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,0.3);
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  📍 Reportar edificio dañado / Report damaged building
</a>
<!-- Powered by StatusVzla.com -->`;

export default function WidgetBoton({ t }) {
  return (
    <div>
      <SectionHeader
        icon={<MousePointerClick size={15} style={{ color: '#F87171' }} />}
        title={t('Botón flotante de reporte', 'Floating report button')}
        desc={t(
          'Agrega un botón en tu sitio para que tus visitantes reporten edificios dañados. Aparece en la esquina inferior derecha.',
          'Add a button to your site so visitors can report damaged buildings. Appears in the bottom-right corner.'
        )}
      />

      {/* Preview */}
      <div style={{ marginBottom: 20, borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.22)' }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: 0 }}>{t('Vista previa / Preview', 'Preview')}</p>
        <a href="/reportar-dano" target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#C0392B', color: '#fff', padding: '13px 20px',
          borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 16px rgba(192,57,43,0.55)',
        }}>
          📍 {t('Reportar edificio dañado', 'Report damaged building')}
        </a>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', margin: 0 }}>Powered by StatusVzla.com</p>
      </div>

      {/* Opción 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2471A3', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{t('Script automático (recomendado)', 'Auto script (recommended)')}</p>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10, lineHeight: 1.55 }}>
        {t('Pega este código justo antes de ', 'Paste just before ')}
        <code style={{ color: '#93C5FD', fontSize: 10 }}>&lt;/body&gt;</code>
        {t('. El botón flotante aparece automáticamente en la esquina inferior derecha.', '. The floating button appears automatically in the bottom-right corner.')}
      </p>
      <CodeBlock code={SNIPPET_SCRIPT} label={t('Copiar', 'Copy')} labelOk={t('¡Copiado!', 'Copied!')} />

      <div style={{ margin: '18px 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#15803D', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F6FC', margin: 0 }}>{t('HTML puro (sin script externo)', 'Plain HTML (no external script)')}</p>
      </div>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 10, lineHeight: 1.55 }}>
        {t('Si prefieres no cargar scripts externos, pega este bloque HTML donde necesites el botón en tu página.', 'If you prefer no external scripts, paste this HTML block wherever you need the button on your page.')}
      </p>
      <CodeBlock code={SNIPPET_HTML} label={t('Copiar', 'Copy')} labelOk={t('¡Copiado!', 'Copied!')} />

      <AttributionNote t={t} />
    </div>
  );
}