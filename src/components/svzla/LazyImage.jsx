/**
 * LazyImage — carga la imagen solo cuando entra en el viewport
 * En modo low-BW muestra solo un placeholder hasta que el usuario haga clic.
 * Props: src, alt, className, style, onClick
 */
import { useState, useRef, useEffect } from 'react';
import { useLowBw } from '@/lib/LowBwContext';

export default function LazyImage({ src, alt = '', className = '', style = {}, onClick, thumbClass = '' }) {
  const { lowBw } = useLowBw();
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false); // low-bw: user clicked
  const ref = useRef(null);

  useEffect(() => {
    if (!src) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [src]);

  // Low-BW: no cargar imagen hasta que el usuario la solicite
  const shouldLoad = visible && (!lowBw || revealed);

  if (!src) return null;

  return (
    <div ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden', background: '#F3F4F6', ...style }}>
      {/* Placeholder / skeleton */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#E5E7EB',
        }}>
          {lowBw && !revealed ? (
            <button
              onClick={() => setRevealed(true)}
              style={{
                background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📷 Ver foto
            </button>
          ) : (
            <span style={{ fontSize: 20, color: '#9CA3AF' }}>🖼️</span>
          )}
        </div>
      )}

      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onClick={onClick}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 200ms ease',
            cursor: onClick ? 'pointer' : 'default',
          }}
        />
      )}
    </div>
  );
}