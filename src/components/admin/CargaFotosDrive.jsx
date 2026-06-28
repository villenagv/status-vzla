import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Eye, XCircle, Download, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import * as XLSX from 'xlsx';

const BATCH_SIZE = 5;
const FOTO_LIMITE = 5;

function norm(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function StatCard({ icon, label, val, color }) {
  return (
    <div style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: color || '#fff', margin: 0 }}>{val}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>{icon} {label}</p>
    </div>
  );
}

function LogRow({ item }) {
  const fotoLimite = item.nuevas_fotos > FOTO_LIMITE;
  return (
    <div style={{
      background: item.status === 'ok' ? 'rgba(21,128,61,0.08)' : 'rgba(185,28,28,0.10)',
      border: `1px solid ${item.status === 'ok' ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.25)'}`,
      borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.nombre_edificio || item.edificio_id}
        </p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', margin: '2px 0 0' }}>
          🏗️ {item.edificio_id?.slice(0, 12)}… · {item.fotos_procesadas}/{item.total_fotos_edificio} fotos
          {fotoLimite && <span style={{ color: '#FCD34D' }}> · max {FOTO_LIMITE}</span>}
          {item.fotos_existentes > 0 && <span style={{ color: '#93C5FD' }}> · {item.fotos_existentes} previas</span>}
        </p>
        {item.status === 'error' && (
          <p style={{ fontSize: 9, color: '#FCA5A5', margin: '2px 0 0' }}>{item.error}</p>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
        background: item.status === 'ok' ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)',
        color: item.status === 'ok' ? '#86EFAC' : '#FCA5A5',
      }}>
        {item.status === 'ok' ? '✅ OK' : '❌ Error'}
      </span>
    </div>
  );
}

