import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Building2, MapPin, AlertTriangle, ChevronLeft, ChevronRight, Bell, ExternalLink, X, Check, ZoomIn } from 'lucide-react';

const FUENTE_LABELS = {
  importacion_masiva: 'Base de datos',
  importacion_vzla:   'Base VZ',
  web_publica:        'Ciudadano',
  institucional:      'Institucional',
  ciudadano:          'Ciudadano',
};

function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m < 1) return 'ahora';
  return `hace ${m}m`;
}

const NIVEL_CFG = {
  leve:        { label: 'Daño leve',    color: '#B7950B', bg: '#FEF9E7', border: '#F9E79F' },
  moderado:    { label: 'Daño moderado',color: '#CA6F1E', bg: '#FEF5E7', border: '#FAD7A0' },
  grave:       { label: 'Daño grave',   color: '#C0392B', bg: '#FDEDEC', border: '#F5B7B1' },
  critico:     { label: 'CRÍTICO',      color: '#922B21', bg: '#FDEDEC', border: '#F1948A' },
  colapsado:   { label: 'COLAPSADO',    color: '#4A0E0E', bg: '#FCECEC', border: '#C0392B' },
  no_evaluado: { label: 'Sin evaluar',  color: '#7F8C8D', bg: '#F2F3F4', border: '#D5DBDB' },
};

// ── Carrusel de fotos ─────────────────────────────────────────────────────────
function LightboxFoto({ fotos, idx, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') onPrev(); if (e.key === 'ArrowRight') onNext(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <X size={20} />
      </button>
      {fotos.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <ChevronLeft size={22} />
          </button>
          <button onClick={e => { e.stopPropagation(); onNext(); }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <ChevronRight size={22} />
          </button>
        </>
      )}
      <img
        src={fotos[idx]}
        alt={`Foto ${idx + 1}`}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
      />
      {fotos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
          {idx + 1} / {fotos.length}
        </div>
      )}
    </div>
  );
}

