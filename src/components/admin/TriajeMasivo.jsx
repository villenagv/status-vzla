import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle, XCircle, SkipForward, RefreshCw, Building2, MapPin, Clock, AlertTriangle } from 'lucide-react';

const FUENTE_LABELS = {
  importacion_masiva: 'Importación masiva',
  importacion_vzla:   'Base de datos VZ',
  web_publica:        'Reporte ciudadano',
  institucional:      'Institucional',
  ciudadano:          'Ciudadano',
};

function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `hace ${d} día${d > 1 ? 's' : ''}`;
  if (h > 0) return `hace ${h} hora${h > 1 ? 's' : ''}`;
  if (m < 1) return 'ahora mismo';
  return `hace ${m} min`;
}

const NIVEL_DANO_LABELS = {
  leve:        { label: 'Daño leve',    color: '#B7950B', bg: '#FEF9E7' },
  moderado:    { label: 'Daño moderado',color: '#CA6F1E', bg: '#FEF5E7' },
  grave:       { label: 'Daño grave',   color: '#C0392B', bg: '#FDEDEC' },
  critico:     { label: 'CRÍTICO',      color: '#922B21', bg: '#FDEDEC' },
  colapsado:   { label: 'COLAPSADO',    color: '#4A0E0E', bg: '#FCECEC' },
  no_evaluado: { label: 'Sin evaluar',  color: '#7F8C8D', bg: '#F2F3F4' },
};

