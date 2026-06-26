import { useState } from 'react';
import { useLang } from '@/lib/LangContext';
import { Check, Copy, Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

// ─── Plantillas CSV (contenido como string) ─────────────────────────────────
const CSV_PERSONAS = `nombre_completo,edad,sexo,condicion,ultima_ubicacion,ciudad,estado_region,observaciones
"María González",42,F,a_salvo,"Refugio El Pinar, Av. Bolívar","La Guaira","Vargas","Llegó el lunes en la tarde, sin lesiones"
"José Ramírez",65,M,herido_leve,"Hospital Central, piso 2","Caracas","Miranda","Fractura en brazo, en observación"
"Carlos Torres","","M",herido_grave,"UPA Los Magallanes","Maracay","Aragua","Golpe en cabeza, necesita traslado"
"","","","no_sabe","","","",""`;

const CSV_EDIFICIOS = `nombre_lugar,tipo_estructura,nivel_dano,personas_atrapadas,riesgo_gas,riesgo_electrico,riesgo_incendio,direccion,ciudad,estado_region,descripcion
"Edificio Las Torres",edificio_residencial,grave,no,false,true,false,"Av. Principal Altamira #12","Caracas","Miranda","Fachada este colapsada, cables en piso"
"Hospital El Salvavidas",hospital,moderado,no,false,false,false,"Calle 5, frente al parque","La Guaira","Vargas","Sin agua, generador activo"
"Escuela Simón Bolívar",escuela,leve,no,false,false,false,"Urb. Los Rosales","Maracaibo","Zulia","Vidrios rotos, estructura firme"`;

const CSV_CENTROS = `nombre_lugar,tipo_lugar,estado_operativo,capacidad_maxima,personas_actuales,servicios_disponibles,necesidades_urgentes,direccion,ciudad,estado_region,whatsapp,horario_apertura,horario_cierre,opera_24h
"Refugio Comunal El Pinar",refugio,abierto,200,87,"agua,alimentos,baños","medicinas,ropa","Av. Soublette, frente al mercado","La Guaira","Vargas","04120000000","08:00","20:00",false
"Centro Médico Los Andes",hospital,recibe_heridos,50,35,"atencion_medica,medicamentos","sangre,voluntarios_medicos","Calle Ayacucho #5","Mérida","Mérida","04160000000","00:00","23:59",true`;

// ─── Prompts para IA ─────────────────────────────────────────────────────────
const PROMPTS = {
  personas: {
    es: `Actúa como asistente de gestión de emergencias en Venezuela.

Tengo una lista de personas desordenada (puede venir de WhatsApp, notas o un chat). Necesito que la conviertas en una tabla CSV con estas columnas EXACTAS (en este orden):

nombre_completo, edad, sexo, condicion, ultima_ubicacion, ciudad, estado_region, observaciones

REGLAS OBLIGATORIAS:
1. Si un dato no está disponible, escribe exactamente: No especificado
2. Para el campo "condicion" usa SOLO estos valores: a_salvo / herido_leve / herido_grave / fallecido_reportado / no_sabe
3. Para "sexo" usa: M / F / No especificado
4. No inventes datos que no estén en el texto
5. Cada persona en una fila separada
6. La primera fila debe ser los nombres de las columnas
7. Usa comillas dobles en cada campo para evitar errores con comas

Devuelve SOLO la tabla CSV, sin explicaciones adicionales.

TEXTO A PROCESAR:
[PEGA AQUÍ TU LISTA DE PERSONAS]`,
    en: `Act as an emergency management assistant.

I have a disorganized list of people (from WhatsApp, notes or a chat). Convert it to a CSV table with these EXACT columns (in this order):

nombre_completo, edad, sexo, condicion, ultima_ubicacion, ciudad, estado_region, observaciones

MANDATORY RULES:
1. If a field is missing, write exactly: No especificado
2. For "condicion" use ONLY: a_salvo / herido_leve / herido_grave / fallecido_reportado / no_sabe
3. For "sexo" use: M / F / No especificado
4. Do NOT invent data not in the text
5. One person per row
6. First row must be the column names
7. Use double quotes on each field to avoid comma errors

Return ONLY the CSV table, no explanations.

TEXT TO PROCESS:
[PASTE YOUR LIST HERE]`
  },
  edificios: {
    es: `Actúa como asistente de gestión de emergencias.

Tengo información desordenada sobre edificios o estructuras dañadas (de WhatsApp, notas, reportes verbales). Conviértela en una tabla CSV con estas columnas EXACTAS:

nombre_lugar, tipo_estructura, nivel_dano, personas_atrapadas, riesgo_gas, riesgo_electrico, riesgo_incendio, direccion, ciudad, estado_region, descripcion

REGLAS OBLIGATORIAS:
1. tipo_estructura: edificio_residencial / hospital / escuela / iglesia / comercio / calle_via / puente / servicio_publico / otro
2. nivel_dano: leve / moderado / grave / critico / colapsado / no_sabe
3. personas_atrapadas: si / no / no_sabe / voces
4. riesgo_gas, riesgo_electrico, riesgo_incendio: true / false
5. Si un dato falta escribe: No especificado
6. Una estructura por fila, con comillas dobles en cada campo

Devuelve SOLO la tabla CSV.

TEXTO A PROCESAR:
[PEGA AQUÍ TU INFORMACIÓN]`,
    en: `Act as an emergency management assistant.

I have disorganized information about damaged buildings or structures. Convert it to a CSV with these EXACT columns:

nombre_lugar, tipo_estructura, nivel_dano, personas_atrapadas, riesgo_gas, riesgo_electrico, riesgo_incendio, direccion, ciudad, estado_region, descripcion

MANDATORY RULES:
1. tipo_estructura: edificio_residencial / hospital / escuela / iglesia / comercio / calle_via / puente / servicio_publico / otro
2. nivel_dano: leve / moderado / grave / critico / colapsado / no_sabe
3. personas_atrapadas: si / no / no_sabe / voces
4. riesgo_gas, riesgo_electrico, riesgo_incendio: true / false
5. Missing data: No especificado
6. One row per structure, double quotes on every field

Return ONLY the CSV table.

TEXT TO PROCESS:
[PASTE YOUR INFORMATION HERE]`
  },
  centros: {
    es: `Actúa como asistente de gestión de emergencias.

Tengo información sobre refugios, hospitales o centros de apoyo. Conviértela en una tabla CSV con estas columnas EXACTAS:

nombre_lugar, tipo_lugar, estado_operativo, capacidad_maxima, personas_actuales, servicios_disponibles, necesidades_urgentes, direccion, ciudad, estado_region, whatsapp, opera_24h

REGLAS OBLIGATORIAS:
1. tipo_lugar: refugio / hospital / comedor / punto_ayuda / iglesia / escuela / otro
2. estado_operativo: abierto / cerrado / saturado / recibe_personas / recibe_heridos / no_verificado
3. servicios_disponibles y necesidades_urgentes: lista separada por coma (ej: agua,alimentos,baños)
4. opera_24h: true / false
5. Si un dato falta: No especificado
6. Una institución por fila, comillas dobles en cada campo

Devuelve SOLO la tabla CSV.

TEXTO A PROCESAR:
[PEGA AQUÍ TU INFORMACIÓN]`,
    en: `Act as an emergency management assistant.

I have information about shelters, hospitals or support centers. Convert it to a CSV with these EXACT columns:

nombre_lugar, tipo_lugar, estado_operativo, capacidad_maxima, personas_actuales, servicios_disponibles, necesidades_urgentes, direccion, ciudad, estado_region, whatsapp, opera_24h

MANDATORY RULES:
1. tipo_lugar: refugio / hospital / comedor / punto_ayuda / iglesia / escuela / otro
2. estado_operativo: abierto / cerrado / saturado / recibe_personas / recibe_heridos / no_verificado
3. servicios_disponibles and necesidades_urgentes: comma-separated list (e.g. water,food,bathrooms)
4. opera_24h: true / false
5. Missing data: No especificado
6. One row per center, double quotes on each field

Return ONLY the CSV table.

TEXT TO PROCESS:
[PASTE YOUR INFORMATION HERE]`
  }
};

// ─── Utilidad: descargar CSV ─────────────────────────────────────────────────
function descargarCSV(contenido, nombre) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-componente: Botón copiar ────────────────────────────────────────────
function BtnCopiar({ texto, label, labelOk }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };
  return (
    <button onClick={copiar}
      className="flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl cursor-pointer transition-colors text-sm"
      style={{ background: copiado ? '#166534' : '#2563EB', color: '#fff' }}>
      {copiado ? <Check size={15} /> : <Copy size={15} />}
      {copiado ? labelOk : label}
    </button>
  );
}

