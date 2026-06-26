import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const PROMPT_ES = `Actúa como un asistente de datos de emergencia. A continuación te pego una lista desordenada de personas encontradas en un centro de acopio o refugio. Por favor extrae la información y organízala en una tabla con estas columnas exactas:

| Nombre Completo | Fecha de Nacimiento | Teléfono de Contacto | Email | Condición | Observaciones |

Reglas:
- Si un dato no aparece, escribe "N/A"
- Para Condición usa solo: a salvo / herido leve / herido grave / fallecido reportado / no sabe
- El formato debe ser limpio para copiarlo a una tabla
- No inventes datos que no estén en el texto
- El archivo debe estar en formato Excel (.xlsx), CSV (.csv) o texto plano (.txt)

Aquí está la lista:
[PEGA AQUÍ TU LISTADO]`;

const PROMPT_EN = `Act as an emergency data assistant. Below I paste a disorganized list of people found at a shelter or aid center. Please extract the information and organize it into a table with these exact columns:

| Full Name | Date of Birth | Contact Phone | Email | Condition | Notes |

Rules:
- If a piece of data is missing, write "N/A"
- For Condition use only: safe / minor injury / serious injury / death reported / unknown
- Format must be clean enough to copy into a table
- Do not invent data that isn't in the text
- The file must be in Excel (.xlsx), CSV (.csv) or plain text (.txt) format

Here is the list:
[PASTE YOUR LIST HERE]`;

export default function PromptCopiable({ es }) {
  const [copiado, setCopiado] = useState(false);
  const prompt = es ? PROMPT_ES : PROMPT_EN;

  const copiar = () => {
    navigator.clipboard.writeText(prompt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="bg-[#F0F4FD] border border-[#B0C4E8] rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#1A1F2E]">
            🤖 {es ? 'Prompt para ChatGPT / IA' : 'Prompt for ChatGPT / AI'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {es
              ? 'Copia este texto, pégalo en ChatGPT y agrega tu listado al final.'
              : 'Copy this text, paste it into ChatGPT and add your list at the end.'}
          </p>
        </div>
        <button
          onClick={copiar}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#2d3549] transition-colors flex-shrink-0"
        >
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          {copiado ? (es ? 'Copiado ✓' : 'Copied ✓') : (es ? 'Copiar' : 'Copy')}
        </button>
      </div>
      <pre className="text-[11px] text-gray-600 bg-white border border-[#EDEBE8] rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
        {prompt}
      </pre>
    </div>
  );
}