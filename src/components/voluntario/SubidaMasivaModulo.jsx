import { useState } from 'react';
import { Upload, FileSpreadsheet, ClipboardList, MessageSquareText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const clean = v => (v || '').toString().trim();
const keyOf = k => clean(k).replace(/^\uFEFF/, '');

const inferirCentro = (name) => name.replace(/^\w+_/, '').replace(/\.csv$/i, '').replace(/_/g, ' ').replace(/^00 BASE MAESTRA CON CENTRO$/i, '').trim();
const inferirLugar = centro => centro.toLowerCase().includes('cruz roja') ? 'ong' : 'hospital';
const inferirCiudad = centro => {
  const c = centro.toLowerCase();
  if (c.includes('la guaira')) return { ciudad: 'La Guaira', estado_region: 'La Guaira' };
  if (c.includes('los teques')) return { ciudad: 'Los Teques', estado_region: 'Miranda' };
  return { ciudad: 'Caracas', estado_region: c.includes('el llanito') ? 'Miranda' : 'Distrito Capital' };
};
const normalizarCondicion = c => {
  const v = clean(c).toLowerCase();
  if (v.includes('fallecido')) return 'fallecido_reportado';
  if (v.includes('grave')) return 'herido_grave';
  if (v.includes('leve')) return 'herido_leve';
  if (v.includes('salvo')) return 'a_salvo';
  return 'no_identificado';
};

function parseCsv(text) {
  const rows = [];
  let row = [], val = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { val += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { row.push(val); val = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) { if (val || row.length) { row.push(val); rows.push(row); } row = []; val = ''; if (ch === '\r' && next === '\n') i++; }
    else val += ch;
  }
  if (val || row.length) { row.push(val); rows.push(row); }
  const headers = (rows.shift() || []).map(keyOf);
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, clean(r[i])])))
    .filter(r => r['Nombre Completo'] || r['Centro']);
}

async function bulkCreate(entity, records) {
  for (let i = 0; i < records.length; i += 400) {
    await base44.entities[entity].bulkCreate(records.slice(i, i + 400));
  }
}

export default function SubidaMasivaModulo({ es }) {
  const [archivos, setArchivos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const procesar = async () => {
    if (!archivos.length) return;
    setProcesando(true); setResultado(null);
    const existentes = await base44.entities.PuntosAyuda.list('-updated_date', 500);
    const centrosMap = new Map(existentes.map(c => [clean(c.nombre_lugar).toLowerCase(), c]));
    const personas = [], centrosNecesarios = new Map(), seen = new Set();

    for (const file of archivos) {
      const rows = parseCsv(await file.text());
      const centroArchivo = inferirCentro(file.name);
      rows.forEach(r => {
        const nombre = clean(r['Nombre Completo']);
        const centro = clean(r['Centro']) || centroArchivo;
        if (!nombre || !centro) return;
        const condicion = normalizarCondicion(r['Condición']);
        const obs = clean(r['Observaciones']);
        const k = `${centro}|${nombre}|${condicion}|${obs}`.toLowerCase();
        if (seen.has(k)) return;
        seen.add(k);
        const loc = inferirCiudad(centro);
        if (!centrosMap.has(centro.toLowerCase())) centrosNecesarios.set(centro.toLowerCase(), { nombre: centro, ...loc });
        personas.push({
          nombre_o_descripcion: nombre,
          condicion,
          ubicacion_actual: centro,
          tipo_lugar: inferirLugar(centro),
          nombre_lugar: centro,
          ciudad: loc.ciudad,
          estado_region: loc.estado_region,
          notas_publicas: obs,
          reportante_contacto_privado: [r['Teléfono de Contacto'] && r['Teléfono de Contacto'] !== 'N/A' ? `Tel: ${r['Teléfono de Contacto']}` : '', r['Email'] && r['Email'] !== 'N/A' ? `Email: ${r['Email']}` : ''].filter(Boolean).join(' · '),
          nivel_verificacion: 'institucional',
          fuente: 'subida_masiva_institucional',
        });
      });
    }

    const nuevosCentros = [...centrosNecesarios.values()].map(c => ({
      tipo_lugar: inferirLugar(c.nombre), nombre_lugar: c.nombre, tipo_entidad: 'institucional', estado_operativo: 'recibe_personas', ciudad: c.ciudad, estado_region: c.estado_region, fuente: 'subida_masiva', nivel_verificacion: 'institucional', requiere_actualizacion: false, ultima_actualizacion: new Date().toISOString(), personas_actuales: personas.filter(p => p.nombre_lugar === c.nombre).length,
    }));
    if (nuevosCentros.length) await bulkCreate('PuntosAyuda', nuevosCentros);
    if (personas.length) await bulkCreate('PersonasEncontradas', personas);
    setResultado({ centros: nuevosCentros.length, personas: personas.length });
    setProcesando(false);
  };

  const opciones = [
    { icon: <FileSpreadsheet size={15} />, es: 'CSV por centro', en: 'CSV by center' },
    { icon: <ClipboardList size={15} />, es: 'Base maestra', en: 'Master file' },
    { icon: <MessageSquareText size={15} />, es: 'Texto convertido', en: 'Converted text' },
  ];

  return <section className="mt-6 bg-white border-2 border-[#0F766E] rounded-2xl p-4"><div className="flex items-start gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center flex-shrink-0"><Upload size={18} /></div><div><h2 className="text-base font-black text-[#1A1F2E]">{es ? 'Subida masiva de listados' : 'Bulk list upload'}</h2><p className="text-xs text-gray-500 leading-relaxed mt-0.5">{es ? 'Carga CSVs de hospitales o una base maestra. Si el centro no existe, se crea; luego se agregan las personas como encontradas.' : 'Upload hospital CSVs or a master file. Missing centers are created, then people are added as found.'}</p></div></div><div className="grid grid-cols-3 gap-2 mb-3">{opciones.map((op, i) => <div key={i} className="bg-[#F0FAF4] border border-[#A8D8BC] rounded-xl px-2 py-2 text-center text-[#0F766E]"><div className="flex justify-center mb-1">{op.icon}</div><p className="text-[10px] font-bold">{es ? op.es : op.en}</p></div>)}</div><input type="file" accept=".csv,text/csv" multiple onChange={e => setArchivos([...e.target.files])} className="w-full text-xs border border-[#EDEBE8] rounded-xl px-3 py-2 mb-2" /><div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3"><p className="text-[11px] text-amber-800 leading-relaxed">{es ? 'Los teléfonos y correos del archivo se guardan como contacto protegido, no como dato público.' : 'Phones and emails from the file are stored as protected contact, not public data.'}</p></div><button onClick={procesar} disabled={!archivos.length || procesando} className="w-full flex items-center justify-center gap-2 bg-[#0F766E] text-white text-sm font-black py-3 rounded-xl disabled:opacity-50">{procesando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{procesando ? (es ? 'Procesando...' : 'Processing...') : (es ? 'Procesar subida masiva' : 'Process bulk upload')}</button>{resultado && <p className="mt-3 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">✅ {es ? `${resultado.centros} centros creados y ${resultado.personas} personas agregadas.` : `${resultado.centros} centers created and ${resultado.personas} people added.`}</p>}</section>;
}