import { useState } from 'react';
import { Upload, FileSpreadsheet, ClipboardList, MessageSquareText, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const clean = v => (v || '').toString().trim();
const keyOf = k => clean(k).replace(/^\uFEFF/, '');
const normalizarTexto = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
const normalizarNombre = n => normalizarTexto(n).replace(/\b(N A|NA|NO SABE|DESCONOCIDO)\b/g, '').replace(/\s+/g, ' ').trim();
const normalizarCentro = c => normalizarTexto(c);
const extraerEdad = obs => (clean(obs).match(/edad reportada:\s*([^;]+)/i)?.[1] || '').toUpperCase().trim();
const huellaPersona = (centro, nombre, obs = '') => `${normalizarCentro(centro)}|${normalizarNombre(nombre)}|${extraerEdad(obs)}`;

const inferirCentro = name => name.replace(/^\w+_/, '').replace(/\.csv$/i, '').replace(/_/g, ' ').replace(/^00 BASE MAESTRA CON CENTRO$/i, '').trim();
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
const scorePersona = p => (p.reportante_contacto_privado ? 40 : 0) + (p.condicion !== 'no_identificado' ? 20 : 0) + clean(p.notas_publicas).length;

function parseCsv(text) {
  const rows = [];
  let row = [], val = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { val += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { row.push(val); val = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (val || row.length) { row.push(val); rows.push(row); }
      row = []; val = '';
      if (ch === '\r' && next === '\n') i++;
    } else val += ch;
  }
  if (val || row.length) { row.push(val); rows.push(row); }
  const headers = (rows.shift() || []).map(keyOf);
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, clean(r[i])])))
    .filter(r => r['Nombre Completo'] || r['Centro']);
}

async function bulkCreate(entity, records) {
  for (let i = 0; i < records.length; i += 400) {
    const chunk = records.slice(i, i + 400);
    if (chunk.length) await base44.entities[entity].bulkCreate(chunk);
  }
}

export default function SubidaMasivaModulo({ es }) {
  const [archivos, setArchivos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const procesar = async () => {
    if (!archivos.length) return;
    setProcesando(true);
    setResultado(null);
    setError('');

    try {
      const [centrosExistentes, personasExistentes] = await Promise.all([
        base44.entities.PuntosAyuda.list('-updated_date', 1000),
        base44.entities.PersonasEncontradas.list('-updated_date', 3000),
      ]);

      const centrosMap = new Map(centrosExistentes.map(c => [normalizarCentro(c.nombre_lugar), c]));
      const huellasExistentes = new Set(personasExistentes.map(p => huellaPersona(p.nombre_lugar || p.ubicacion_actual, p.nombre_o_descripcion, p.notas_publicas)));
      const personasMap = new Map();
      const centrosNecesarios = new Map();
      let filasLeidas = 0;
      let duplicadas = 0;

      for (const file of archivos) {
        const rows = parseCsv(await file.text());
        const centroArchivo = inferirCentro(file.name);
        filasLeidas += rows.length;

        rows.forEach(r => {
          const nombre = clean(r['Nombre Completo']);
          const centro = clean(r['Centro']) || centroArchivo;
          if (!nombre || !centro) return;

          const condicion = normalizarCondicion(r['Condición']);
          const obs = clean(r['Observaciones']);
          const key = huellaPersona(centro, nombre, obs);
          if (huellasExistentes.has(key)) { duplicadas++; return; }

          const loc = inferirCiudad(centro);
          if (!centrosMap.has(normalizarCentro(centro))) centrosNecesarios.set(normalizarCentro(centro), { nombre: centro, ...loc });

          const persona = {
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
          };

          const actual = personasMap.get(key);
          if (!actual || scorePersona(persona) > scorePersona(actual)) personasMap.set(key, persona);
          else duplicadas++;
        });
      }

      const personas = [...personasMap.values()];
      const nuevosCentros = [...centrosNecesarios.values()].map(c => ({
        tipo_lugar: inferirLugar(c.nombre),
        nombre_lugar: c.nombre,
        tipo_entidad: 'institucional',
        estado_operativo: 'recibe_personas',
        ciudad: c.ciudad,
        estado_region: c.estado_region,
        fuente: 'subida_masiva',
        nivel_verificacion: 'institucional',
        requiere_actualizacion: false,
        ultima_actualizacion: new Date().toISOString(),
        personas_actuales: personas.filter(p => normalizarCentro(p.nombre_lugar) === normalizarCentro(c.nombre)).length,
      }));

      if (nuevosCentros.length) await bulkCreate('PuntosAyuda', nuevosCentros);
      if (personas.length) await bulkCreate('PersonasEncontradas', personas);

      setResultado({ filas: filasLeidas, centros: nuevosCentros.length, personas: personas.length, duplicadas });
    } catch (err) {
      setError(es ? 'No se pudo procesar la carga. Revisa el archivo e intenta de nuevo.' : 'The upload could not be processed. Check the file and try again.');
    } finally {
      setProcesando(false);
    }
  };

  const opciones = [
    { icon: <FileSpreadsheet size={15} />, es: 'CSV por centro', en: 'CSV by center' },
    { icon: <ClipboardList size={15} />, es: 'Base maestra', en: 'Master file' },
    { icon: <MessageSquareText size={15} />, es: 'Texto convertido', en: 'Converted text' },
  ];

  return (
    <section className="mt-6 bg-white border-2 border-[#0F766E] rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center flex-shrink-0"><Upload size={18} /></div>
        <div>
          <h2 className="text-base font-black text-[#1A1F2E]">{es ? 'Subida masiva de listados' : 'Bulk list upload'}</h2>
          <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
            {es ? 'Carga CSVs de hospitales o una base maestra. Se crean centros faltantes y una sola ficha por persona.' : 'Upload hospital CSVs or a master file. Missing centers are created and one record per person is kept.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {opciones.map((op, i) => (
          <div key={i} className="bg-[#F0FAF4] border border-[#A8D8BC] rounded-xl px-2 py-2 text-center text-[#0F766E]">
            <div className="flex justify-center mb-1">{op.icon}</div>
            <p className="text-[10px] font-bold">{es ? op.es : op.en}</p>
          </div>
        ))}
      </div>

      <input type="file" accept=".csv,text/csv" multiple onChange={e => setArchivos([...e.target.files])} className="w-full text-xs border border-[#EDEBE8] rounded-xl px-3 py-2 mb-2" />

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          {es ? 'Limpia duplicados por centro, nombre y edad reportada. Los teléfonos y correos se guardan como contacto protegido.' : 'Duplicates are cleaned by center, name and reported age. Phones and emails are stored as protected contact.'}
        </p>
      </div>

      <button onClick={procesar} disabled={!archivos.length || procesando} className="w-full flex items-center justify-center gap-2 bg-[#0F766E] text-white text-sm font-black py-3 rounded-xl disabled:opacity-50">
        {procesando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {procesando ? (es ? 'Procesando...' : 'Processing...') : (es ? 'Procesar subida masiva' : 'Process bulk upload')}
      </button>

      {resultado && (
        <p className="mt-3 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex gap-2 items-start">
          <ShieldCheck size={14} className="flex-shrink-0 mt-0.5" />
          <span>{es ? `${resultado.personas} fichas creadas, ${resultado.centros} centros nuevos y ${resultado.duplicadas} duplicados omitidos.` : `${resultado.personas} records created, ${resultado.centros} new centers and ${resultado.duplicadas} duplicates skipped.`}</span>
        </p>
      )}
      {error && <p className="mt-3 text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
    </section>
  );
}