export default function TriajeMasivo() {
  const [cola, setCola] = useState([]);
  const [idx, setIdx] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [procesados, setProcesados] = useState([]);  // { id, nombre, accion }
  const [stats, setStats] = useState({ colapsado: 0, danos_visibles: 0, sin_danos: 0, saltado: 0 });
  const [filtroFuente, setFiltroFuente] = useState('importacion_masiva');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const cargarCola = useCallback(async () => {
    setCargando(true);
    setProcesados([]);
    setIdx(0);
    setStats({ colapsado: 0, danos_visibles: 0, sin_danos: 0, saltado: 0 });
    try {
      // Edificios sin inspección completada, ordenados por prioridad
      const todos = await base44.entities.ReportesDano.filter(
        { triage_estado: 'pendiente_triage' },
        '-created_date',
        200
      );
      // Filtrar por fuente si hay filtro activo
      const filtrados = filtroFuente
        ? (todos || []).filter(e => e.fuente === filtroFuente || (!e.fuente && filtroFuente === 'importacion_masiva'))
        : (todos || []);
      setCola(filtrados);
    } catch {}
    setCargando(false);
  }, [filtroFuente]);

  useEffect(() => { cargarCola(); }, [cargarCola]);

  const edificio = cola[idx];
  const total = cola.length;
  const restantes = total - procesados.length;

  const procesar = async (accion) => {
    if (!edificio || procesando) return;
    setProcesando(true);

    const updateData = {
      triage_estado: 'clasificado',
      triage_por: user?.email || 'admin',
      triage_fecha: new Date().toISOString(),
    };

    if (accion === 'colapsado') {
      updateData.triage_riesgo = 'riesgo_colapso';
      updateData.nivel_dano = 'colapsado';
      updateData.estado_acceso = 'clausurado';
      updateData.riesgo_colapso = true;
      updateData.prioridad = 'critica';
    } else if (accion === 'danos_visibles') {
      updateData.triage_riesgo = 'riesgo_moderado';
      updateData.nivel_dano = updateData.nivel_dano || edificio.nivel_dano || 'grave';
      updateData.estado_acceso = 'entrada_limitada';
      updateData.prioridad = 'alta';
    } else if (accion === 'sin_danos') {
      updateData.triage_riesgo = 'solo_estetico';
      updateData.estado_acceso = 'entrada_autorizada';
      updateData.prioridad = 'normal';
    }

    try {
      await base44.entities.ReportesDano.update(edificio.id, updateData);
      setProcesados(prev => [...prev, { id: edificio.id, nombre: edificio.nombre_lugar || edificio.tipo_estructura, accion }]);
      setStats(prev => ({ ...prev, [accion]: (prev[accion] || 0) + 1 }));
      setIdx(prev => prev + 1);
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    }
    setProcesando(false);
  };

  const saltar = () => {
    setStats(prev => ({ ...prev, saltado: prev.saltado + 1 }));
    setIdx(prev => prev + 1);
  };

  const terminado = idx >= total;

  const cfg = edificio ? (NIVEL_DANO_LABELS[edificio.nivel_dano] || NIVEL_DANO_LABELS.no_evaluado) : null;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
          🃏 Triaje masivo de edificios
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
          Clasifica edificios uno a uno como colapsado, con daños o sin daños. Cada respuesta se guarda inmediatamente. Solo accesible para administradores.
        </p>
      </div>

      {/* Filtro fuente */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { val: 'importacion_masiva', label: '🗃️ Base de datos' },
          { val: 'web_publica',        label: '👤 Ciudadano'     },
          { val: '',                   label: '🌐 Todos'         },
        ].map(f => (
          <button key={f.val} onClick={() => setFiltroFuente(f.val)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: '1.5px solid',
              borderColor: filtroFuente === f.val ? '#1D4ED8' : '#e5e7eb',
              background: filtroFuente === f.val ? '#1D4ED8' : '#f9fafb',
              color: filtroFuente === f.val ? '#fff' : '#374151',
            }}>
            {f.label}
          </button>
        ))}
        <button onClick={cargarCola} style={{ marginLeft: 'auto', background: 'transparent', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', color: '#6b7280', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={12} /> Recargar
        </button>
      </div>

      {/* Stats barra */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'colapsado',     icon: '💥', label: 'Colapsado',  color: '#991b1b', bg: '#fee2e2' },
          { key: 'danos_visibles',icon: '🔴', label: 'Con daños',  color: '#c2410c', bg: '#ffedd5' },
          { key: 'sin_danos',     icon: '✅', label: 'Sin daños',  color: '#166534', bg: '#dcfce7' },
          { key: 'saltado',       icon: '⏭️', label: 'Saltados',   color: '#6b7280', bg: '#f3f4f6' },
        ].map(s => (
          <div key={s.key} style={{ background: s.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{stats[s.key]}</p>
            <p style={{ fontSize: 9, color: s.color, margin: 0, fontWeight: 600 }}>{s.icon} {s.label}</p>
          </div>
        ))}
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={28} style={{ color: '#9ca3af', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>Cargando cola de edificios...</p>
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0' }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>✅</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d', margin: '0 0 6px' }}>¡Cola vacía!</p>
          <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>No hay edificios pendientes de triaje con este filtro.</p>
          <button onClick={cargarCola} style={{ marginTop: 16, background: '#15803d', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Recargar
          </button>
        </div>
      ) : terminado ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>🎉</p>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1d4ed8', margin: '0 0 6px' }}>¡Lote completado!</p>
          <p style={{ fontSize: 12, color: '#2563eb', margin: '0 0 16px' }}>
            Procesaste {procesados.length} edificios · {stats.colapsado} colapsados · {stats.danos_visibles} con daños · {stats.sin_danos} sin daños · {stats.saltado} saltados.
          </p>
          <button onClick={cargarCola} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            🔄 Siguiente lote
          </button>
        </div>
      ) : (
        <>
          {/* Progreso */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Edificio {idx + 1} de {total}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{restantes} restantes</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(idx / total) * 100}%`, background: '#1d4ed8', borderRadius: 99, transition: 'width 200ms' }} />
            </div>
          </div>

          {/* Tarjeta del edificio */}
          <div style={{
            background: '#fff', borderRadius: 20, border: `2px solid ${cfg?.color || '#e5e7eb'}`,
            overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {/* Foto si existe */}
            {edificio.foto_urls?.[0] && (
              <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={edificio.foto_urls[0]}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 700 }}>
                  {(edificio.foto_urls || []).length} foto{edificio.foto_urls?.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Sin foto placeholder */}
            {!edificio.foto_urls?.[0] && (
              <div style={{ height: 100, background: cfg?.bg || '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={40} style={{ color: cfg?.color || '#9ca3af' }} />
              </div>
            )}

            <div style={{ padding: '16px 18px' }}>
              {/* Nombre y tipo */}
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 2px', lineHeight: 1.3 }}>
                  {edificio.nombre_lugar || edificio.tipo_estructura?.replace(/_/g, ' ') || 'Edificio sin nombre'}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                  {edificio.tipo_estructura?.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Ubicación */}
              {(edificio.direccion || edificio.ciudad) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 8 }}>
                  <MapPin size={12} style={{ color: '#9ca3af', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                    {[edificio.direccion, edificio.ciudad, edificio.estado_region].filter(Boolean).join(' · ')}
                  </p>
                </div>
              )}

              {/* Estado actual */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: cfg?.bg, color: cfg?.color, border: `1px solid ${cfg?.color}33` }}>
                  {cfg?.label}
                </span>
                {/* Badge origen de datos */}
                {edificio.fuente && edificio.fuente !== 'web_publica' && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    🗃️ {FUENTE_LABELS[edificio.fuente] || edificio.fuente}
                  </span>
                )}
                {edificio.triage_estado === 'pendiente_triage' && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                    ⏳ Pendiente triaje
                  </span>
                )}
              </div>

              {/* Descripción breve */}
              {edificio.descripcion && (
                <p style={{ fontSize: 11, color: '#374151', margin: '0 0 10px', lineHeight: 1.5, background: '#f9fafb', borderRadius: 8, padding: '8px 10px', border: '1px solid #e5e7eb' }}>
                  "{edificio.descripcion.slice(0, 180)}{edificio.descripcion.length > 180 ? '...' : ''}"
                </p>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#9ca3af' }}>
                <Clock size={10} />
                <span>Creado {tiempoRelativo(edificio.created_date)}</span>
                {edificio.reportante_nombre && <span>· Por {edificio.reportante_nombre}</span>}
              </div>

              {/* Advertencia si riesgos */}
              {(edificio.personas_atrapadas === 'si' || edificio.personas_atrapadas === 'voces') && (
                <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', margin: 0 }}>
                    🆘 Personas atrapadas reportadas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {/* SÍ: Colapsado */}
            <button
              onClick={() => procesar('colapsado')}
              disabled={procesando}
              style={{
                background: procesando ? '#f3f4f6' : '#991b1b',
                color: procesando ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 16, padding: '18px 10px',
                fontWeight: 800, fontSize: 15, cursor: procesando ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 150ms', boxShadow: procesando ? 'none' : '0 4px 14px rgba(153,27,27,0.4)',
              }}
            >
              {procesando ? <Loader2 size={20} className="animate-spin" /> : <span style={{ fontSize: 28 }}>💥</span>}
              <span>COLAPSADO</span>
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>Clausurar + Peligro crítico</span>
            </button>

            {/* Daños visibles */}
            <button
              onClick={() => procesar('danos_visibles')}
              disabled={procesando}
              style={{
                background: procesando ? '#f3f4f6' : '#c2410c',
                color: procesando ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 16, padding: '18px 10px',
                fontWeight: 800, fontSize: 15, cursor: procesando ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 150ms', boxShadow: procesando ? 'none' : '0 4px 14px rgba(194,65,12,0.35)',
              }}
            >
              {procesando ? <Loader2 size={20} className="animate-spin" /> : <span style={{ fontSize: 28 }}>🔴</span>}
              <span>DAÑOS VISIBLES</span>
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>Entrada limitada</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Sin daños */}
            <button
              onClick={() => procesar('sin_danos')}
              disabled={procesando}
              style={{
                background: procesando ? '#f3f4f6' : '#166534',
                color: procesando ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 16, padding: '14px 10px',
                fontWeight: 700, fontSize: 13, cursor: procesando ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 150ms',
              }}
            >
              <CheckCircle size={16} /> Sin daños visibles
            </button>

            {/* Saltar */}
            <button
              onClick={saltar}
              disabled={procesando}
              style={{
                background: '#f3f4f6', color: '#6b7280',
                border: '1.5px solid #e5e7eb', borderRadius: 16, padding: '14px 10px',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <SkipForward size={16} /> Saltar este
            </button>
          </div>

          {/* Ver edificio completo */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <a
              href={`/edificio?id=${edificio.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: '#6b7280', textDecoration: 'underline' }}
            >
              Ver ficha completa →
            </a>
          </div>
        </>
      )}

      {/* Historial de lo procesado en esta sesión */}
      {procesados.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setMostrarHistorial(v => !v)}
            style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>📋 Procesados esta sesión ({procesados.length})</span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>{mostrarHistorial ? '▲' : '▼'}</span>
          </button>
          {mostrarHistorial && (
            <div style={{ marginTop: 6, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              {procesados.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 14px', fontSize: 11,
                  background: i % 2 === 0 ? '#f9fafb' : '#fff',
                  borderBottom: i < procesados.length - 1 ? '1px solid #e5e7eb' : 'none',
                }}>
                  <span style={{ color: '#374151', fontWeight: 500, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre || 'Sin nombre'}
                  </span>
                  <span style={{
                    fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontSize: 10,
                    background: p.accion === 'colapsado' ? '#fee2e2' : p.accion === 'danos_visibles' ? '#ffedd5' : '#dcfce7',
                    color: p.accion === 'colapsado' ? '#991b1b' : p.accion === 'danos_visibles' ? '#c2410c' : '#166534',
                  }}>
                    {p.accion === 'colapsado' ? '💥 Colapsado' : p.accion === 'danos_visibles' ? '🔴 Con daños' : '✅ Sin daños'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}