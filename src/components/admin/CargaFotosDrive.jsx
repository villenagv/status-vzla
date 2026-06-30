import { useState, useEffect, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Eye, PauseCircle, PlayCircle, RefreshCw, FolderOpen, Link } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import * as XLSX from 'xlsx';

const FOTO_LIMITE = 5;
const EDIFICIOS_POR_LOTE = 5;   // lotes pequeños para evitar timeout 504
const STORAGE_KEY = 'cris_fotos_progreso';

// Extrae el folder_id de un link de Google Drive
function extraerFolderId(url) {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  // Si es solo el ID directo
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  return null;
}

function StatCard({ icon, label, val, color }) {
  return (
    <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: color || '#111827', margin: 0 }}>{val}</p>
      <p style={{ fontSize: 10, color: '#6b7280', margin: '4px 0 0' }}>{icon} {label}</p>
    </div>
  );
}

function LogRow({ item }) {
  return (
    <div style={{
      background: item.status === 'ok' ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${item.status === 'ok' ? '#bbf7d0' : '#fecaca'}`,
      borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.nombre_edificio || item.edificio_id}
        </p>
        <p style={{ fontSize: 9, color: '#6b7280', margin: '2px 0 0' }}>
          🏗️ {item.edificio_id?.slice(0, 12)}…
          {item.nuevas > 0 && <span style={{ color: '#2563eb' }}> · {item.nuevas} fotos</span>}
          {item.total_fotos > 0 && <span style={{ color: '#16a34a' }}> · {item.total_fotos} total</span>}
        </p>
        {item.status !== 'ok' && <p style={{ fontSize: 9, color: '#dc2626', margin: '2px 0 0' }}>{item.error}</p>}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        background: item.status === 'ok' ? '#dcfce7' : '#fee2e2',
        color: item.status === 'ok' ? '#15803d' : '#dc2626',
      }}>
        {item.status === 'ok' ? '✅ OK' : item.status === 'pendiente' ? '⏳' : '❌ Error'}
      </span>
    </div>
  );
}

export default function CargaFotosDrive() {
  const [modo, setModo] = useState('excel'); // 'excel' | 'drive'
  const [archivo, setArchivo] = useState(null);
  const [driveLink, setDriveLink] = useState('');
  const [driveArchivos, setDriveArchivos] = useState([]);
  const [driveCargando, setDriveCargando] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [fotosData, setFotosData] = useState(null);
  const [estado, setEstado] = useState('idle');
  const [progreso, setProgreso] = useState(0);
  const [progresoDetalle, setProgresoDetalle] = useState('');
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [pausado, setPausado] = useState(false);
  const [logExpandido, setLogExpandido] = useState(false);
  const [fotosSubidas, setFotosSubidas] = useState([]);
  const pausaRef = useRef(false);
  const activoRef = useRef(false);

  const leerCarpetaDrive = async () => {
    const folderId = extraerFolderId(driveLink);
    if (!folderId) { setDriveError('No se pudo extraer el ID de la carpeta. Pega el link completo de Drive.'); return; }
    setDriveCargando(true);
    setDriveError('');
    setDriveArchivos([]);
    try {
      const resp = await base44.functions.invoke('leerCarpetaDrive', { folder_id: folderId });
      if (resp.data?.error) throw new Error(resp.data.error);
      const archivos = resp.data?.archivos || [];
      setDriveArchivos(archivos);
      if (archivos.length === 0) setDriveError('No se encontraron imágenes en esa carpeta. Verifica que la carpeta tenga imágenes y esté compartida.');
    } catch (e) {
      setDriveError(e.message || 'Error al leer la carpeta');
    }
    setDriveCargando(false);
  };

  // Restaurar progreso al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.fotosData && data.fotosSubidas?.length > 0 && data.totalLotes > data.loteActual) {
          setFotosData(data.fotosData);
          setFotosSubidas(data.fotosSubidas || []);
          setResultados(data.resultados || []);
          setEstado('pausado_reanudable');
          setProgreso(Math.round((data.loteActual / data.totalLotes) * 100));
        }
      }
    } catch {}
  }, []);

  const guardarProgreso = (loteActual, totalLotes) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fotosData, fotosSubidas, resultados,
        loteActual, totalLotes, timestamp: Date.now(),
      }));
    } catch {}
  };

  const limpiarProgreso = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const reset = () => {
    setArchivo(null); setFotosData(null); setEstado('idle');
    setProgreso(0); setResultados([]); setResumen(null); setErrMsg('');
    setFotosSubidas([]); setPausado(false); pausaRef.current = false; activoRef.current = false;
    limpiarProgreso();
  };

  // ── PASO 1: Parsear Excel ──
  const analizarExcel = async () => {
    if (!archivo) return;
    setEstado('analizando'); setErrMsg('');
    try {
      const buffer = await archivo.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const edificios = {};
      for (const row of rows) {
        const eid = row.edificio_id;
        if (!eid) continue;
        if (!edificios[eid]) {
          edificios[eid] = { nombre: row.nombre_edificio || '', ciudad: row.ciudad || '', damage_level: row.damage_level || '', fotos: [] };
        }
        if (row.url_original) {
          edificios[eid].fotos.push({ url: row.url_original, tipo: (row.tipo_foto || 'MEDIA').toUpperCase(), archivo: row.nombre_archivo || '' });
        }
      }

      let totalFotos = 0;
      let edificiosConMain = 0;
      for (const eid of Object.keys(edificios)) {
        const fotos = edificios[eid].fotos;
        totalFotos += fotos.length;
        if (fotos.some(f => f.tipo === 'MAIN')) edificiosConMain++;
      }

      setFotosData({ edificios, totalEdificios: Object.keys(edificios).length, totalFotos, edificiosConMain });
      setEstado('preview');
    } catch (e) {
      setErrMsg(e.message || 'Error al leer el archivo');
      setEstado('error');
    }
  };

  // ── PASO 2: Procesar por lotes ──
  const procesarLotes = async () => {
    if (!fotosData) return;
    setEstado('procesando');
    setProgreso(0);
    setPausado(false);
    pausaRef.current = false;
    activoRef.current = true;

    const edificios = fotosData.edificios;
    const eids = Object.keys(edificios);

    // Preparar todas las URLs ordenadas (MAIN primero, máx 5 por edificio)
    const todasLasUrls = [];
    for (const eid of eids) {
      const info = edificios[eid];
      const ordenadas = [...info.fotos].sort((a, b) => {
        if (a.tipo === 'MAIN' && b.tipo !== 'MAIN') return -1;
        if (a.tipo !== 'MAIN' && b.tipo === 'MAIN') return 1;
        return 0;
      });
      for (const f of ordenadas.slice(0, FOTO_LIMITE)) {
        todasLasUrls.push({ edificio_id: eid, url_original: f.url, tipo_foto: f.tipo });
      }
    }

    // Dividir en lotes de EDIFICIOS_POR_LOTE (las fotos de esos edificios)
    const lotes = [];
    for (let i = 0; i < eids.length; i += EDIFICIOS_POR_LOTE) {
      const loteEids = eids.slice(i, i + EDIFICIOS_POR_LOTE);
      const loteUrls = todasLasUrls.filter(u => loteEids.includes(u.edificio_id));
      lotes.push({ eids: loteEids, urls: loteUrls });
    }

    const totalLotes = lotes.length;
    const todasSubidas = [...fotosSubidas];
    const todosResultados = [...resultados];
    let loteActual = 0;

    for (const lote of lotes) {
      if (!activoRef.current) break;
      while (pausaRef.current && activoRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (!activoRef.current) break;

      loteActual++;

      if (lote.urls.length === 0) {
        setProgreso(Math.round((loteActual / totalLotes) * 100));
        setProgresoDetalle(`Lote ${loteActual}/${totalLotes}: sin fotos nuevas (${lote.eids.length} edificios)`);
        continue;
      }

      setProgresoDetalle(`Lote ${loteActual}/${totalLotes}: ${lote.urls.length} fotos, ${lote.eids.length} edificios...`);

      try {
        const resp = await base44.functions.invoke('optimizarFotosEdificios', {
          action: 'procesar_lote',
          lote_urls: lote.urls,
          actualizar: false,
        });
        const data = resp.data || resp;

        const nuevasSubidas = (data.resultados || []).filter(r => r.status === 'ok').map(r => ({
          edificio_id: r.edificio_id, nueva_url: r.nueva_url, tipo_foto: r.tipo_foto,
        }));
        todasSubidas.push(...nuevasSubidas);
        setFotosSubidas([...todasSubidas]);

        // Resultados parciales
        for (const eid of lote.eids) {
          const info = edificios[eid];
          const loteRes = (data.resultados || []).filter(r => r.edificio_id === eid);
          const ok = loteRes.filter(r => r.status === 'ok').length;
          const err = loteRes.filter(r => r.status === 'error').length;
          todosResultados.push({
            edificio_id: eid,
            nombre_edificio: info.nombre,
            ciudad: info.ciudad,
            status: ok > 0 ? (err === 0 ? 'ok' : 'parcial') : 'error',
            nuevas: ok,
            total_fotos: 0, // se sabrá al final
            error: loteRes.find(r => r.status === 'error')?.error,
          });
        }
        setResultados([...todosResultados]);
        setProgreso(Math.round((loteActual / totalLotes) * 100));
        guardarProgreso(loteActual, totalLotes);

        // Pequeña pausa entre lotes para no saturar
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        setErrMsg(`Error en lote ${loteActual}: ${e.message}`);
        guardarProgreso(loteActual - 1, totalLotes);
        setEstado('error_pausa');
        return;
      }
    }

    if (!activoRef.current) { setEstado('cancelado'); return; }

    // ── PASO 3: Actualizar BD masivamente ──────────────────────────
    if (todasSubidas.length > 0) {
      setProgresoDetalle('Actualizando edificios en la base de datos...');

      // Dividir la actualización en chunks de 100 edificios
      const subidasPorEdificio = {};
      for (const s of todasSubidas) {
        if (!subidasPorEdificio[s.edificio_id]) subidasPorEdificio[s.edificio_id] = [];
        subidasPorEdificio[s.edificio_id].push(s.nueva_url);
      }
      const eidsActualizar = Object.keys(subidasPorEdificio);

      for (let i = 0; i < eidsActualizar.length; i += 100) {
        const chunkEids = eidsActualizar.slice(i, i + 100);
        const fotosChunk = [];
        for (const eid of chunkEids) {
          for (const url of subidasPorEdificio[eid]) {
            fotosChunk.push({ edificio_id: eid, nueva_url: url });
          }
        }
        try {
          await base44.functions.invoke('optimizarFotosEdificios', {
            action: 'actualizar_masivo',
            fotos_subidas: fotosChunk,
          });
        } catch (e) {
          setErrMsg(`Error al actualizar lote ${Math.floor(i / 100) + 1} de edificios: ${e.message}. Algunas fotos se subieron pero no se vincularon.`);
        }
      }
    }

    setProgreso(100);
    setProgresoDetalle('');

    // Consolidar resultados finales
    const finalMap = {};
    for (const r of todosResultados) {
      if (!finalMap[r.edificio_id]) finalMap[r.edificio_id] = r;
    }
    const finalResultados = Object.values(finalMap);
    const ok = finalResultados.filter(r => r.status === 'ok').length;
    const parcial = finalResultados.filter(r => r.status === 'parcial').length;
    const errs = finalResultados.filter(r => r.status === 'error').length;
    setResultados(finalResultados);
    setResumen({ ok, parcial, errors: errs, total: eids.length });
    setEstado('listo');
    limpiarProgreso();
  };

  const togglePausa = () => {
    setPausado(v => !v);
    pausaRef.current = !pausaRef.current;
  };

  const cancelar = () => {
    activoRef.current = false;
    setPausado(false);
    pausaRef.current = false;
    limpiarProgreso();
  };

  const reanudar = () => {
    setEstado('procesando');
    setPausado(false);
    pausaRef.current = false;
    activoRef.current = true;
    procesarLotes();
  };

  // Render
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileSpreadsheet size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>🖼️ Carga masiva de fotos</h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.5 }}>
            Procesa en lotes de {EDIFICIOS_POR_LOTE} edificios. Pausa y reanuda cuando quieras. Las fotos duplicadas se omiten automáticamente.
          </p>
        </div>
      </div>

      {/* Selector de modo */}
      <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
        {[
          { k: 'excel', icon: <FileSpreadsheet size={14} />, label: 'Excel con índice' },
          { k: 'drive', icon: <FolderOpen size={14} />, label: '📁 Link de carpeta Drive' },
        ].map(m => (
          <button key={m.k} onClick={() => setModo(m.k)}
            style={{ flex: 1, border: 'none', cursor: 'pointer', padding: '11px 0', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: modo === m.k ? '#1D4ED8' : 'transparent',
              color: modo === m.k ? '#fff' : '#6b7280',
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* ── MODO DRIVE: pegar link de carpeta ── */}
      {modo === 'drive' && estado === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 11, color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
              <strong>📁 Cómo usar:</strong><br />
              1. Ve a Google Drive y abre la carpeta con las fotos de los edificios.<br />
              2. Copia el link de la carpeta (el URL del navegador).<br />
              3. Pégalo aquí — el sistema listará las imágenes disponibles.<br />
              <strong>⚠️ La carpeta debe estar compartida</strong> con la cuenta de Drive conectada en la plataforma.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Link de carpeta de Google Drive <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="url"
              value={driveLink}
              onChange={e => { setDriveLink(e.target.value); setDriveError(''); setDriveArchivos([]); }}
              placeholder="https://drive.google.com/drive/folders/1ABCxyz..."
              style={{ width: '100%', background: '#fff', border: `1.5px solid ${driveLink ? '#16a34a' : '#d1d5db'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#111827', boxSizing: 'border-box', outline: 'none' }}
            />
            {driveLink && extraerFolderId(driveLink) && (
              <p style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>✅ ID detectado: {extraerFolderId(driveLink)}</p>
            )}
            {driveLink && !extraerFolderId(driveLink) && (
              <p style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>⚠️ No se reconoce como link de carpeta Drive</p>
            )}
          </div>

          {driveError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>⚠️ {driveError}</p>
            </div>
          )}

          <button onClick={leerCarpetaDrive} disabled={!driveLink || driveCargando || !extraerFolderId(driveLink)}
            style={{ background: driveLink && extraerFolderId(driveLink) ? '#1D4ED8' : '#e5e7eb', color: driveLink && extraerFolderId(driveLink) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {driveCargando ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
            {driveCargando ? 'Leyendo carpeta...' : 'Leer fotos de la carpeta'}
          </button>

          {/* Lista de archivos encontrados */}
          {driveArchivos.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: '0 0 10px' }}>
                📸 {driveArchivos.length} imágenes encontradas en la carpeta
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {driveArchivos.slice(0, 30).map((f, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '5px 9px', fontSize: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
                    🖼️ {f.nombre.length > 25 ? f.nombre.slice(0, 22) + '…' : f.nombre}
                  </div>
                ))}
                {driveArchivos.length > 30 && (
                  <div style={{ fontSize: 10, color: '#6b7280', padding: '5px 9px' }}>+{driveArchivos.length - 30} más...</div>
                )}
              </div>
              <p style={{ fontSize: 11, color: '#15803d', margin: '10px 0 0', lineHeight: 1.5 }}>
                ⚠️ Para asociar estas fotos a edificios necesitas un Excel con columnas <strong>edificio_id</strong> y <strong>nombre_archivo</strong>. Cambia al modo <strong>"Excel con índice"</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones modo Excel */}
      {modo === 'excel' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
            <strong>📋 Formato Excel:</strong> columnas <em>edificio_id, url_original, tipo_foto (MAIN/MEDIA)</em><br />
            <strong>⚡ Procesamiento por lotes:</strong> {EDIFICIOS_POR_LOTE} edificios por llamada — rápido y sin timeout.<br />
            <strong>⏸️ Reanudable:</strong> si cierras la ventana, puedes continuar desde donde quedó.<br />
            <strong>🔁 Anti-duplicados:</strong> fotos ya existentes se omiten automáticamente.<br />
            <strong>Límite:</strong> {FOTO_LIMITE} fotos por edificio (priorizando MAIN).
          </p>
        </div>
      )}

      {/* IDLE / ERROR — solo si modo Excel */}
      {modo === 'excel' && (estado === 'idle' || estado === 'error') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              📄 Excel con índice de fotos <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => { setArchivo(e.target.files[0] || null); setErrMsg(''); setEstado('idle'); }}
              style={{ width: '100%', background: '#fff', border: `1.5px solid ${archivo ? '#16a34a' : '#d1d5db'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#111827', cursor: 'pointer', boxSizing: 'border-box' }} />
            {archivo && <p style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}>✅ {archivo.name} · {(archivo.size / 1024).toFixed(0)} KB</p>}
          </div>
          {errMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>⚠️ {errMsg}</p>
            </div>
          )}
          <button onClick={analizarExcel} disabled={!archivo}
            style={{ background: archivo ? '#1D4ED8' : '#e5e7eb', color: archivo ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: archivo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Eye size={16} /> Analizar archivo de fotos
          </button>
        </div>
      )}

      {/* ANALIZANDO */}
      {estado === 'analizando' && (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={28} color="#1D4ED8" className="animate-spin" />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Analizando archivo Excel…</p>
        </div>
      )}

      {/* PREVIEW */}
      {estado === 'preview' && fotosData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatCard icon="🏗️" label="Edificios" val={fotosData.totalEdificios} />
            <StatCard icon="🖼️" label="Fotos totales" val={fotosData.totalFotos} color="#1D4ED8" />
            <StatCard icon="📸" label="Con foto principal" val={fotosData.edificiosConMain} color="#d97706" />
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 12, color: '#15803d', margin: 0, lineHeight: 1.5 }}>
              ✅ <strong>{fotosData.totalEdificios}</strong> edificios, <strong>{fotosData.totalFotos}</strong> fotos detectadas.<br />
              Se procesará en <strong>{Math.ceil(fotosData.totalEdificios / EDIFICIOS_POR_LOTE)} lotes</strong> de {EDIFICIOS_POR_LOTE} edificios. Puedes pausar y reanudar en cualquier momento.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={procesarLotes}
              style={{ flex: 2, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Upload size={16} /> Iniciar carga masiva
            </button>
          </div>
        </div>
      )}

      {/* PAUSADO_REANUDABLE */}
      {estado === 'pausado_reanudable' && fotosData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <RefreshCw size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#92400e', margin: 0 }}>⏸️ Progreso guardado</p>
              <p style={{ fontSize: 12, color: '#78350f', margin: '4px 0 0' }}>
                {fotosSubidas.length} fotos ya subidas de {fotosData.totalFotos}. Progreso: {progreso}%.<br />
                Puedes reanudar desde donde quedó o empezar de nuevo.
              </p>
            </div>
          </div>
          <div style={{ height: 10, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progreso}%`, background: '#1D4ED8', borderRadius: 99, transition: 'width 300ms' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
              Empezar de nuevo
            </button>
            <button onClick={reanudar}
              style={{ flex: 2, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <PlayCircle size={16} /> Reanudar ({progreso}%)
            </button>
          </div>
        </div>
      )}

      {/* ERROR_PAUSA */}
      {estado === 'error_pausa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', margin: 0 }}>⚠️ Error en el lote — puedes reintentar</p>
            <p style={{ fontSize: 12, color: '#b91c1c', margin: '4px 0 0' }}>{errMsg}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '6px 0 0' }}>
              {fotosSubidas.length} fotos ya subidas. El progreso se guardó — al reintentar continúa desde el lote fallido.
            </p>
          </div>
          {progreso > 0 && (
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso}%`, background: '#dc2626', borderRadius: 99 }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
              Empezar de nuevo
            </button>
            <button onClick={reanudar}
              style={{ flex: 2, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={16} /> Reintentar
            </button>
          </div>
        </div>
      )}

      {/* PROCESANDO */}
      {estado === 'procesando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
              {pausado ? '⏸️ Pausado' : '⚙️ Procesando...'}
            </p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{progresoDetalle}</p>
          </div>
          <div style={{ height: 12, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progreso}%`, background: pausado ? '#d97706' : '#1D4ED8', borderRadius: 99, transition: 'width 300ms' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>
            {progreso}% — {fotosSubidas.length} fotos subidas
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={cancelar}
              style={{ flex: 1, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={togglePausa}
              style={{ flex: 1, background: pausado ? '#1D4ED8' : '#fffbeb', border: `1px solid ${pausado ? '#3b82f6' : '#fde68a'}`, borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: pausado ? '#fff' : '#92400e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {pausado ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
              {pausado ? 'Reanudar' : 'Pausar'}
            </button>
          </div>
        </div>
      )}

      {/* CANCELADO */}
      {estado === 'cancelado' && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>⏹️ Proceso cancelado</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 10px' }}>{fotosSubidas.length} fotos subidas no se vincularon a edificios.</p>
          <button onClick={reset} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: '#374151', cursor: 'pointer', width: '100%' }}>
            Iniciar nuevo proceso
          </button>
        </div>
      )}

      {/* LISTO */}
      {estado === 'listo' && resumen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatCard icon="✅" label="Completos" val={resumen.ok} color="#16a34a" />
            <StatCard icon="⚠️" label="Parciales" val={resumen.parcial} color="#d97706" />
            <StatCard icon="❌" label="Errores" val={resumen.errors} color="#dc2626" />
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#15803d', margin: 0 }}>✅ Carga completada</p>
              <p style={{ fontSize: 12, color: '#166534', margin: '4px 0 0' }}>
                {resumen.ok} edificios completos, {resumen.parcial} parciales, {resumen.errors} con errores. Total: {resumen.total} edificios — {fotosSubidas.length} fotos subidas.
              </p>
              {errMsg && <p style={{ fontSize: 11, color: '#dc2626', margin: '6px 0 0' }}>⚠️ {errMsg}</p>}
            </div>
          </div>

          {resultados.length > 0 && (
            <div>
              <button onClick={() => setLogExpandido(v => !v)}
                style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  📋 Ver detalle por edificio ({resultados.length})
                </span>
                <span style={{ color: '#9ca3af', fontSize: 11 }}>{logExpandido ? '▲' : '▼'}</span>
              </button>
              {logExpandido && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto' }}>
                  {resultados.map((r, i) => <LogRow key={i} item={r} />)}
                </div>
              )}
            </div>
          )}

          <button onClick={reset} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            Procesar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}