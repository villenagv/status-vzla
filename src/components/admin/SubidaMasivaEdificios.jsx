import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, Loader2, ShieldCheck, AlertTriangle, Eye, Check, Copy, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Plantilla CSV de ejemplo ──────────────────────────────────────────────────
const CSV_PLANTILLA = `ID_Original,Nombre,Tipo,Direccion,Ciudad,Estado,Pais,NivelDano,Verificacion,Notas,Fuentes,RiesgoGas,RiesgoElectrico,RiesgoIncendio,Atrapados
1,"Hotel Eduard's",Hotel,"Macuto, frente al estadio J.L. García Carneiro",Macuto,La Guaira,Venezuela,Colapso Total,Confirmado,"Hospedaba familiares del equipo Delfines de La Guaira; víctimas fatales confirmadas","https://ejemplo.com/foto1.jpg; https://ejemplo.com/foto2.jpg",false,false,false,no
2,"Edificio Las Torres",Edificio Residencial,"Av. Principal Altamira #12",Caracas,Miranda,Venezuela,Grave,Comunidad,"Fachada este parcialmente derrumbada, cables eléctricos caídos","https://ejemplo.com/foto3.jpg",false,true,false,voces
3,"Hospital Central de La Guaira",Hospital,"Calle Sucre, La Guaira",La Guaira,La Guaira,Venezuela,Moderado,Confirmado,"Sin agua, generador activo, recibe pacientes","",false,false,false,no
4,"Escuela Simón Bolívar",Escuela,"Urb. Los Rosales, Macuto",Macuto,La Guaira,Venezuela,Leve,Comunidad,"Vidrios rotos, estructura firme, cerrada por precaución","",false,false,false,no
5,"Puente Los Caracoles",Puente,"Autopista La Guaira - Caracas km 8",La Guaira,La Guaira,Venezuela,Critico,Confirmado,"Estructura comprometida, vía cerrada completamente","https://ejemplo.com/puente.jpg",false,false,false,no`;

// ── Prompt IA para convertir texto desordenado ────────────────────────────────
const PROMPT_IA = `Actúa como asistente de gestión de emergencias en Venezuela.

Tengo información sobre edificios o estructuras dañadas (puede venir de WhatsApp, notas o reportes verbales). Necesito que la conviertas en una tabla CSV con estas columnas EXACTAS (en este orden):

ID_Original, Nombre, Tipo, Direccion, Ciudad, Estado, Pais, NivelDano, Verificacion, Notas, Fuentes, RiesgoGas, RiesgoElectrico, RiesgoIncendio, Atrapados

REGLAS OBLIGATORIAS:
1. Tipo: Hotel / Edificio Residencial / Hospital / Escuela / Iglesia / Comercio / Calle o Vía / Puente / Refugio / Otro
2. NivelDano: Sin Daños / Leve / Moderado / Grave / Critico / Colapso Total / No Evaluado
3. Verificacion: Confirmado / Comunidad / Sin Verificar
4. RiesgoGas, RiesgoElectrico, RiesgoIncendio: true / false
5. Atrapados: si / no / voces / no_sabe
6. Fuentes: URLs de fotos o fuentes separadas por punto y coma (;). Si no hay, dejar vacío.
7. Si un dato no está disponible, escribe: No especificado
8. Una estructura por fila, con comillas dobles en cada campo
9. Primera fila = nombres de columnas

Devuelve SOLO la tabla CSV, sin explicaciones.

TEXTO A PROCESAR:
[PEGA AQUÍ TU INFORMACIÓN]`;

// ── NIVELES DE DAÑO para la preview ──────────────────────────────────────────
const DANO_COLOR = {
  leve:        { bg: '#FEF9C3', text: '#854D0E', label: 'Leve' },
  moderado:    { bg: '#FFEDD5', text: '#9A3412', label: 'Moderado' },
  grave:       { bg: '#FEE2E2', text: '#991B1B', label: 'Grave' },
  critico:     { bg: '#FCA5A5', text: '#7F1D1D', label: 'Crítico' },
  colapsado:   { bg: '#991B1B', text: '#FEE2E2', label: 'Colapsado' },
  no_evaluado: { bg: '#F3F4F6', text: '#374151', label: 'No evaluado' },
};

// ── Utilidades ────────────────────────────────────────────────────────────────
function descargarCSV(contenido, nombre) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

function BtnCopiar({ texto }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500); }}
      style={{ background: copiado ? '#166534' : '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? '✅ ¡Copiado!' : '📋 Copiar prompt para IA'}
    </button>
  );
}

