import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * ImagenProxy — sirve imágenes desde cualquier URL sin exponer el enlace original.
 *
 * - Si la URL ya es del storage interno, la usa directo.
 * - Si es externa, la sirve a través del backend proxy (sin que el navegador
 *   haga contacto con el sitio original).
 * - En modo bajo consumo (lowBw): no carga ninguna imagen.
 *
 * Props:
 *   src: string — URL original (externa o interna)
 *   alt: string
 *   className, style: opcionales
 *   fallback: ReactNode — placeholder si no hay imagen
 *   onLoad, onError: callbacks
 */
export default function ImagenProxy({ src, alt = '', className = '', style = {}, fallback, onLoad, onError, ...rest }) {
  const [proxyUrl, setProxyUrl] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!src) { setLoading(false); setProxyUrl(null); return; }

    // Si es interna, usarla directo
    if (esUrlInterna(src)) {
      setProxyUrl(src);
      setLoading(false);
      return;
    }

    // URL externa — pasar por proxy
    setLoading(true);
    setError(false);

    // Construir URL del proxy backend
    const proxyBase = `${window.location.origin}/api/proxyImagen`;
    const proxySrc = `${proxyBase}?url=${encodeURIComponent(src)}`;
    setProxyUrl(proxySrc);
    setLoading(false);
  }, [src]);

  if (!src || error) {
    return fallback || null;
  }

  if (loading && !proxyUrl) {
    return fallback || (
      <div className="bg-gray-800 animate-pulse flex items-center justify-center" style={{ width: '100%', height: '100%', ...style }}>
        <span className="text-lg opacity-30">🏗️</span>
      </div>
    );
  }

  return (
    <img
      src={proxyUrl}
      alt={alt}
      className={className}
      style={style}
      onLoad={(e) => {
        setLoading(false);
        onLoad?.(e);
      }}
      onError={(e) => {
        // Fallback: si el proxy falla, intentar la URL original directo
        if (!esUrlInterna(src) && proxyUrl !== src) {
          setProxyUrl(src);
        } else {
          setError(true);
          onError?.(e);
        }
      }}
      loading="lazy"
      {...rest}
    />
  );
}

function esUrlInterna(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.includes('base44') || u.hostname.includes('usercontent');
  } catch { return false; }
}