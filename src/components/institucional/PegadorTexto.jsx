import { useState } from 'react';
import { ClipboardPaste, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DialogoDuplicado from './DialogoDuplicado';

const CONDICION_MAP = {
  'a salvo': 'a_salvo', 'a_salvo': 'a_salvo', 'safe': 'a_salvo', 'bien': 'a_salvo', 'salvo': 'a_salvo',
  'herido leve': 'herido_leve', 'leve': 'herido_leve', 'minor injury': 'herido_leve',
  'herido grave': 'herido_grave', 'grave': 'herido_grave', 'serious injury': 'herido_grave',
  'fallecido': 'fallecido_reportado', 'fallecido reportado': 'fallecido_reportado', 'death reported': 'fallecido_reportado',
  'no identificado': 'no_identificado', 'unidentified': 'no_identificado',
  'no sabe': 'no_sabe', 'unknown': 'no_sabe', 'n/a': 'no_sabe',
};

function parseTexto(texto) {
  const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const personas = [];
  for (const linea of lineas) {
    // Intentar separar por tab, coma, punto y coma o |
    const partes = linea.split(/\t|,|;|\|/).map(p => p.trim());
    if (partes.length >= 1 && partes[0].length > 1) {
      const nombre = partes[0];
      const condRaw = partes[3] || partes[2] || '';
      const condicion = CONDICION_MAP[condRaw.toLowerCase()] || 'no_sabe';
      personas.push({
        nombre_completo: nombre,
        fecha_nacimiento: partes[1] || '',
        telefono_contacto: partes[2] || '',
        condicion,
        observaciones: partes[4] || partes[3] || '',
      });
    }
  }
  return personas;
}

const CONDICION_LABEL = {
  a_salvo: { es: 'A salvo', en: 'Safe', color: 'bg-green-100 text-green-700' },
  herido_leve: { es: 'Herido leve', en: 'Minor injury', color: 'bg-yellow-100 text-yellow-700' },
  herido_grave: { es: 'Herido grave', en: 'Serious injury', color: 'bg-orange-100 text-orange-700' },
  fallecido_reportado: { es: 'Fallecido', en: 'Death rep.', color: 'bg-gray-200 text-gray-600' },
  no_identificado: { es: 'No identif.', en: 'Unidentified', color: 'bg-purple-100 text-purple-700' },
  no_sabe: { es: 'No se sabe', en: 'Unknown', color: 'bg-gray-100 text-gray-500' },
};

// helpers duplicados
function normNombre(n) {
  return String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
function nombreSimilar(a, b) {
  const na = normNombre(a); const nb = normNombre(b);
  if (na === nb) return true;
  const wa = na.split(/\s+/).filter(w => w.length >= 3);
  const wb = nb.split(/\s+/).filter(w => w.length >= 3);
  return wa.filter(w => wb.includes(w)).length >= 2;
}
async function buscarDups(nombre) {
  const [enCris, enReg] = await Promise.all([
    base44.entities.PersonaCRIS.filter({}, '-created_date', 200).catch(() => []),
    base44.entities.PersonaRegistrada.filter({}, '-created_date', 200).catch(() => []),
  ]);
  return [
    ...enCris.filter(p => nombreSimilar(p.nombre, nombre) || nombreSimilar(`${p.nombre} ${p.apellido}`, nombre)),
    ...enReg.filter(p => nombreSimilar(p.nombre_completo, nombre)),
  ];
}

export default function PegadorTexto({ es, instId, instNombre, onGuardado }) {
  const [texto, setTexto] = useState('');
  const [preview, setPreview] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');
  const [colaDups, setColaDups] = useState([]);
  const [dupActual, setDupActual] = useState(null);
  const savedRef = { current: 0 };

  const generarPreview = () => {
    const parsed = parseTexto(texto);
    setPreview(parsed);
    setError(parsed.length === 0
      ? (es ? 'No se encontraron filas. Asegúrate de pegar nombres uno por línea.' : 'No rows found. Make sure names are one per line.')
      : '');
  };

  const guardar = async () => {
    if (!preview.length) return;
    setGuardando(true);
    setProgreso(0);
    let saved = 0;
    const cola = [];

    for (let i = 0; i < preview.length; i++) {
      const p = preview[i];
      let dups = [];
      try { dups = await buscarDups(p.nombre_completo); } catch {}

      if (dups.length > 0) {
        cola.push({ idx: i, persona: p, coincidencias: dups });
        setProgreso(Math.round(((i + 1) / preview.length) * 100));
        continue;
      }

      try {
        await base44.entities.PersonaRegistrada.create({
          ...p, institucion_id: instId, institucion_nombre: instNombre,
          nivel_verificacion: 'institucional', fuente: 'institucional',
        });
        saved++;
      } catch {}
      setProgreso(Math.round(((i + 1) / preview.length) * 100));
      await new Promise(r => setTimeout(r, 120));
    }

    savedRef.current = saved;
    setGuardando(false);

    if (cola.length > 0) {
      setColaDups(cola);
      setDupActual(0);
    } else {
      setOk(true);
      if (onGuardado) onGuardado(saved);
    }
  };

  const handleDecisionDup = async ({ accion, coincidenciaId }) => {
    const item = colaDups[dupActual];
    if (accion === 'nuevo') {
      try {
        await base44.entities.PersonaRegistrada.create({
          ...item.persona, institucion_id: instId, institucion_nombre: instNombre,
          nivel_verificacion: 'institucional', fuente: 'institucional',
        });
        savedRef.current++;
      } catch {}
    } else if (accion === 'mismo') {
      try {
        await base44.entities.PersonaRegistrada.update(coincidenciaId, {
          condicion: item.persona.condicion, institucion_id: instId,
          institucion_nombre: instNombre, nivel_verificacion: 'institucional',
        }).catch(async () => {
          await base44.entities.PersonaRegistrada.create({
            ...item.persona, institucion_id: instId, institucion_nombre: instNombre,
            nivel_verificacion: 'institucional', fuente: 'institucional',
          });
          savedRef.current++;
        });
        savedRef.current++;
      } catch {}
    }
    // ignorar: no hacer nada

    const sig = dupActual + 1;
    if (sig < colaDups.length) {
      setDupActual(sig);
    } else {
      setDupActual(null);
      setColaDups([]);
      setOk(true);
      if (onGuardado) onGuardado(savedRef.current);
    }
  };

  const reset = () => {
    setTexto(''); setPreview([]); setOk(false); setProgreso(0); setError('');
  };

  const itemDupActual = dupActual !== null ? colaDups[dupActual] : null;

  return (
    <div className="bg-white border border-[#EDEBE8] rounded-xl p-4 space-y-3">
      {itemDupActual && (
        <DialogoDuplicado
          persona={itemDupActual.persona}
          coincidencias={itemDupActual.coincidencias}
          es={es}
          onDecision={handleDecisionDup}
        />
      )}
      <div className="flex items-center gap-2">
        <ClipboardPaste size={16} className="text-[#6C3483]" />
        <h3 className="text-sm font-bold text-[#1A1F2E]">
          {es ? 'Opción C — Copiar y pegar lista de texto' : 'Option C — Copy and paste text list'}
        </h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {es
          ? 'Pega aquí una lista de nombres copiada desde WhatsApp, Google Sheets, Word o cualquier texto. Intentaremos extraer la información automáticamente.'
          : 'Paste a list of names copied from WhatsApp, Google Sheets, Word or any text. We will try to extract the information automatically.'}
      </p>

      <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 space-y-1">
        <p className="text-[11px] text-purple-800 font-semibold">{es ? '💡 Instrucciones:' : '💡 Instructions:'}</p>
        <p className="text-[11px] text-purple-700 leading-relaxed">
          {es
            ? 'Un nombre por línea. Si tienes más datos, sepáralos con coma o tabulación: Nombre, Fecha, Teléfono, Condición, Notas'
            : 'One name per line. If you have more data, separate with comma or tab: Name, Date, Phone, Condition, Notes'}
        </p>
        <p className="text-[11px] text-purple-600 font-medium">
          {es ? 'Ej: "Carlos Pérez, 15/03/1980, 0414-1234567, a salvo, con familia"'
               : 'E.g: "Carlos Pérez, 15/03/1980, 0414-1234567, safe, with family"'}
        </p>
      </div>

      {!ok ? (
        <>
          <textarea
            value={texto}
            onChange={e => { setTexto(e.target.value); setPreview([]); setError(''); }}
            rows={6}
            placeholder={es
              ? 'Pega aquí tu lista...\nCarlos Pérez, 15/03/1980, a salvo\nMaría González, herido leve\n...'
              : 'Paste your list here...\nCarlos Pérez, 15/03/1980, safe\nMaría González, minor injury\n...'}
            className="w-full border border-[#EDEBE8] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#6C3483] resize-none"
          />

          {texto.trim().length > 5 && preview.length === 0 && (
            <button
              onClick={generarPreview}
              className="w-full bg-[#6C3483] text-white font-bold py-3 rounded-xl text-sm"
            >
              {es ? '👁️ Previsualizar lista' : '👁️ Preview list'}
            </button>
          )}

          {error && (
            <div className="flex gap-2 bg-[#FDF1F0] border border-[#E8B4B0] rounded-xl p-3">
              <AlertCircle size={14} className="text-[#B83A52] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#B83A52]">{error}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#1A1F2E]">
                {es ? `✅ ${preview.length} personas detectadas — revisa antes de guardar:` : `✅ ${preview.length} people detected — review before saving:`}
              </p>
              <div className="border border-[#EDEBE8] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-[#EDEBE8] sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">#</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">{es ? 'Nombre' : 'Name'}</th>
                      <th className="text-left px-3 py-2 text-gray-500 font-semibold">{es ? 'Condición' : 'Condition'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEBE8]">
                    {preview.map((p, i) => {
                      const cond = CONDICION_LABEL[p.condicion] || CONDICION_LABEL.no_sabe;
                      return (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium text-[#1A1F2E]">{p.nombre_completo}</td>
                          <td className="px-3 py-1.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cond.color}`}>
                              {es ? cond.es : cond.en}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {guardando && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-xs text-[#6C3483] font-semibold flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" />
                      {es ? 'Guardando...' : 'Saving...'}
                    </p>
                    <span className="text-xs font-bold text-[#6C3483]">{progreso}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6C3483] rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
                  </div>
                </div>
              )}

              {!guardando && (
                <div className="flex gap-2">
                  <button onClick={() => { setPreview([]); }} className="flex-1 border border-[#EDEBE8] text-gray-600 text-xs font-semibold py-2.5 rounded-xl">
                    {es ? '← Editar' : '← Edit'}
                  </button>
                  <button onClick={guardar} className="flex-1 bg-[#6C3483] text-white text-xs font-bold py-2.5 rounded-xl">
                    {es ? `Guardar ${preview.length} personas` : `Save ${preview.length} people`}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
          <p className="text-2xl">🙏</p>
          <p className="text-sm font-bold text-green-800">{es ? '¡Lista guardada!' : 'List saved!'}</p>
          <p className="text-xs text-green-700">{es ? 'Información registrada correctamente.' : 'Information recorded successfully.'}</p>
          <button onClick={reset} className="text-xs text-green-600 underline cursor-pointer">{es ? 'Pegar otra lista' : 'Paste another list'}</button>
        </div>
      )}
    </div>
  );
}