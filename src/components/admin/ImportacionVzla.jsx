import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Eye, Image, MapPin, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DANO_COLOR = {
  leve:        { bg: '#FEF9C3', text: '#854D0E', label: 'Leve' },
  moderado:    { bg: '#FFEDD5', text: '#9A3412', label: 'Moderado' },
  grave:       { bg: '#FEE2E2', text: '#991B1B', label: 'Grave' },
  critico:     { bg: '#FCA5A5', text: '#7F1D1D', label: 'Crítico' },
  colapsado:   { bg: '#7F1D1D', text: '#FEE2E2', label: 'Colapsado' },
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

export default function ImportacionVzla() {
  const [csvFile, setCsvFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [estado, setEstado] = useState('idle'); // idle | subiendo | preview | cargando | listo | error
  const [preview, setPreview] = useState(null);
  const [csvUrl, setCsvUrl] = useState('');
  const [excelUrl, setExcelUrl] = useState('');
  const [progreso, setProgreso] = useState({ lote: 0, total_lotes: 0, guardados: 0 });
  const [errMsg, setErrMsg] = useState('');
  const [resumen, setResumen] = useState(null);

  const reset = () => {
    setCsvFile(null); setExcelFile(null);
    setEstado('idle'); setPreview(null);
    setCsvUrl(''); setExcelUrl('');
    setProgreso({ lote: 0, total_lotes: 0, guardados: 0 });
    setErrMsg(''); setResumen(null);
  };

  // ── Paso 1: subir archivos y previsualizar ───────────────────────────────────
  const cargarPreview = async () => {
    if (!csvFile) { setErrMsg('Selecciona al menos el archivo CSV de edificios.'); return; }
    setEstado('subiendo'); setErrMsg('');
    try {
      // Subir CSV
      const { file_url: cUrl } = await base44.integrations.Core.UploadFile({ file: csvFile });
      setCsvUrl(cUrl);

      // Subir Excel de fotos (opcional)
      let eUrl = '';
      if (excelFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: excelFile });
        eUrl = file_url;
        setExcelUrl(eUrl);
      }

      // Preview
      const resp = await base44.functions.invoke('importarEdificiosVzla', {
        csv_url: cUrl,
        excel_fotos_url: eUrl || undefined,
        solo_parsear: true,
      });
      if (resp.data?.error) throw new Error(resp.data.error);
      setPreview(resp.data);
      setEstado('preview');
    } catch (e) {
      setErrMsg(e.message || 'Error al analizar los archivos.');
      setEstado('error');
    }
  };

  // ── Paso 2: importar por lotes ───────────────────────────────────────────────
  const iniciarImportacion = async () => {
    if (!csvUrl) return;
    setEstado('cargando');
    setErrMsg('');
    let loteActual = 0;
    let guardadosTotal = 0;
    let totalLotes = preview?.unicos ? Math.ceil(preview.unicos / 50) : 1;
    setProgreso({ lote: 0, total_lotes: totalLotes, guardados: 0 });

    while (loteActual < totalLotes) {
      try {
        const resp = await base44.functions.invoke('importarEdificiosVzla', {
          csv_url: csvUrl,
          excel_fotos_url: excelUrl || undefined,
          solo_parsear: false,
          lote: loteActual,
          lote_size: 50,
        });
        if (resp.data?.error) throw new Error(resp.data.error);
        guardadosTotal += resp.data.guardados_este_lote || 0;
        totalLotes = resp.data.total_lotes || totalLotes;
        setProgreso({ lote: loteActual + 1, total_lotes: totalLotes, guardados: guardadosTotal });

        if (!resp.data.hay_mas) break;
        loteActual++;
      } catch (e) {
        setErrMsg(`Error en lote ${loteActual + 1}: ${e.message}`);
        setEstado('error');
        return;
      }
    }

    setResumen({ guardados: guardadosTotal, duplicados: preview?.duplicados || 0, total: preview?.total || 0 });
    setEstado('listo');
  };

  const pct = progreso.total_lotes > 0 ? Math.round((progreso.lote / progreso.total_lotes) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileSpreadsheet size={22} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
            Importación Venezuela 2026 — 858 edificios
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.5 }}>
            Sube el CSV de edificios y el Excel de fotos. El sistema concilia coordenadas y URLs de imágenes por <code style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '0 4px', fontSize: 10 }}>edificio_id</code>, detecta duplicados y carga por lotes de 50.
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div style={{ background: 'rgba(29,78,216,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
        <AlertTriangle size={14} color="#93C5FD" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: '#93C5FD', margin: 0, lineHeight: 1.5 }}>
          <strong>Formato esperado del CSV:</strong> columnas <em>id, name, address, city, lat, lng, damage_level, status, main_photo_url, media_urls</em>.<br />
          <strong>Formato esperado del Excel:</strong> columnas <em>edificio_id, tipo_foto (MAIN/MEDIA), url_original</em>.<br />
          Las fotos de Supabase/Drive se usan tal cual (sin realojar). Máx. 5 fotos por edificio (MAIN primero).
        </p>
      </div>

      {/* Estado: idle / error */}
      {(estado === 'idle' || estado === 'error') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* CSV */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
              📄 Archivo CSV de edificios <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input type="file" accept=".csv,text/csv"
              onChange={e => { setCsvFile(e.target.files[0] || null); setErrMsg(''); }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${csvFile ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.70)', cursor: 'pointer', boxSizing: 'border-box' }} />
            {csvFile && <p style={{ fontSize: 10, color: '#86EFAC', marginTop: 4 }}>✅ {csvFile.name} ({(csvFile.size / 1024).toFixed(0)} KB)</p>}
          </div>

          {/* Excel fotos */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
              🖼️ Excel de índice de fotos <span style={{ color: 'rgba(255,255,255,0.30)', fontWeight: 400 }}>(opcional — concilia por edificio_id)</span>
            </label>
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={e => { setExcelFile(e.target.files[0] || null); setErrMsg(''); }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${excelFile ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.70)', cursor: 'pointer', boxSizing: 'border-box' }} />
            {excelFile && <p style={{ fontSize: 10, color: '#86EFAC', marginTop: 4 }}>✅ {excelFile.name} ({(excelFile.size / 1024).toFixed(0)} KB)</p>}
          </div>

          {errMsg && (
            <div style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>⚠️ {errMsg}</p>
            </div>
          )}

          <button onClick={cargarPreview} disabled={!csvFile}
            style={{ background: csvFile ? '#1D4ED8' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: csvFile ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: csvFile ? 1 : 0.5 }}>
            <Eye size={16} /> Analizar y previsualizar
          </button>
        </div>
      )}

      {/* Estado: subiendo */}
      {estado === 'subiendo' && (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={32} color="#60A5FA" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Subiendo archivos y analizando datos…</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>Conciliando fotos por edificio_id · Detectando duplicados</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Estado: preview */}
      {estado === 'preview' && preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <StatPill icon="🏗️" label="Total detectados" val={preview.total} />
            <StatPill icon="✅" label="Nuevos (únicos)" val={preview.unicos} color="#86EFAC" />
            <StatPill icon="🖼️" label="Con fotos" val={preview.con_fotos} color="#93C5FD" />
            <StatPill icon="📍" label="Con coordenadas" val={preview.con_coords} color="#FCD34D" />
          </div>

          {preview.duplicados > 0 && (
            <div style={{ background: 'rgba(180,83,9,0.10)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#FDBA74', margin: 0 }}>
                🔁 {preview.duplicados} edificio(s) ya existen en la plataforma — serán omitidos automáticamente.
              </p>
            </div>
          )}

          {/* Preview de los primeros 10 únicos */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
              Vista previa — primeros {Math.min(10, (preview.edificios_preview || []).length)} de {preview.unicos} edificios nuevos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
              {(preview.edificios_preview || []).slice(0, 10).map((e, i) => {
                const cfg = DANO_COLOR[e.nivel_dano] || DANO_COLOR.no_evaluado;
                return (
                  <div key={i} style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre_lugar}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: '2px 0' }}>📍 {e.ciudad} {e.lat ? `· ${parseFloat(e.lat).toFixed(4)}, ${parseFloat(e.lng).toFixed(4)}` : ''}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {e.foto_urls?.length > 0 && <span style={{ fontSize: 9, color: '#93C5FD', background: 'rgba(59,130,246,0.12)', padding: '2px 6px', borderRadius: 20 }}>🖼️ {e.foto_urls.length} fotos</span>}
                        {e.lat && <span style={{ fontSize: 9, color: '#FCD34D', background: 'rgba(234,179,8,0.10)', padding: '2px 6px', borderRadius: 20 }}>📍 coords</span>}
                      </div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={iniciarImportacion} disabled={preview.unicos === 0}
              style={{ flex: 2, background: preview.unicos > 0 ? '#15803D' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: preview.unicos > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: preview.unicos > 0 ? 1 : 0.5 }}>
              <Upload size={16} /> Importar {preview.unicos} edificio(s) nuevo(s)
            </button>
          </div>
        </div>
      )}

      {/* Estado: cargando (barra de progreso) */}
      {estado === 'cargando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Loader2 size={28} color="#86EFAC" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Importando edificios…</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>Lote {progreso.lote} de {progreso.total_lotes} · {progreso.guardados} guardados</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#22C55E', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#86EFAC', margin: 0 }}>{pct}%</p>
          <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.30)', margin: 0 }}>No cierres esta ventana hasta que termine.</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Estado: listo */}
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
            <StatPill icon="🔁" label="Duplicados omitidos" val={resumen.duplicados} color="#FDBA74" />
            <StatPill icon="🏗️" label="Total detectados" val={resumen.total} />
          </div>
          <button onClick={reset} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
            Importar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}