// ─── Sub-componente: Tarjeta de tipo de listado ──────────────────────────────
function TarjetaTipo({ icon, title, desc, csvData, csvNombre, prompt, csvLabel, promptLabel, downloadLabel, es }) {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState('prompt'); // 'prompt' | 'csv'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1D26', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header clickable */}
      <button onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between p-4 cursor-pointer text-left"
        style={{ background: 'transparent', border: 'none' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
          </div>
        </div>
        {abierto
          ? <ChevronUp size={18} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          : <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />}
      </button>

      {abierto && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mt-4" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
            {[
              { k: 'prompt', icon: '🤖', label: es ? 'Prompt para IA' : 'AI Prompt' },
              { k: 'csv', icon: '📄', label: es ? 'Plantilla CSV' : 'CSV Template' },
            ].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className="flex-1 py-2.5 text-xs font-bold cursor-pointer transition-colors"
                style={{
                  background: tab === t.k ? '#2563EB' : 'transparent',
                  color: tab === t.k ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: 'none'
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* PROMPT */}
          {tab === 'prompt' && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.25)' }}>
                <p className="text-[11px] font-bold" style={{ color: '#93C5FD' }}>
                  {es ? '¿Cómo usar este prompt?' : 'How to use this prompt?'}
                </p>
                <ol className="text-[11px] space-y-1" style={{ color: 'rgba(147,197,253,0.80)' }}>
                  <li>1. {es ? 'Copia el prompt de abajo.' : 'Copy the prompt below.'}</li>
                  <li>2. {es ? 'Abre ChatGPT, Claude o Gemini.' : 'Open ChatGPT, Claude or Gemini.'}</li>
                  <li>3. {es ? 'Pega el prompt y reemplaza el texto marcado con tu lista.' : 'Paste and replace the marked text with your list.'}</li>
                  <li>4. {es ? 'Copia la tabla que genera la IA.' : 'Copy the table the AI generates.'}</li>
                  <li>5. {es ? 'Sube el resultado en el formulario de esta plataforma.' : 'Upload the result in this platform\'s form.'}</li>
                </ol>
              </div>
              <div className="rounded-xl p-3 overflow-auto max-h-52" style={{ background: '#0D0F14', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {prompt}
              </div>
              <BtnCopiar texto={prompt} label={promptLabel} labelOk={es ? '✅ ¡Copiado!' : '✅ Copied!'} />
            </div>
          )}

          {/* CSV */}
          {tab === 'csv' && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(20,83,45,0.25)', border: '1px solid rgba(34,197,94,0.20)' }}>
                <p className="text-[11px] font-bold" style={{ color: '#86EFAC' }}>
                  {es ? '¿Cómo usar esta plantilla?' : 'How to use this template?'}
                </p>
                <ol className="text-[11px] space-y-1" style={{ color: 'rgba(134,239,172,0.80)' }}>
                  <li>1. {es ? 'Descarga el archivo CSV.' : 'Download the CSV file.'}</li>
                  <li>2. {es ? 'Ábrelo en Excel, Google Sheets o cualquier editor de texto.' : 'Open it in Excel, Google Sheets or any text editor.'}</li>
                  <li>3. {es ? 'Llena los datos siguiendo los ejemplos de la primera fila.' : 'Fill in data following the examples in the first row.'}</li>
                  <li>4. {es ? 'Borra los ejemplos y guarda el archivo.' : 'Delete the examples and save the file.'}</li>
                  <li>5. {es ? 'Sube el archivo en el formulario de esta plataforma.' : 'Upload the file in this platform\'s form.'}</li>
                </ol>
              </div>
              <div className="rounded-xl p-3 overflow-auto max-h-36" style={{ background: '#0D0F14', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre', lineHeight: 1.5 }}>
                {csvData}
              </div>
              <button onClick={() => descargarCSV(csvData, csvNombre)}
                className="flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl cursor-pointer text-sm transition-colors"
                style={{ background: '#166534', color: '#fff' }}>
                <Download size={15} /> {downloadLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function HerramientasCarga() {
  const { lang } = useLang();
  const es = lang === 'es';

  const TIPOS = [
    {
      icon: '👤',
      title: es ? 'Lista de personas (refugio / hospital)' : 'People list (shelter / hospital)',
      desc: es ? 'Heridos, evacuados, a salvo, trasladados' : 'Injured, evacuated, safe, transferred',
      csvData: CSV_PERSONAS,
      csvNombre: 'plantilla_personas_cris.csv',
      prompt: PROMPTS.personas[es ? 'es' : 'en'],
      promptLabel: es ? '📋 Copiar prompt para IA' : '📋 Copy AI prompt',
      downloadLabel: es ? '⬇️ Descargar plantilla personas (.csv)' : '⬇️ Download people template (.csv)',
    },
    {
      icon: '🏗️',
      title: es ? 'Lista de edificios dañados' : 'Damaged buildings list',
      desc: es ? 'Estructuras, nivel de daño, riesgos, atrapados' : 'Structures, damage level, hazards, trapped',
      csvData: CSV_EDIFICIOS,
      csvNombre: 'plantilla_edificios_cris.csv',
      prompt: PROMPTS.edificios[es ? 'es' : 'en'],
      promptLabel: es ? '📋 Copiar prompt para IA' : '📋 Copy AI prompt',
      downloadLabel: es ? '⬇️ Descargar plantilla edificios (.csv)' : '⬇️ Download buildings template (.csv)',
    },
    {
      icon: '🏥',
      title: es ? 'Lista de centros de apoyo' : 'Support centers list',
      desc: es ? 'Refugios, hospitales, comedores, puntos de ayuda' : 'Shelters, hospitals, food centers, help points',
      csvData: CSV_CENTROS,
      csvNombre: 'plantilla_centros_cris.csv',
      prompt: PROMPTS.centros[es ? 'es' : 'en'],
      promptLabel: es ? '📋 Copiar prompt para IA' : '📋 Copy AI prompt',
      downloadLabel: es ? '⬇️ Descargar plantilla centros (.csv)' : '⬇️ Download centers template (.csv)',
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#13151F' }}>
      {/* Header de sección */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⚡</span>
          <h2 className="text-sm font-bold text-white">
            {es ? 'Herramientas de carga rápida' : 'Fast upload tools'}
          </h2>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {es
            ? 'Tienes información desordenada en papel, WhatsApp o notas? Usa estas herramientas para organizarla en segundos y subirla a la plataforma.'
            : 'Have disorganized info on paper, WhatsApp or notes? Use these tools to organize it in seconds and upload it to the platform.'}
        </p>
      </div>

      {/* Aviso cómo funciona */}
      <div className="mx-4 mt-4 rounded-xl p-3 flex gap-2" style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)' }}>
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#FCD34D' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(253,230,138,0.85)' }}>
          {es
            ? '¿Tienes una lista en papel o un chat de WhatsApp? Copia el texto, usa el prompt de IA para ordenarlo, y luego súbelo. Solo necesitas 3 pasos.'
            : 'Have a paper list or WhatsApp chat? Copy the text, use the AI prompt to organize it, then upload it. Just 3 steps.'}
        </p>
      </div>

      {/* Pasos visuales 1-2-3 */}
      <div className="grid grid-cols-3 gap-2 mx-4 my-4">
        {[
          { num: '1', icon: '📄', label: es ? 'Descarga la plantilla o copia el prompt' : 'Download template or copy prompt' },
          { num: '2', icon: '🤖', label: es ? 'Pega en ChatGPT o Claude y reemplaza el texto' : 'Paste in ChatGPT or Claude and replace the text' },
          { num: '3', icon: '⬆️', label: es ? 'Sube el CSV resultante en el formulario' : 'Upload the resulting CSV in the form' },
        ].map(p => (
          <div key={p.num} className="flex flex-col items-center text-center p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black mb-1.5" style={{ background: '#2563EB', color: '#fff' }}>{p.num}</div>
            <span className="text-base mb-1">{p.icon}</span>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>{p.label}</p>
          </div>
        ))}
      </div>

      {/* Tarjetas por tipo */}
      <div className="px-4 pb-4 space-y-2">
        {TIPOS.map((t, i) => (
          <TarjetaTipo key={i} {...t} es={es} />
        ))}
      </div>

      {/* Footer: links a plataforma */}
      <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[11px] font-bold mb-2" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {es ? 'Subir datos a la plataforma:' : 'Upload data to the platform:'}
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/registro-institucional', label: es ? '📋 Subir lista de personas' : '📋 Upload people list' },
            { to: '/institucional',          label: es ? '🏥 Registrar centro'        : '🏥 Register center'   },
            { to: '/edificios?tab=reportar', label: es ? '🏗️ Reportar edificio'       : '🏗️ Report building'   },
          ].map(l => (
            <a key={l.to} href={l.to}
              className="text-[11px] font-semibold px-3 py-2 rounded-lg no-underline"
              style={{ background: 'rgba(37,99,235,0.15)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.25)' }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}