export default function CargaFotosDrive() {
  const [archivo, setArchivo] = useState(null);
  const [fotosData, setFotosData] = useState(null); // { edificios: {eid: {nombre, ciudad, fotos:[...]}}, totalEdificios, totalFotos }
  const [estado, setEstado] = useState('idle'); // idle | analizando | preview | procesando | pausado | listo | error
  const [progreso, setProgreso] = useState({ loteActual: 0, totalLotes: 0, procesados: 0, total: 0 });
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [logExpandido, setLogExpandido] = useState(false);
  const pausadoRef = useRef(false);

  const reset = () => {
    setArchivo(null); setFotosData(null); setEstado('idle');
    setProgreso({ loteActual: 0, totalLotes: 0, procesados: 0, total: 0 });
    setResultados([]); setResumen(null); setErrMsg('');
    pausadoRef.current = false;
  };

  // ── PASO 1: Parsear Excel ──────────────────────────────────────────
  const analizarExcel = async () => {
    if (!archivo) return;
    setEstado('analizando'); setErrMsg('');
    try {
      const buffer = await archivo.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // Agrupar fotos por edificio_id
      const edificios = {};
      for (const row of rows) {
        const eid = row.edificio_id;
        const url = row.url_original;
        const tipo = (row.tipo_foto || 'MEDIA').toUpperCase();
        if (!eid || !url) continue;

        if (!edificios[eid]) {
          edificios[eid] = {
            nombre: row.nombre_edificio || '',
            ciudad: row.ciudad || '',
            damage_level: row.damage_level || '',
            fotos: [],
          };
        }
        edificios[eid].fotos.push({ url, tipo, archivo: row.nombre_archivo || '' });
      }

      // Calcular stats
      const totalEdificios = Object.keys(edificios).length;
      let totalFotos = 0;
      let edificiosConMain = 0;
      for (const eid of Object.keys(edificios)) {
        const fotos = edificios[eid].fotos;
        totalFotos += fotos.length;
        if (fotos.some(f => f.tipo === 'MAIN')) edificiosConMain++;
      }

      setFotosData({ edificios, totalEdificios, totalFotos, edificiosConMain });
      setProgreso({ loteActual: 0, totalLotes: Math.ceil(totalEdificios / BATCH_SIZE), procesados: 0, total: totalEdificios });
      setEstado('preview');
    } catch (e) {
      setErrMsg(e.message || 'Error al leer el archivo Excel');
      setEstado('error');
    }
  };

  // ── PASO 2: Ejecutar proceso ──────────────────────────────────────
  const iniciarProceso = async () => {
    if (!fotosData) return;
    setEstado('procesando');
    pausadoRef.current = false;

    const eids = Object.keys(fotosData.edificios);
    const totalLotes = Math.ceil(eids.length / BATCH_SIZE);
    const nuevosResultados = [];
    let procesados = 0;

    for (let i = 0; i < totalLotes; i++) {
      if (pausadoRef.current) { setEstado('pausado'); return; }

      const loteEids = eids.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const loteUrls = [];

      for (const eid of loteEids) {
        const info = fotosData.edificios[eid];
        // Priorizar MAIN primero, luego MEDIA, límite 5 fotos
        const ordenadas = [...info.fotos].sort((a, b) => {
          if (a.tipo === 'MAIN' && b.tipo !== 'MAIN') return -1;
          if (a.tipo !== 'MAIN' && b.tipo === 'MAIN') return 1;
          return 0;
        });
        const seleccionadas = ordenadas.slice(0, FOTO_LIMITE);
        for (const f of seleccionadas) {
          loteUrls.push({ edificio_id: eid, url_original: f.url, tipo_foto: f.tipo });
        }
      }

      setProgreso({ loteActual: i + 1, totalLotes, procesados, total: eids.length });

      try {
        const resp = await base44.functions.invoke('optimizarFotosEdificios', {
          action: 'procesar_lote',
          lote_urls: loteUrls,
        });

        const data = resp.data || resp;
        // Registrar cada edificio del lote
        for (const eid of loteEids) {
          const info = fotosData.edificios[eid];
          const resultFotos = (data.resultados || []).filter(r => r.edificio_id === eid);
          const okFotos = resultFotos.filter(r => r.status === 'ok').length;
          const updateInfo = (data.actualizados || []).find(a => a.edificio_id === eid);

          nuevosResultados.push({
            edificio_id: eid,
            nombre_edificio: info.nombre,
            ciudad: info.ciudad,
            status: updateInfo?.status === 'ok' ? 'ok' : (okFotos > 0 ? 'parcial' : 'error'),
            total_fotos_edificio: info.fotos.length,
            fotos_procesadas: okFotos,
            fotos_existentes: 0, // lo calculamos después si hay update
            error: updateInfo?.error || resultFotos.find(r => r.status === 'error')?.error,
          });
        }

        procesados += loteEids.length;
      } catch (e) {
        for (const eid of loteEids) {
          nuevosResultados.push({
            edificio_id: eid,
            nombre_edificio: fotosData.edificios[eid]?.nombre || eid,
            ciudad: fotosData.edificios[eid]?.ciudad || '',
            status: 'error',
            fotos_procesadas: 0,
            total_fotos_edificio: fotosData.edificios[eid]?.fotos.length || 0,
            error: e.message,
          });
        }
        procesados += loteEids.length;
      }
    }

    setResultados(nuevosResultados);
    const ok = nuevosResultados.filter(r => r.status === 'ok').length;
    const parcial = nuevosResultados.filter(r => r.status === 'parcial').length;
    const errs = nuevosResultados.filter(r => r.status === 'error').length;
    setResumen({ ok, parcial, errors: errs, total: eids.length });
    setEstado('listo');
  };

  const pausar = () => { pausadoRef.current = true; };
  const reanudar = () => { if (estado === 'pausado') iniciarProceso(); };

  const pct = progreso.totalLotes > 0 ? Math.round((progreso.loteActual / progreso.totalLotes) * 100) : 0;

  const t = (es, en) => es;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileSpreadsheet size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>🖼️ Carga masiva de fotos desde Drive</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.5 }}>
            Sube el archivo Excel con el índice de fotos. El sistema descargará cada imagen, la optimizará y la vinculará automáticamente con su edificio.
          </p>
        </div>
      </div>

      {/* Instrucciones */}
      <div style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 11, color: '#93C5FD', margin: 0, lineHeight: 1.6 }}>
          <strong>📋 Formato Excel requerido:</strong> columnas <em>edificio_id, url_original, tipo_foto (MAIN/MEDIA), nombre_archivo</em> (opcional: ciudad, damage_level, nombre_edificio)<br />
          <strong>Proceso:</strong> Descarga → Optimiza → Sube a almacenamiento privado → Vincula al edificio (máx {FOTO_LIMITE} fotos por edificio)<br />
          <strong>⚠️</strong> Se procesan {BATCH_SIZE} edificios por lote. No cierres la ventana hasta que termine.
        </p>
      </div>

      {/* IDLE / ERROR */}
      {(estado === 'idle' || estado === 'error') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
              📄 Excel con índice de fotos <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => { setArchivo(e.target.files[0] || null); setErrMsg(''); setEstado('idle'); }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${archivo ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.70)', cursor: 'pointer', boxSizing: 'border-box' }} />
            {archivo && <p style={{ fontSize: 10, color: '#86EFAC', marginTop: 4 }}>✅ {archivo.name} · {(archivo.size / 1024).toFixed(0)} KB</p>}
          </div>

          {errMsg && (
            <div style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>⚠️ {errMsg}</p>
            </div>
          )}

          <button onClick={analizarExcel} disabled={!archivo}
            style={{ background: archivo ? '#1D4ED8' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: archivo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: archivo ? 1 : 0.5 }}>
            <Eye size={16} /> Analizar archivo de fotos
          </button>
        </div>
      )}

      {/* ANALIZANDO */}
      {estado === 'analizando' && (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={28} color="#60A5FA" className="animate-spin" />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Analizando archivo Excel…</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>Agrupando fotos por edificio</p>
        </div>
      )}

      {/* PREVIEW */}
      {estado === 'preview' && fotosData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatCard icon="🏗️" label="Edificios" val={fotosData.totalEdificios} />
            <StatCard icon="🖼️" label="Fotos totales" val={fotosData.totalFotos} color="#93C5FD" />
            <StatCard icon="📸" label="Con foto principal" val={fotosData.edificiosConMain} color="#FCD34D" />
          </div>

          <div style={{ background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 12, color: '#86EFAC', margin: 0, lineHeight: 1.5 }}>
              ✅ Archivo analizado correctamente.{' '}
              Se procesarán <strong>{fotosData.totalEdificios}</strong> edificios en <strong>{progreso.totalLotes}</strong> lotes de {BATCH_SIZE}.<br />
              Límite de <strong>{FOTO_LIMITE} fotos por edificio</strong> (priorizando MAIN).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={iniciarProceso}
              style={{ flex: 2, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Upload size={16} /> Iniciar carga masiva ({fotosData.totalEdificios} edificios)
            </button>
          </div>
        </div>
      )}

      {/* PROCESANDO / PAUSADO */}
      {(estado === 'procesando' || estado === 'pausado') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {estado === 'procesando' ? (
              <Loader2 size={28} color="#60A5FA" className="animate-spin" style={{ marginBottom: 12 }} />
            ) : (
              <p style={{ fontSize: 28, marginBottom: 8 }}>⏸️</p>
            )}
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
              {estado === 'procesando' ? `Procesando lote ${progreso.loteActual} de ${progreso.totalLotes}…` : 'Proceso pausado'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>
              {progreso.procesados} de {progreso.total} edificios procesados
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: estado === 'procesando' ? '#3B82F6' : '#FCD34D', borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: estado === 'procesando' ? '#93C5FD' : '#FCD34D', margin: 0 }}>{pct}%</p>
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: 0 }}>
            {estado === 'procesando' ? 'No cierres esta ventana.' : 'Reanuda cuando estés listo.'}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {estado === 'procesando' ? (
              <button onClick={pausar} style={{ background: 'rgba(180,83,9,0.20)', border: '1px solid rgba(251,146,60,0.30)', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13, color: '#FCD34D', cursor: 'pointer' }}>
                ⏸️ Pausar
              </button>
            ) : (
              <button onClick={reanudar} style={{ background: '#1D4ED8', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer' }}>
                ▶️ Reanudar
              </button>
            )}
          </div>
        </div>
      )}

      {/* LISTO */}
      {estado === 'listo' && resumen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatCard icon="✅" label="Completos" val={resumen.ok} color="#86EFAC" />
            <StatCard icon="⚠️" label="Parciales" val={resumen.parcial} color="#FCD34D" />
            <StatCard icon="❌" label="Errores" val={resumen.errors} color="#FCA5A5" />
          </div>

          <div style={{ background: 'rgba(21,128,61,0.15)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={20} color="#86EFAC" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#86EFAC', margin: 0 }}>✅ Carga completada</p>
              <p style={{ fontSize: 12, color: 'rgba(134,239,172,0.80)', margin: '4px 0 0' }}>
                {resumen.ok} edificios con fotos completas, {resumen.parcial} parciales, {resumen.errors} con errores. Total: {resumen.total} edificios procesados.
              </p>
            </div>
          </div>

          {/* Log detallado */}
          {resultados.length > 0 && (
            <div>
              <button onClick={() => setLogExpandido(v => !v)}
                style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.60)' }}>
                  📋 Ver detalle por edificio ({resultados.length})
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{logExpandido ? '▲' : '▼'}</span>
              </button>
              {logExpandido && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 400, overflowY: 'auto' }}>
                  {resultados.map((r, i) => <LogRow key={i} item={r} />)}
                </div>
              )}
            </div>
          )}

          <button onClick={reset} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
            Procesar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}