function CarruselFotos({ fotos, nivelCfg }) {
  const [fotoIdx, setFotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!fotos || fotos.length === 0) {
    return (
      <div style={{ height: 160, background: nivelCfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
        <Building2 size={40} style={{ color: nivelCfg.color, opacity: 0.5 }} />
        <p style={{ fontSize: 10, color: nivelCfg.color, margin: 0, fontWeight: 600 }}>Sin foto disponible</p>
      </div>
    );
  }
  const prev = (e) => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); };
  const next = (e) => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); };
  return (
    <>
      {lightbox && (
        <LightboxFoto
          fotos={fotos}
          idx={fotoIdx}
          onClose={() => setLightbox(false)}
          onPrev={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
          onNext={() => setFotoIdx(i => (i + 1) % fotos.length)}
        />
      )}
      <div style={{ height: 200, position: 'relative', background: '#111', overflow: 'hidden' }}>
        <img
          src={fotos[fotoIdx]}
          alt={`Foto ${fotoIdx + 1}`}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        {/* Botón abrir pantalla completa */}
        <button onPointerDown={e => { e.stopPropagation(); setLightbox(true); }}
          style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.60)', border: 'none', borderRadius: 8, padding: '5px 9px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, zIndex: 6 }}>
          <ZoomIn size={12} /> Ver foto
        </button>
        {fotos.length > 1 && (
          <>
            <button onPointerDown={prev} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <ChevronLeft size={16} />
            </button>
            <button onPointerDown={next} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              <ChevronRight size={16} />
            </button>
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 5 }}>
              {fotos.map((_, i) => (
                <div key={i} style={{ width: i === fotoIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === fotoIdx ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'width 150ms' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, zIndex: 5 }}>
              {fotoIdx + 1}/{fotos.length}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Overlay de confirmación para marcar colapsado ─────────────────────────────
function OverlayColapsado({ edificio, onConfirmar, onCancelar, guardando }) {
  const [notas, setNotas] = useState('');
  const [notificar, setNotificar] = useState(true);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 560, boxShadow: '0 -8px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>💥</div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Confirmar: COLAPSADO</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{edificio.nombre_lugar || edificio.tipo_estructura?.replace(/_/g, ' ')} · {edificio.ciudad}</p>
          </div>
          <button onClick={onCancelar} style={{ marginLeft: 'auto', background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8 }}>
          <AlertTriangle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
            <strong>Acceso bloqueado.</strong> Al marcar como colapsado: no se podrán pedir inspecciones presenciales.
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Notas rápidas (opcional)</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} maxLength={300}
            placeholder="Ej: Colapso total confirmado visualmente. Rescate en curso."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#111', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => setNotificar(v => !v)} style={{ width: '100%', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: notificar ? '#eff6ff' : '#f9fafb', border: `1.5px solid ${notificar ? '#bfdbfe' : '#e5e7eb'}` }}>
          <Bell size={16} style={{ color: notificar ? '#1d4ed8' : '#9ca3af', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: notificar ? '#1e40af' : '#6b7280', margin: 0 }}>{notificar ? '🔔 Notificaciones activadas' : '🔕 Sin notificaciones'}</p>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Avisar a suscriptores del cambio de estado</p>
          </div>
          <div style={{ width: 36, height: 20, borderRadius: 99, background: notificar ? '#1d4ed8' : '#d1d5db', position: 'relative', transition: 'background 200ms' }}>
            <div style={{ position: 'absolute', top: 3, left: notificar ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 200ms' }} />
          </div>
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onCancelar} disabled={guardando} style={{ padding: '14px', borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onConfirmar(notas, notificar)} disabled={guardando} style={{ padding: '14px', borderRadius: 14, border: 'none', background: guardando ? '#fca5a5' : '#991b1b', color: '#fff', fontWeight: 800, fontSize: 13, cursor: guardando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {guardando ? <Loader2 size={16} className="animate-spin" /> : '💥'}
            {guardando ? 'Guardando...' : 'Confirmar colapsado'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de edificio ────────────────────────────────────────────────────────
function TarjetaEdificio({ edificio, onAccion, procesando }) {
  const cfg = NIVEL_CFG[edificio.nivel_dano] || NIVEL_CFG.no_evaluado;
  const tieneAtrapados = ['si', 'voces', 'posible'].includes(edificio.personas_atrapadas);
  const fotos = edificio.foto_urls || [];

  const cardRef = useRef(null);
  const startX = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const THRESHOLD = 100;

  const onPointerDown = (e) => { startX.current = e.clientX; setDragging(true); };
  const onPointerMove = (e) => { if (!dragging || startX.current === null) return; setDragX(e.clientX - startX.current); };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX > THRESHOLD) onAccion('sin_danos');
    else if (dragX < -THRESHOLD) onAccion('colapsado');
    setDragX(0);
    startX.current = null;
  };

  const swipeDir = dragX > 40 ? 'right' : dragX < -40 ? 'left' : null;

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {swipeDir === 'right' && (
        <div style={{ position: 'absolute', top: 24, left: 20, zIndex: 10, background: '#166534', color: '#fff', borderRadius: 10, padding: '6px 14px', fontWeight: 800, fontSize: 13, transform: 'rotate(-12deg)', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>✅ SIN DAÑOS</div>
      )}
      {swipeDir === 'left' && (
        <div style={{ position: 'absolute', top: 24, right: 20, zIndex: 10, background: '#991b1b', color: '#fff', borderRadius: 10, padding: '6px 14px', fontWeight: 800, fontSize: 13, transform: 'rotate(12deg)', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>💥 COLAPSADO</div>
      )}

      <div ref={cardRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        style={{ background: '#fff', borderRadius: 20, border: `2.5px solid ${swipeDir === 'left' ? '#991b1b' : swipeDir === 'right' ? '#166534' : cfg.border}`, overflow: 'hidden', boxShadow: '0 6px 28px rgba(0,0,0,0.10)', transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`, transition: dragging ? 'none' : 'transform 300ms ease, border-color 150ms', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}>

        {/* Carrusel de fotos + badge de nivel */}
        <div style={{ position: 'relative' }}>
          <CarruselFotos fotos={fotos} nivelCfg={cfg} />
          <div style={{ position: 'absolute', top: 10, left: 10, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 800, zIndex: 6 }}>
            {cfg.label}
          </div>
          {/* Badge riesgo de colapso */}
          {(edificio.riesgo_colapso || edificio.triage_riesgo === 'riesgo_colapso') && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 800, zIndex: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={10} /> RIESGO COLAPSO
            </div>
          )}
        </div>

        <div style={{ padding: '14px 18px 16px' }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 3px', lineHeight: 1.3 }}>
            {edificio.nombre_lugar || edificio.tipo_estructura?.replace(/_/g, ' ') || 'Edificio sin nombre'}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>
            {edificio.tipo_estructura?.replace(/_/g, ' ')} · {tiempoRelativo(edificio.created_date)}
            {edificio.fuente && <span style={{ marginLeft: 6, background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{FUENTE_LABELS[edificio.fuente] || edificio.fuente}</span>}
          </p>

          {(edificio.direccion || edificio.ciudad) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 8 }}>
              <MapPin size={12} style={{ color: '#9ca3af', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                {[edificio.direccion, edificio.ciudad, edificio.estado_region].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}

          {edificio.descripcion && (
            <p style={{ fontSize: 11, color: '#374151', margin: '0 0 8px', lineHeight: 1.5, background: '#f9fafb', borderRadius: 8, padding: '8px 10px', border: '1px solid #e5e7eb' }}>
              "{edificio.descripcion.slice(0, 160)}{edificio.descripcion.length > 160 ? '...' : ''}"
            </p>
          )}

          {tieneAtrapados && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={12} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', margin: 0 }}>🆘 Personas atrapadas reportadas</p>
            </div>
          )}

          {edificio.triage_estado && edificio.triage_estado !== 'pendiente_triage' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 10px', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#166534' }}>✅ Ya clasificado: {edificio.triage_estado?.replace(/_/g, ' ')}</span>
              {edificio.triage_por && <span style={{ fontSize: 9, color: '#4ade80' }}>· por {edificio.triage_por}</span>}
            </div>
          )}

          {edificio.triage_estado === 'sin_informacion' && (
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '5px 10px', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#5b21b6' }}>❓ Sin información suficiente</span>
            </div>
          )}

          <a href={`/edificio?id=${edificio.id}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 10, color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginTop: 2 }}
            onClick={e => e.stopPropagation()}>
            <ExternalLink size={10} /> Ver ficha completa
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingInline: 8 }}>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}><ChevronLeft size={12} /> ← colapsado</p>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: 3 }}>sin daños → <ChevronRight size={12} /></p>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function TriajeMasivo() {
  const [cola, setCola]             = useState([]);
  const [idx, setIdx]               = useState(0);
  const [cargando, setCargando]     = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [procesados, setProcesados] = useState([]);
  const [stats, setStats]           = useState({ colapsado: 0, riesgo_colapso: 0, danos_visibles: 0, sin_danos: 0, sin_informacion: 0 });
  const [contadoresGlobales, setContadoresGlobales] = useState({ colapsado: 0, riesgo_colapso: 0, danos_visibles: 0, sin_danos: 0, sin_informacion: 0, pendiente: 0, total: 0 });
  const [filtroFuente, setFiltroFuente] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [overlayColapsado, setOverlayColapsado] = useState(false);
  const [accionPendiente, setAccionPendiente]   = useState(null);
  const [toastMsg, setToastMsg]     = useState(null);
  const [user, setUser]             = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const cargarCola = useCallback(async () => {
    setCargando(true);
    setProcesados([]);
    setIdx(0);
    setStats({ colapsado: 0, riesgo_colapso: 0, danos_visibles: 0, sin_danos: 0, sin_informacion: 0 });
    try {
      const todos = await base44.entities.ReportesDano.list('-created_date', 300);
      const lista = todos || [];
      const filtrados = filtroFuente
        ? lista.filter(e => e.fuente === filtroFuente || (!e.fuente && filtroFuente === 'importacion_masiva'))
        : lista;
      setCola(filtrados);

      // Calcular contadores globales de toda la lista filtrada
      const cg = { colapsado: 0, riesgo_colapso: 0, danos_visibles: 0, sin_danos: 0, sin_informacion: 0, pendiente: 0, total: filtrados.length };
      for (const e of filtrados) {
        if (e.triage_estado === 'sin_informacion') cg.sin_informacion++;
        else if (e.triage_estado === 'clasificado') {
          if (e.triage_riesgo === 'riesgo_colapso' && e.nivel_dano === 'colapsado') cg.colapsado++;
          else if (e.triage_riesgo === 'riesgo_colapso') cg.riesgo_colapso++;
          else if (e.triage_riesgo === 'riesgo_moderado') cg.danos_visibles++;
          else if (e.triage_riesgo === 'solo_estetico') cg.sin_danos++;
        } else {
          cg.pendiente++;
        }
      }
      setContadoresGlobales(cg);
    } catch (e) {
      console.error('Error cargando cola:', e);
    }
    setCargando(false);
  }, [filtroFuente]);

  useEffect(() => { cargarCola(); }, [cargarCola]);

  const mostrarToast = (msg, tipo = 'ok') => {
    setToastMsg({ msg, tipo });
    setTimeout(() => setToastMsg(null), 2500);
  };

  const edificio = cola[idx];
  const total    = cola.length;

  const solicitarAccion = (accion) => {
    if (!edificio || procesando) return;
    if (accion === 'colapsado') {
      setAccionPendiente('colapsado');
      setOverlayColapsado(true);
    } else {
      ejecutarAccion(accion, '', true);
    }
  };

  const ejecutarAccion = async (accion, notas = '', notificar = true) => {
    if (!edificio) return;
    setProcesando(true);
    setOverlayColapsado(false);

    const ahora = new Date().toISOString();
    const updateData = {
      triage_estado: accion === 'sin_informacion' ? 'sin_informacion' : 'clasificado',
      triage_por:    user?.email || 'admin',
      triage_fecha:  ahora,
    };

    if (accion === 'colapsado') {
      updateData.triage_riesgo                  = 'riesgo_colapso';
      updateData.nivel_dano                     = 'colapsado';
      updateData.estado_acceso                  = 'clausurado';
      updateData.riesgo_colapso                 = true;
      updateData.prioridad                      = 'critica';
      updateData.requiere_inspeccion_presencial = false;
      if (notas) updateData.triage_notas        = notas;
    } else if (accion === 'riesgo_colapso') {
      updateData.triage_riesgo  = 'riesgo_colapso';
      updateData.riesgo_colapso = true;
      updateData.estado_acceso  = 'solo_rescatistas';
      updateData.prioridad      = 'critica';
      if (!['critico', 'colapsado'].includes(edificio.nivel_dano)) updateData.nivel_dano = 'critico';
    } else if (accion === 'danos_visibles') {
      updateData.triage_riesgo = 'riesgo_moderado';
      updateData.estado_acceso = 'entrada_limitada';
      updateData.prioridad     = 'alta';
      if (!['grave', 'critico', 'colapsado'].includes(edificio.nivel_dano)) updateData.nivel_dano = 'grave';
    } else if (accion === 'sin_danos') {
      updateData.triage_riesgo = 'solo_estetico';
      updateData.estado_acceso = 'entrada_autorizada';
      updateData.prioridad     = 'normal';
      if (edificio.nivel_dano === 'no_evaluado' || !edificio.nivel_dano) updateData.nivel_dano = 'leve';
    } else if (accion === 'sin_informacion') {
      updateData.triage_riesgo = 'sin_clasificar';
      updateData.prioridad     = 'normal';
    }

    try {
      await base44.entities.ReportesDano.update(edificio.id, updateData);

      // Notificar suscriptores para todas las acciones relevantes
      if (notificar && accion !== 'sin_informacion') {
        const descripcionMap = {
          colapsado:       notas || 'Edificio marcado como COLAPSADO en triaje masivo.',
          riesgo_colapso:  'Edificio marcado con RIESGO DE COLAPSO. Acceso solo para rescatistas.',
          danos_visibles:  'Edificio marcado con daños estructurales visibles. Entrada limitada.',
          sin_danos:       'Edificio revisado: sin daños estructurales visibles.',
        };
        base44.functions.invoke('notificarActualizacionEdificio', {
          edificio_id:  edificio.id,
          tipo_accion:  'estado_cambiado',
          nivel_dano:   updateData.nivel_dano || edificio.nivel_dano,
          direccion:    edificio.direccion,
          nombre_lugar: edificio.nombre_lugar,
          descripcion:  descripcionMap[accion] || 'Estado actualizado en triaje masivo.',
          lang: 'es',
        }).catch(() => {});
      }

      setProcesados(prev => [...prev, { id: edificio.id, nombre: edificio.nombre_lugar || edificio.tipo_estructura, accion }]);
      setStats(prev => ({ ...prev, [accion]: (prev[accion] || 0) + 1 }));
      // Actualizar contadores globales en tiempo real
      setContadoresGlobales(prev => {
        const next = { ...prev, pendiente: Math.max(0, prev.pendiente - 1) };
        if (accion !== 'sin_informacion') next[accion] = (next[accion] || 0) + 1;
        else next.sin_informacion = (next.sin_informacion || 0) + 1;
        return next;
      });
      setIdx(prev => prev + 1);

      const labels = {
        colapsado:      '💥 Colapsado guardado',
        riesgo_colapso: '⚠️ Riesgo colapso guardado',
        danos_visibles: '🔴 Daños registrados',
        sin_danos:      '✅ Sin daños registrado',
        sin_informacion:'❓ Marcado sin información',
      };
      mostrarToast(labels[accion] || 'Guardado');
    } catch (e) {
      mostrarToast('Error al guardar: ' + e.message, 'error');
    }
    setProcesando(false);
    setAccionPendiente(null);
  };

  const terminado = idx >= total;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 300, padding: '10px 20px', borderRadius: 14, fontWeight: 700, fontSize: 13, background: toastMsg.tipo === 'error' ? '#fee2e2' : '#dcfce7', color: toastMsg.tipo === 'error' ? '#991b1b' : '#166534', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toastMsg.tipo === 'error' ? <AlertTriangle size={14} /> : <Check size={14} />}
          {toastMsg.msg}
        </div>
      )}

      {/* Overlay colapsado */}
      {overlayColapsado && edificio && (
        <OverlayColapsado
          edificio={edificio}
          onConfirmar={(notas, notif) => ejecutarAccion('colapsado', notas, notif)}
          onCancelar={() => { setOverlayColapsado(false); setAccionPendiente(null); }}
          guardando={procesando}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>🃏 Triaje masivo</h2>
        <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>Clasifica edificios uno a uno. Desliza la tarjeta o usa los botones. Las notificaciones se envían automáticamente.</p>
      </div>

      {/* Filtro fuente */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {[{ val: 'importacion_masiva', label: '🗃️ Base de datos' }, { val: 'web_publica', label: '👤 Ciudadano' }, { val: '', label: '🌐 Todos' }].map(f => (
          <button key={f.val} onClick={() => setFiltroFuente(f.val)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1.5px solid', borderColor: filtroFuente === f.val ? '#1D4ED8' : '#e5e7eb', background: filtroFuente === f.val ? '#1D4ED8' : '#f9fafb', color: filtroFuente === f.val ? '#fff' : '#374151' }}>{f.label}</button>
        ))}
        <button onClick={cargarCola} style={{ marginLeft: 'auto', background: 'transparent', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '5px 12px', cursor: 'pointer', color: '#6b7280', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} /> Recargar
        </button>
      </div>

      {/* Contadores globales en BD */}
      {!cargando && (
        <div style={{ marginBottom: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 9px', display: 'flex', alignItems: 'center', gap: 5 }}>
            📊 Estado en BD <span style={{ fontWeight: 400, color: '#94a3b8' }}>({contadoresGlobales.total} edificios cargados)</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 5 }}>
            {[
              { key: 'colapsado',      icon: '💥', label: 'Colapsados',  color: '#991b1b', bg: '#fee2e2' },
              { key: 'riesgo_colapso', icon: '⚠️', label: 'Riesgo col.', color: '#92400e', bg: '#fef3c7' },
              { key: 'danos_visibles', icon: '🔴', label: 'Con daños',   color: '#c2410c', bg: '#ffedd5' },
            ].map(s => (
              <div key={s.key} style={{ background: s.bg, borderRadius: 9, padding: '7px 4px', textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{contadoresGlobales[s.key]}</p>
                <p style={{ fontSize: 8, color: s.color, margin: 0, fontWeight: 600 }}>{s.icon} {s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
            {[
              { key: 'sin_danos',       icon: '✅', label: 'Sin daños',  color: '#166534', bg: '#dcfce7' },
              { key: 'sin_informacion', icon: '❓', label: 'Sin info',   color: '#5b21b6', bg: '#f5f3ff' },
              { key: 'pendiente',       icon: '⏳', label: 'Pendientes', color: '#374151', bg: '#f1f5f9' },
            ].map(s => (
              <div key={s.key} style={{ background: s.bg, borderRadius: 9, padding: '7px 4px', textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{contadoresGlobales[s.key]}</p>
                <p style={{ fontSize: 8, color: s.color, margin: 0, fontWeight: 600 }}>{s.icon} {s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats sesión actual */}
      {procesados.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 7px' }}>🕐 Esta sesión</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
            {[
              { key: 'colapsado',       icon: '💥', label: 'Colapsado',   color: '#991b1b', bg: '#fee2e2' },
              { key: 'riesgo_colapso',  icon: '⚠️', label: 'Riesgo',      color: '#92400e', bg: '#fef3c7' },
              { key: 'danos_visibles',  icon: '🔴', label: 'Con daños',   color: '#c2410c', bg: '#ffedd5' },
              { key: 'sin_danos',       icon: '✅', label: 'Sin daños',   color: '#166534', bg: '#dcfce7' },
              { key: 'sin_informacion', icon: '❓', label: 'Sin info',    color: '#5b21b6', bg: '#f5f3ff' },
            ].map(s => (
              <div key={s.key} style={{ background: s.bg, borderRadius: 9, padding: '6px 3px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: s.color, margin: 0 }}>{stats[s.key]}</p>
                <p style={{ fontSize: 7, color: s.color, margin: 0, fontWeight: 600 }}>{s.icon} {s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estados */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={28} style={{ color: '#9ca3af' }} className="animate-spin" />
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>Cargando todos los edificios...</p>
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0' }}>
          <p style={{ fontSize: 36, margin: '0 0 10px' }}>✅</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#15803d', margin: '0 0 4px' }}>¡Cola vacía!</p>
          <button onClick={cargarCola} style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Recargar</button>
        </div>
      ) : terminado ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 36, margin: '0 0 10px' }}>🎉</p>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1d4ed8', margin: '0 0 6px' }}>¡Lote completado!</p>
          <p style={{ fontSize: 12, color: '#2563eb', margin: '0 0 16px' }}>
            {procesados.length} procesados · {stats.colapsado} colapsados · {stats.riesgo_colapso} riesgo · {stats.danos_visibles} con daños · {stats.sin_danos} sin daños · {stats.sin_informacion} sin info
          </p>
          <button onClick={cargarCola} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>🔄 Siguiente lote</button>
        </div>
      ) : (
        <>
          {/* Progreso */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Edificio {idx + 1} de {total}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{total - idx} restantes</span>
            </div>
            <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(idx / total) * 100}%`, background: '#1d4ed8', borderRadius: 99, transition: 'width 200ms' }} />
            </div>
          </div>

          <TarjetaEdificio edificio={edificio} onAccion={solicitarAccion} procesando={procesando} />

          {/* Botones — fila 1: Colapsado + Riesgo Colapso */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <button onClick={() => solicitarAccion('colapsado')} disabled={procesando}
              style={{ background: procesando ? '#f3f4f6' : '#991b1b', color: procesando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 16, padding: '16px 10px', fontWeight: 800, fontSize: 13, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: procesando ? 'none' : '0 4px 16px rgba(153,27,27,0.4)' }}>
              {procesando && accionPendiente === 'colapsado' ? <Loader2 size={18} className="animate-spin" /> : <span style={{ fontSize: 22 }}>💥</span>}
              <span>COLAPSADO</span>
              <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.85 }}>Bloquea inspecciones</span>
            </button>

            <button onClick={() => solicitarAccion('riesgo_colapso')} disabled={procesando}
              style={{ background: procesando ? '#f3f4f6' : '#92400e', color: procesando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 16, padding: '16px 10px', fontWeight: 800, fontSize: 13, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: procesando ? 'none' : '0 4px 16px rgba(146,64,14,0.4)' }}>
              {procesando && accionPendiente === 'riesgo_colapso' ? <Loader2 size={18} className="animate-spin" /> : <span style={{ fontSize: 22 }}>⚠️</span>}
              <span>RIESGO COLAPSO</span>
              <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.85 }}>Solo rescatistas</span>
            </button>
          </div>

          {/* Fila 2: Daños + Sin daños */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <button onClick={() => solicitarAccion('danos_visibles')} disabled={procesando}
              style={{ background: procesando ? '#f3f4f6' : '#c2410c', color: procesando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, padding: '13px 10px', fontWeight: 700, fontSize: 13, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              🔴 Daños visibles
            </button>
            <button onClick={() => solicitarAccion('sin_danos')} disabled={procesando}
              style={{ background: procesando ? '#f3f4f6' : '#166534', color: procesando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, padding: '13px 10px', fontWeight: 700, fontSize: 13, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} /> Sin daños
            </button>
          </div>

          {/* Fila 3: Sin información (ancho completo) */}
          <button onClick={() => solicitarAccion('sin_informacion')} disabled={procesando}
            style={{ width: '100%', background: '#f5f3ff', color: '#5b21b6', border: '1.5px solid #ddd6fe', borderRadius: 14, padding: '11px 10px', fontWeight: 700, fontSize: 13, cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            ❓ No hay suficiente información
          </button>
        </>
      )}

      {/* Historial sesión */}
      {procesados.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setMostrarHistorial(v => !v)} style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>📋 Procesados esta sesión ({procesados.length})</span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>{mostrarHistorial ? '▲' : '▼'}</span>
          </button>
          {mostrarHistorial && (
            <div style={{ marginTop: 6, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              {procesados.map((p, i) => {
                const colorMap = { colapsado: ['#fee2e2','#991b1b'], riesgo_colapso: ['#fef3c7','#92400e'], danos_visibles: ['#ffedd5','#c2410c'], sin_danos: ['#dcfce7','#166534'], sin_informacion: ['#f5f3ff','#5b21b6'] };
                const [bg, clr] = colorMap[p.accion] || ['#f3f4f6','#6b7280'];
                const labelMap = { colapsado: '💥 Colapsado', riesgo_colapso: '⚠️ Riesgo', danos_visibles: '🔴 Con daños', sin_danos: '✅ Sin daños', sin_informacion: '❓ Sin info' };
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', fontSize: 11, background: i % 2 === 0 ? '#f9fafb' : '#fff', borderBottom: i < procesados.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <span style={{ color: '#374151', fontWeight: 500, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre || 'Sin nombre'}</span>
                    <span style={{ fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontSize: 10, background: bg, color: clr }}>{labelMap[p.accion]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}