// ── Sección de herramientas ──────────────────────────────────────────────────
function SeccionHerramientas() {
  const [tab, setTab] = useState('plantilla');
  const [abierto, setAbierto] = useState(false);

  return (
    <div style={{ background: '#13151F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
      <button onClick={() => setAbierto(v => !v)}
        style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Herramientas de preparación</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>Plantilla CSV oficial · Prompt para IA</p>
          </div>
        </div>
        {abierto ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.35)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.35)' }} />}
      </button>

      {abierto && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
            {[{ k: 'plantilla', icon: '📄', label: 'Plantilla CSV' }, { k: 'prompt', icon: '🤖', label: 'Prompt IA' }].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                style={{ flex: 1, border: 'none', cursor: 'pointer', padding: '9px 0', fontSize: 12, fontWeight: 700,
                  background: tab === t.k ? '#2563EB' : 'transparent', color: tab === t.k ? '#fff' : 'rgba(255,255,255,0.40)' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {tab === 'plantilla' && (
            <>
              <div style={{ background: 'rgba(20,83,45,0.25)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#86EFAC', marginBottom: 4 }}>¿Cómo usar esta plantilla?</p>
                <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'rgba(134,239,172,0.80)', lineHeight: 1.7 }}>
                  <li>Descarga el archivo CSV.</li>
                  <li>Ábrelo en Excel o Google Sheets.</li>
                  <li>Borra los datos de ejemplo (fila 2 en adelante) y llena con tus datos.</li>
                  <li><strong>No cambies los encabezados de la fila 1.</strong></li>
                  <li>En la columna <em>Fuentes</em>, pon links de imágenes separados por punto y coma (;).</li>
                  <li>Guarda como CSV y sube el archivo aquí.</li>
                </ol>
              </div>
              <div style={{ background: '#0D0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, overflowX: 'auto', maxHeight: 140, fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.60)', whiteSpace: 'pre', lineHeight: 1.5 }}>
                {CSV_PLANTILLA}
              </div>
              <button onClick={() => descargarCSV(CSV_PLANTILLA, 'plantilla_edificios_statusvzla.csv')}
                style={{ background: '#166534', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={14} /> Descargar plantilla edificios (.csv)
              </button>
            </>
          )}

          {tab === 'prompt' && (
            <>
              <div style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', marginBottom: 4 }}>¿Cómo usar este prompt?</p>
                <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'rgba(147,197,253,0.80)', lineHeight: 1.7 }}>
                  <li>Copia el prompt de abajo.</li>
                  <li>Abre ChatGPT, Claude o Gemini.</li>
                  <li>Pega el prompt y reemplaza el texto marcado con tu lista de edificios.</li>
                  <li>Copia la tabla CSV que genera la IA.</li>
                  <li>Pégala en un archivo .csv y sube aquí.</li>
                </ol>
              </div>
              <div style={{ background: '#0D0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.70)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {PROMPT_IA}
              </div>
              <BtnCopiar texto={PROMPT_IA} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tabla de preview (con duplicados marcados) ──────────────────────────────
function PreviewTabla({ edificios, duplicadosDetalle }) {
  const [pag, setPag] = useState(0);
  const PER = 5;
  const slice = edificios.slice(pag * PER, (pag + 1) * PER);
  const total = Math.ceil(edificios.length / PER);

  // Índice de nombres de duplicados (rápido lookup)
  const nombresDup = new Set((duplicadosDetalle || []).map(d => normalizarStr(d.nombre)));

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
        Vista previa — {edificios.length} edificios detectados
        {duplicadosDetalle?.length > 0 && (
          <span style={{ color: '#FB923C', marginLeft: 6 }}>
            · {duplicadosDetalle.length} duplicado(s) detectados
          </span>
        )}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slice.map((e, i) => {
          const cfg = DANO_COLOR[e.nivel_dano] || DANO_COLOR.no_evaluado;
          const esDuplicado = nombresDup.has(normalizarStr(e.nombre_lugar));
          const dupInfo = duplicadosDetalle?.find(d => normalizarStr(d.nombre) === normalizarStr(e.nombre_lugar));
          return (
            <div key={i} style={{
              background: esDuplicado ? 'rgba(180,83,9,0.10)' : '#1C2128',
              border: `1px solid ${esDuplicado ? 'rgba(251,146,60,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {esDuplicado && <span style={{ color: '#FB923C', fontSize: 11, flexShrink: 0 }}>🔁</span>}
                  <p style={{
                    fontSize: 13, fontWeight: 700,
                    color: esDuplicado ? '#FB923C' : '#fff',
                    marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.nombre_lugar}
                    {esDuplicado && <span style={{ color: '#FB923C', fontSize: 10, fontWeight: 400, marginLeft: 6 }}>(duplicado)</span>}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                  {e.ciudad}, {e.estado_region} · {e.tipo_estructura}
                </p>
                {dupInfo && (
                  <div style={{ background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.20)', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                    <p style={{ fontSize: 9, color: '#FDBA74', margin: 0, lineHeight: 1.4 }}>
                      🔁 Coincide con: <strong>{dupInfo.coincideCon?.nombre || '—'}</strong>
                      {dupInfo.coincideCon?.direccion && <> · {dupInfo.coincideCon.direccion}</>}
                      · Reportado: {dupInfo.coincideCon?.creado ? new Date(dupInfo.coincideCon.creado).toLocaleDateString() : '—'}
                    </p>
                  </div>
                )}
                {e.descripcion && (
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {e.descripcion}
                  </p>
                )}
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                  {cfg.label}
                </span>
                {e.foto_urls?.length > 0 && (
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)' }}>📷 {e.foto_urls.length}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {total > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
          {Array.from({ length: total }, (_, i) => (
            <button key={i} onClick={() => setPag(i)}
              style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: pag === i ? '#2563EB' : 'rgba(255,255,255,0.08)', color: pag === i ? '#fff' : 'rgba(255,255,255,0.40)' }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function normalizarStr(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

// ── Componente panel de duplicados ────────────────────────────────────────────
function PanelDuplicados({ duplicadosDetalle }) {
  const [expandido, setExpandido] = useState(false);

  if (!duplicadosDetalle || duplicadosDetalle.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(251,146,60,0.25)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expandido ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#FB923C" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#FDBA74', margin: 0 }}>
              {duplicadosDetalle.length} edificio(s) duplicado(s) omitidos
            </p>
            <p style={{ fontSize: 10, color: 'rgba(251,191,54,0.60)', margin: 0, marginTop: 2 }}>
              Ya existen en la plataforma con nombres o direcciones similares — no se crearon duplicados.
            </p>
          </div>
        </div>
        <button onClick={() => setExpandido(v => !v)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          {expandido ? '▲' : '▼'}
        </button>
      </div>

      {expandido && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {duplicadosDetalle.map((d, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '8px 10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#FDBA74', margin: 0 }}>
                    🔁 {d.nombre}
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', margin: '2px 0' }}>
                    {d.direccion}{d.direccion && d.ciudad ? ' · ' : ''}{d.ciudad} · {d.nivel_dano}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)' }}>Coincide con:</span>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.60)', margin: 0 }}>
                    {d.coincideCon?.nombre || '—'}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', margin: 0 }}>
                    {d.coincideCon?.creado ? new Date(d.coincideCon.creado).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SubidaMasivaEdificios() {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const cargarPreview = async () => {
    if (!archivo) return;
    setCargando(true);
    setError('');
    setPreview(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      const resp = await base44.functions.invoke('indexarEdificiosMasivo', { file_url, solo_parsear: true });
      if (resp.data?.error) throw new Error(resp.data.error);
      setPreview({
        edificios: resp.data.edificios || [],
        duplicados: resp.data.duplicados || 0,
        duplicadosDetalle: resp.data.duplicados_detalle || [],
        unicos: resp.data.unicos || 0,
        total: resp.data.total || 0,
      });
    } catch (e) {
      setError(e.message || 'Error al procesar el archivo');
    }
    setCargando(false);
  };

  const confirmarSubida = async () => {
    if (!archivo || !preview) return;
    setProcesando(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      const resp = await base44.functions.invoke('indexarEdificiosMasivo', { file_url, solo_parsear: false });
      if (resp.data?.error) throw new Error(resp.data.error);
      setResultado(resp.data);
      setPreview(null);
      setArchivo(null);
    } catch (e) {
      setError(e.message || 'Error al guardar los datos');
    }
    setProcesando(false);
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileSpreadsheet size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, marginBottom: 4 }}>
            Carga masiva de edificios
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
            Sube CSV o Excel con datos de edificios dañados. El sistema normaliza automáticamente y detecta duplicados por nombre y dirección.
          </p>
        </div>
      </div>

      {/* Aviso acceso restringido */}
      <div style={{ background: 'rgba(180,83,9,0.12)', border: '1px solid rgba(180,83,9,0.35)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertTriangle size={14} color="#FCD34D" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: '#FCD34D', margin: 0, lineHeight: 1.5 }}>
          <strong>Acceso exclusivo para administradores.</strong> Los registros nuevos se marcan como <em>carga masiva admin</em>. Los duplicados se omiten automáticamente.
        </p>
      </div>

      {/* Pasos visuales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
        {[
          { n: '1', icon: '📄', label: 'Prepara el CSV' },
          { n: '2', icon: '🔍', label: 'Detección de duplicados' },
          { n: '3', icon: '👁️', label: 'Previsualiza' },
          { n: '4', icon: '✅', label: 'Confirma y sube' },
        ].map(p => (
          <div key={p.n} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#B45309', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.n}</div>
            <span style={{ fontSize: 18 }}>{p.icon}</span>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)', margin: 0, lineHeight: 1.3 }}>{p.label}</p>
          </div>
        ))}
      </div>

      {/* Herramientas desplegables */}
      <SeccionHerramientas />

      {/* Upload */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.60)', marginBottom: 6 }}>Seleccionar archivo CSV o Excel (.csv, .xlsx)</p>
        <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={e => { setArchivo(e.target.files[0] || null); setPreview(null); setResultado(null); setError(''); }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.70)', cursor: 'pointer', boxSizing: 'border-box' }} />
      </div>

      {/* Botón preview */}
      {archivo && !preview && !resultado && (
        <button onClick={cargarPreview} disabled={cargando}
          style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: cargando ? 0.6 : 1 }}>
          {cargando ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
          {cargando ? 'Analizando archivo...' : 'Previsualizar antes de subir'}
        </button>
      )}

      {/* Preview */}
      {preview && (
        <>
          {preview.duplicados > 0 && <PanelDuplicados duplicadosDetalle={preview.duplicadosDetalle} />}

          {preview.unicos > 0 && (
            <>
              <PreviewTabla edificios={preview.edificios} duplicadosDetalle={preview.duplicadosDetalle} />

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPreview(null); setArchivo(null); }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '13px 0', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={confirmarSubida} disabled={procesando}
                  style={{ flex: 2, background: '#B45309', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: procesando ? 0.6 : 1 }}>
                  {procesando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {procesando ? 'Guardando...' : `Subir ${preview.unicos} edificio(s) nuevo(s)`}
                </button>
              </div>
            </>
          )}

          {preview.unicos === 0 && (
            <div style={{ background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <XCircle size={24} color="#FB923C" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#FDBA74', margin: 0, marginBottom: 4 }}>
                Todos los registros son duplicados
              </p>
              <p style={{ fontSize: 11, color: 'rgba(251,191,54,0.60)', margin: 0 }}>
                No hay edificios nuevos para agregar. Los {preview.total} registro(s) ya existen en la plataforma.
              </p>
              <button onClick={() => { setPreview(null); setArchivo(null); }}
                style={{ marginTop: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 20px', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
                Cargar otro archivo
              </button>
            </div>
          )}
        </>
      )}

      {/* Resultado posterior a subida */}
      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'rgba(20,83,45,0.25)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <ShieldCheck size={18} color="#86EFAC" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#86EFAC', margin: 0, marginBottom: 4 }}>
                ✅ Carga completada
              </p>
              <p style={{ fontSize: 12, color: 'rgba(134,239,172,0.80)', margin: 0 }}>
                {resultado.guardados} edificios guardados de {resultado.total} detectados.
                {resultado.duplicados > 0 && ` ${resultado.duplicados} duplicados omitidos.`}
                {resultado.errores > 0 && ` ${resultado.errores} con errores.`}
              </p>
            </div>
          </div>

          {resultado.duplicados > 0 && (
            <PanelDuplicados duplicadosDetalle={resultado.duplicados_detalle} />
          )}

          {resultado.detalles_errores?.length > 0 && (
            <div style={{ background: 'rgba(192,57,43,0.10)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>⚠️ Errores de guardado:</p>
              {resultado.detalles_errores.slice(0, 5).map((e, i) => (
                <p key={i} style={{ fontSize: 10, color: '#FCA5A5', margin: '2px 0' }}>{e.nombre}: {e.error}</p>
              ))}
            </div>
          )}

          <button onClick={() => { setResultado(null); setArchivo(null); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 0', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.60)', cursor: 'pointer' }}>
            Subir otro archivo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}
    </section>
  );
}