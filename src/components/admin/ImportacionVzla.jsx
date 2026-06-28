import { useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Eye, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import * as XLSX from 'xlsx';

// ── Utilidades de normalización (en el cliente) ───────────────────────────────
function norm(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
function similitud(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wA = na.split(' '), wB = nb.split(' ');
  return wA.filter(w => w.length > 3 && wB.includes(w)).length / Math.max(wA.length, wB.length);
}
function mismoEdificio(a, b) {
  const mismaCiudad = norm(a.ciudad || '') === norm(b.ciudad || '');
  if (similitud(a.nombre_lugar, b.nombre_lugar) > 0.8 && mismaCiudad) return true;
  if (similitud(a.direccion, b.direccion) > 0.8 && mismaCiudad) return true;
  return false;
}

const DANO_MAP = {
  total: 'colapsado', 'colapso total': 'colapsado', collapsed: 'colapsado',
  severo: 'grave', severe: 'grave', grave: 'grave',
  parcial: 'moderado', partial: 'moderado', moderado: 'moderado', moderate: 'moderado',
  leve: 'leve', minor: 'leve', 'sin danos': 'leve', none: 'leve',
};
const VERIF_MAP = {
  verificado: 'institucional', verified: 'institucional',
  'en_revision': 'comunidad', 'en revision': 'comunidad',
  pendiente: 'sin_verificar',
};
function normDano(v) { return DANO_MAP[norm(v || '')] || 'no_evaluado'; }
function normVerif(v) { return VERIF_MAP[norm(v || '')] || 'sin_verificar'; }

function getf(row, ...keys) {
  for (const key of keys) {
    for (const k of Object.keys(row)) {
      if (norm(k) === norm(key)) {
        const v = String(row[k] || '').trim();
        if (v && v.toLowerCase() !== 'n/a') return v;
      }
    }
  }
  return '';
}

function parsearArchivo(buffer) {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function leerComoBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function normalizarEdificios(csvRows, fotosPorEdificio) {
  return csvRows.map(row => {
    const eid = getf(row, 'id', '\uFEFFid');
    const nivelDano = normDano(getf(row, 'damage_level', 'nivel_dano', 'nivel daño'));
    const esCritico = nivelDano === 'colapsado' || nivelDano === 'critico';

    let fotosFinales = [];
    if (eid && fotosPorEdificio[eid]) {
      const { main, media } = fotosPorEdificio[eid];
      fotosFinales = [...main, ...media].slice(0, 5);
    }
    if (fotosFinales.length === 0) {
      const mainPhoto = getf(row, 'main_photo_url', 'main_photo', 'foto_principal');
      const mediaUrls = getf(row, 'media_urls', 'media', 'fotos', 'images');
      if (mainPhoto) fotosFinales.push(mainPhoto);
      if (mediaUrls) {
        mediaUrls.split(',').map(u => u.trim()).filter(u => u.startsWith('http'))
          .forEach(u => { if (!fotosFinales.includes(u) && fotosFinales.length < 5) fotosFinales.push(u); });
      }
    }

    const latStr = getf(row, 'lat', 'latitud');
    const lngStr = getf(row, 'lng', 'lon', 'longitud');
    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;

    return {
      tipo_estructura: 'edificio_residencial',
      nombre_lugar: getf(row, 'name', 'nombre', 'nombre_lugar'),
      nivel_dano: nivelDano,
      estado_acceso: esCritico ? 'no_entrar' : (nivelDano === 'grave' ? 'solo_rescatistas' : 'no_verificado'),
      personas_atrapadas: 'no_sabe',
      acceso_calle: 'no_sabe', acceso_vehiculos: 'no_sabe',
      electricidad: 'no_confirmado', agua: 'no_confirmado', gas: 'no_confirmado',
      riesgo_gas: false, riesgo_electrico: false, riesgo_incendio: false, riesgo_colapso: esCritico,
      descripcion: getf(row, 'description', 'descripcion', 'notas', 'notes'),
      direccion: getf(row, 'address', 'direccion'),
      referencia: getf(row, 'zone', 'zona'),
      ciudad: getf(row, 'city', 'ciudad'),
      estado_region: 'La Guaira',
      ...(lat && lng && !isNaN(lat) && !isNaN(lng) ? { lat, lng, geo_fuente: 'csv_import' } : {}),
      foto_urls: fotosFinales,
      prioridad: esCritico ? 'critica' : (nivelDano === 'grave' ? 'alta' : 'normal'),
      estado_verificacion: 'recibido',
      nivel_verificacion: normVerif(getf(row, 'status', 'estado', 'verificacion')),
      fuente: 'importacion_vzla_2026',
      reportante_nombre: 'Admin — Importación Venezuela 2026',
    };
  }).filter(e => e.nombre_lugar.length > 1);
}

const DANO_COLOR = {
  leve: { bg: '#FEF9C3', text: '#854D0E', label: 'Leve' },
  moderado: { bg: '#FFEDD5', text: '#9A3412', label: 'Moderado' },
  grave: { bg: '#FEE2E2', text: '#991B1B', label: 'Grave' },
  critico: { bg: '#FCA5A5', text: '#7F1D1D', label: 'Crítico' },
  colapsado: { bg: '#7F1D1D', text: '#FEE2E2', label: 'Colapsado' },
  no_evaluado: { bg: '#F3F4F6', text: '#374151', label: 'Sin evaluar' },
};

function StatPill({ icon, label, val, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: color || '#fff', margin: 0 }}>{val}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{icon} {label}</p>
    </div>
  );
}

const BATCH_SIZE = 30;

export default function ImportacionVzla() {
  const [csvFile, setCsvFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [estado, setEstado] = useState('idle'); // idle | analizando | preview | cargando | listo | error
  const [preview, setPreview] = useState(null); // { unicos, duplicados, total, conFotos, conCoords, edificiosPreview }
  const [unicosParaImportar, setUnicosParaImportar] = useState([]);
  const [progreso, setProgreso] = useState({ loteActual: 0, totalLotes: 0, guardados: 0 });
  const [errMsg, setErrMsg] = useState('');
  const [resumen, setResumen] = useState(null);

  const reset = () => {
    setCsvFile(null); setExcelFile(null); setEstado('idle');
    setPreview(null); setUnicosParaImportar([]); setProgreso({ loteActual: 0, totalLotes: 0, guardados: 0 });
    setErrMsg(''); setResumen(null);
  };

  // ── PASO 1: Parsear archivos en el cliente y deduplicar ───────────────────────
  const analizarArchivos = async () => {
    if (!csvFile) { setErrMsg('Selecciona el archivo CSV de edificios.'); return; }
    setEstado('analizando'); setErrMsg('');
    try {
      // Parsear CSV
      const csvBuffer = await leerComoBuffer(csvFile);
      const csvRows = parsearArchivo(csvBuffer);

      // Parsear Excel de fotos (opcional)
      const fotosPorEdificio = {};
      if (excelFile) {
        const xlsxBuffer = await leerComoBuffer(excelFile);
        const fotoRows = parsearArchivo(xlsxBuffer);
        for (const row of fotoRows) {
          const eid = getf(row, 'edificio_id', 'id');
          const url = getf(row, 'url_original', 'url', 'foto_url');
          const tipo = getf(row, 'tipo_foto', 'tipo');
          if (!eid || !url) continue;
          if (!fotosPorEdificio[eid]) fotosPorEdificio[eid] = { main: [], media: [] };
          if (tipo === 'MAIN') fotosPorEdificio[eid].main.push(url);
          else fotosPorEdificio[eid].media.push(url);
        }
      }

      // Normalizar
      const todos = normalizarEdificios(csvRows, fotosPorEdificio);

      // Obtener existentes del backend (solo nombre+dir+ciudad, ligero)
      const resp = await base44.functions.invoke('importarEdificiosVzla', { action: 'obtener_existentes' });
      if (resp.data?.error) throw new Error(resp.data.error);
      const existentes = resp.data?.existentes || [];

      // Deduplicar en el cliente
      const unicos = [], duplicados = [];
      for (const e of todos) {
        if (existentes.some(ext => mismoEdificio(e, ext))) {
          duplicados.push(e.nombre_lugar);
        } else {
          unicos.push(e);
        }
      }

      setUnicosParaImportar(unicos);
      setPreview({
        total: todos.length,
        unicos: unicos.length,
        duplicados: duplicados.length,
        conFotos: todos.filter(e => e.foto_urls?.length > 0).length,
        conCoords: todos.filter(e => e.lat).length,
        edificiosPreview: unicos.slice(0, 12),
      });
      setEstado('preview');
    } catch (e) {
      setErrMsg(e.message || 'Error al analizar los archivos.');
      setEstado('error');
    }
  };

  // ── PASO 2: Importar por lotes pequeños ────────────────────────────────────
  const iniciarImportacion = async () => {
    if (!unicosParaImportar.length) return;
    setEstado('cargando');
    const totalLotes = Math.ceil(unicosParaImportar.length / BATCH_SIZE);
    let guardadosTotal = 0;

    for (let i = 0; i < totalLotes; i++) {
      const lote = unicosParaImportar.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      setProgreso({ loteActual: i + 1, totalLotes, guardados: guardadosTotal });
      try {
        const resp = await base44.functions.invoke('importarEdificiosVzla', {
          action: 'insertar_lote',
          edificios: lote,
        });
        if (resp.data?.error) throw new Error(resp.data.error);
        guardadosTotal += resp.data?.guardados || 0;
      } catch (e) {
        setErrMsg(`Error en lote ${i + 1}/${totalLotes}: ${e.message}`);
        setEstado('error');
        return;
      }
    }

    setResumen({ guardados: guardadosTotal, duplicados: preview.duplicados, total: preview.total });
    setEstado('listo');
  };

  const pct = progreso.totalLotes > 0 ? Math.round((progreso.loteActual / progreso.totalLotes) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileSpreadsheet size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Importación Venezuela 2026 — 858 edificios</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.5 }}>
            El parseo y deduplicación ocurren en tu navegador. El backend solo recibe lotes pequeños de 30 registros listos para guardar.
          </p>
        </div>
      </div>

      {/* Aviso formato */}
      <div style={{ background: 'rgba(29,78,216,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 11, color: '#93C5FD', margin: 0, lineHeight: 1.6 }}>
          <strong>CSV:</strong> columnas <em>id, name, address, city, lat, lng, damage_level, status, main_photo_url, media_urls</em><br />
          <strong>Excel fotos (opcional):</strong> columnas <em>edificio_id, tipo_foto (MAIN/MEDIA), url_original</em>
        </p>
      </div>

      {/* IDLE / ERROR */}
      {(estado === 'idle' || estado === 'error') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
              📄 CSV de edificios <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input type="file" accept=".csv,text/csv"
              onChange={e => { setCsvFile(e.target.files[0] || null); setErrMsg(''); }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${csvFile ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.70)', cursor: 'pointer', boxSizing: 'border-box' }} />
            {csvFile && <p style={{ fontSize: 10, color: '#86EFAC', marginTop: 4 }}>✅ {csvFile.name} · {(csvFile.size / 1024).toFixed(0)} KB</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
              🖼️ Excel de fotos <span style={{ color: 'rgba(255,255,255,0.30)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => { setExcelFile(e.target.files[0] || null); setErrMsg(''); }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${excelFile ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.70)', cursor: 'pointer', boxSizing: 'border-box' }} />
            {excelFile && <p style={{ fontSize: 10, color: '#86EFAC', marginTop: 4 }}>✅ {excelFile.name} · {(excelFile.size / 1024).toFixed(0)} KB</p>}
          </div>

          {errMsg && (
            <div style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>⚠️ {errMsg}</p>
              <p style={{ fontSize: 10, color: 'rgba(252,165,165,0.60)', margin: '4px 0 0' }}>Puedes volver a intentarlo. Los lotes ya guardados no se duplicarán.</p>
            </div>
          )}

          <button onClick={analizarArchivos} disabled={!csvFile}
            style={{ background: csvFile ? '#1D4ED8' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: csvFile ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: csvFile ? 1 : 0.5 }}>
            <Eye size={16} /> Analizar archivos (en el navegador)
          </button>
        </div>
      )}

      {/* ANALIZANDO */}
      {estado === 'analizando' && (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={32} color="#60A5FA" className="animate-spin" />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Leyendo archivos y detectando duplicados…</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>Todo el procesamiento ocurre en tu navegador.</p>
        </div>
      )}

      {/* PREVIEW */}
      {estado === 'preview' && preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <StatPill icon="🏗️" label="Total" val={preview.total} />
            <StatPill icon="✅" label="Nuevos" val={preview.unicos} color="#86EFAC" />
            <StatPill icon="🖼️" label="Con fotos" val={preview.conFotos} color="#93C5FD" />
            <StatPill icon="📍" label="Con coords" val={preview.conCoords} color="#FCD34D" />
          </div>

          {preview.duplicados > 0 && (
            <div style={{ background: 'rgba(180,83,9,0.10)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#FDBA74', margin: 0 }}>
                🔁 {preview.duplicados} ya existen en la plataforma — serán omitidos.
              </p>
            </div>
          )}

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              Primeros {preview.edificiosPreview.length} de {preview.unicos} edificios nuevos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 320, overflowY: 'auto' }}>
              {preview.edificiosPreview.map((e, i) => {
                const cfg = DANO_COLOR[e.nivel_dano] || DANO_COLOR.no_evaluado;
                return (
                  <div key={i} style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre_lugar}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: '2px 0 0' }}>
                        📍 {e.ciudad}{e.lat ? ` · ${parseFloat(e.lat).toFixed(3)}, ${parseFloat(e.lng).toFixed(3)}` : ''}
                        {e.foto_urls?.length > 0 && <span style={{ color: '#93C5FD' }}> · 🖼️{e.foto_urls.length}</span>}
                      </p>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={iniciarImportacion} disabled={preview.unicos === 0}
              style={{ flex: 2, background: preview.unicos > 0 ? '#15803D' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: preview.unicos > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: preview.unicos > 0 ? 1 : 0.5 }}>
              <Upload size={16} /> Importar {preview.unicos} edificio(s)
            </button>
          </div>
        </div>
      )}

      {/* CARGANDO */}
      {estado === 'cargando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Loader2 size={28} color="#86EFAC" className="animate-spin" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Importando lote {progreso.loteActual} de {progreso.totalLotes}…</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>{progreso.guardados} edificios guardados hasta ahora</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#22C55E', borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#86EFAC', margin: 0 }}>{pct}%</p>
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: 0 }}>No cierres esta ventana hasta que termine.</p>
        </div>
      )}

      {/* LISTO */}
      {estado === 'listo' && resumen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(20,83,45,0.25)', border: '1px solid rgba(34,197,94,0.30)', borderRadius: 12, padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <CheckCircle size={22} color="#86EFAC" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#86EFAC', margin: 0 }}>✅ Importación completada</p>
              <p style={{ fontSize: 12, color: 'rgba(134,239,172,0.80)', margin: '4px 0 0' }}>
                {resumen.guardados} edificios importados de {resumen.total} detectados.
                {resumen.duplicados > 0 && ` ${resumen.duplicados} duplicados omitidos.`}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatPill icon="✅" label="Importados" val={resumen.guardados} color="#86EFAC" />
            <StatPill icon="🔁" label="Omitidos" val={resumen.duplicados} color="#FDBA74" />
            <StatPill icon="🏗️" label="Total" val={resumen.total} />
          </div>
          <button onClick={reset} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}