/**
 * StatusVzla.com — Widget de Reporte de Edificios
 * Copia este script en tu sitio web para agregar el botón de reporte.
 * Uso: <script src="https://statusvzla.com/widget-reportar.js"></script>
 */
(function () {
  var BASE_URL = 'https://statusvzla.com';
  var lang = (navigator.language || 'es').startsWith('en') ? 'en' : 'es';
  var labels = {
    es: { btn: '📍 Reportar edificio dañado', powered: 'Powered by StatusVzla.com' },
    en: { btn: '📍 Report damaged building',  powered: 'Powered by StatusVzla.com' },
  };
  var l = labels[lang];

  var style = document.createElement('style');
  style.innerHTML = [
    '.svzla-widget-wrap{position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
    '.svzla-widget-btn{display:inline-flex;align-items:center;gap:7px;background:#C0392B;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px;box-shadow:0 4px 16px rgba(192,57,43,0.55),0 0 0 1px rgba(255,255,255,0.12);transition:background 150ms,transform 150ms;white-space:nowrap}',
    '.svzla-widget-btn:hover{background:#992E22;transform:scale(1.03)}',
    '.svzla-widget-btn:active{transform:scale(0.98)}',
    '.svzla-widget-credit{font-size:9px;color:rgba(255,255,255,0.55);text-decoration:none;text-align:right;background:rgba(0,0,0,0.45);padding:2px 8px;border-radius:20px;backdrop-filter:blur(4px)}',
    '.svzla-widget-credit:hover{color:#F5C518}',
  ].join('');
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.className = 'svzla-widget-wrap';

  var btn = document.createElement('a');
  btn.className = 'svzla-widget-btn';
  btn.href = BASE_URL + '/reportar-dano';
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.innerHTML = l.btn;

  var credit = document.createElement('a');
  credit.className = 'svzla-widget-credit';
  credit.href = BASE_URL;
  credit.target = '_blank';
  credit.rel = 'noopener noreferrer';
  credit.innerText = l.powered;

  wrap.appendChild(btn);
  wrap.appendChild(credit);

  if (document.body) {
    document.body.appendChild(wrap);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(wrap);
    });
  }
})();
