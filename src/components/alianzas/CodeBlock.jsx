import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ code, label, labelOk }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        background: '#0D1117',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10,
        padding: '14px 16px',
        paddingRight: 90,
        fontSize: 10,
        color: '#93C5FD',
        lineHeight: 1.65,
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 240,
        overflowY: 'auto',
        fontFamily: 'monospace',
      }}>
        {code}
      </pre>
      <button onClick={copy} style={{
        position: 'absolute', top: 8, right: 8,
        background: copied ? 'rgba(111,207,151,0.15)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${copied ? 'rgba(111,207,151,0.40)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
        color: copied ? '#6FCF97' : 'rgba(255,255,255,0.65)',
        display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
        transition: 'all 150ms',
      }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? labelOk : label}
      </button>
    </div>
  );
}