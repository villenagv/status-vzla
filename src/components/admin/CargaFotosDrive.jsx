import { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Eye, Download, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import * as XLSX from 'xlsx';

const FOTO_LIMITE = 5;

function StatCard({ icon, label, val, color }) {
  return (
    <div style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: color || '#fff', margin: 0 }}>{val}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>{icon} {label}</p>
    </div>
  );
}

function LogRow({ item }) {
  const fotoLimite = item.nuevas > FOTO_LIMITE;
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
          🏗️ {item.edificio_id?.slice(0, 12)}…
          {item.nuevas > 0 && <span style={{ color: '#93C5FD' }}> · {item.nuevas} fotos nuevas</span>}
          {item.total_fotos > 0 && <span style={{ color: '#86EFAC' }}> · {item.total_fotos} total</span>}
          {fotoLimite && <span style={{ color: '#FCD34D' }}> · max alcanzado</span>}
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
  const [fotosData, setFotosData] = useState(null);
  const [estado, setEstado] = useState('idle'); // idle | analizando | preview | procesando | listo | error
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [logExpandido, setLogExpandido] = useState(false);

  const reset = () => {
    setArchivo(null); setFotosData(null); setEstado('idle');
    setProgreso(0); setResultados([]); setResumen(null); setErrMsg('');
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

      const edificios = {};
      for (const row of rows) {
        const eid = row.edificio_id;
        if (!eid) continue;
        if (!edificios[eid]) {
          edificios[eid] = {
            nombre: row.nombre_edificio || '',
            ciudad: row.ciudad || '',
            damage_level: row.damage_level || '',
            fotos: [],
          };
        }
        if (row.url_original) {
          edificios[eid].fotos.push({
            url: row.url_original,
            tipo: (row.tipo_foto || 'MEDIA').toUpperCase(),
            archivo: row.nombre_archivo || '',
          });
        }
      }

      const totalEdificios = Object.keys(edificios).length;
      let totalFotos = 0;
      let edificiosConMain = 0;
      for (const eid of Object.keys(edificios)) {
        const fotos = edificios[eid].fotos;
        totalFotos += fotos.length;
        if (fotos.some(f => f.tipo === 'MAIN')) edificiosConMain++;
      }

      setFotosData({ edificios, totalEdificios, totalFotos, edificiosConMain });
      setEstado('preview');
    } catch (e) {
      setErrMsg(e.message || 'Error al leer el archivo Excel');
      setEstado('error');
    }
  };

  // ── PASO 2: Ejecutar proceso (TODO en UNA sola llamada) ──────────
  const iniciarProceso = async () => {
    if (!fotosData) return;
    setEstado('procesando');
    setProgreso(0);

    const edificios = fotosData.edificios;
    const eids = Object.keys(edificios);
    const loteUrls = [];

    for (const eid of eids) {
      const info = edificios[eid];
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

    try {
      const resp = await base44.functions.invoke('optimizarFotosEdificios', {
        action: 'procesar_lote',
        lote_urls: loteUrls,
      });

      const data = resp.data || resp;
      setProgreso(100);

      // Mapear resultados por edificio
      const resultadosMap = {};
      for (const r of (data.resultados || [])) {
        if (!resultadosMap[r.edificio_id]) {
          resultadosMap[r.edificio_id] = { ok: 0, errors: 0, error: null };
        }
        if (r.status === 'ok') resultadosMap[r.edificio_id].ok++;
        else {
          resultadosMap[r.edificio_id].errors++;
          resultadosMap[r.edificio_id].error = r.error;
        }
      }

      const nuevosResultados = eids.map(eid => {
        const info = edificios[eid];
        const stats = resultadosMap[eid] || { ok: 0, errors: 0 };
        const actualizado = (data.actualizados || []).find(a => a.edificio_id === eid);
        return {
          edificio_id: eid,
          nombre_edificio: info.nombre,
          ciudad: info.ciudad,
          status: actualizado?.status === 'ok' ? 'ok' : (stats.ok > 0 ? 'parcial' : 'error'),
          total_fotos_deseadas: Math.min(info.fotos.length, FOTO_LIMITE),
          nuevas: actualizado?.nuevas || stats.ok || 0,
          total_fotos: actualizado?.total_fotos || 0,
          error: actualizado?.error || stats.error,
        };
      });

      setResultados(nuevosResultados);
      const ok = nuevosResultados.filter(r => r.status === 'ok').length;
      const parcial = nuevosResultados.filter(r => r.status === 'parcial').length;
      const errs = nuevosResultados.filter(r => r.status === 'error').length;
      setResumen({ ok, parcial, errors: errs, total: eids.length });
      setEstado('listo');
    } catch (e) {
      setErrMsg(e.message || 'Error en la función backend');
      setEstado('error');
    }
  };

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
            Sube el archivo Excel con el índice de fotos. El sistema descargará cada imagen, la subirá al almacenamiento y la vinculará automáticamente con su edificio — en una sola ejecución.
          </p>
        </div>
      </div>

      {/* Instrucciones */}
      <div style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 11, color: '#93C5FD', margin: 0, lineHeight: 1.6 }}>
          <strong>📋 Formato Excel:</strong> columnas <em>edificio_id, url_original, tipo_foto (MAIN/MEDIA)</em> (opcional: nombre_archivo, ciudad, damage_level, nombre_edificio)<br />
          <strong>⚠️ Optimización:</strong> Todo el proceso se ejecuta en <strong>una sola llamada</strong> al backend — consume 1 crédito de función en lugar de docenas.<br />
          <strong>Límite:</strong> {FOTO_LIMITE} fotos por edificio (priorizando MAIN sobre MEDIA).
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
              ✅ Archivo analizado: <strong>{fotosData.totalEdificios}</strong> edificios, <strong>{fotosData.totalFotos}</strong> fotos.<br />
              Límite de <strong>{FOTO_LIMITE} fotos por edificio</strong> (priorizando MAIN).<br />
              Se ejecutará en <strong>1 sola llamada</strong> al backend.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={iniciarProceso}
              style={{ flex: 2, background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Upload size={16} /> Iniciar carga masiva
            </button>
          </div>
        </div>
      )}

      {/* PROCESANDO */}
      {estado === 'procesando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Loader2 size={28} color="#60A5FA" className="animate-spin" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
              Procesando {fotosData?.totalFotos || 0} fotos en una sola ejecución…
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>
              Descargando, subiendo y vinculando fotos. Esto puede tomar varios minutos.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progreso}%`, background: '#3B82F6', borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.30)', margin: 0 }}>
            No cierres esta ventana — el backend procesa en segundo plano.
          </p>
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
                {resumen.ok} edificios completos, {resumen.parcial} parciales, {resumen.errors} con errores. Total: {resumen.total} edificios — 1 ejecución de función.
              </p>
            </div>
          </div>

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