import { useState } from 'react';
import { Camera, Loader2, Pencil, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLowBw } from '@/lib/LowBwContext';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";

export default function ActualizarPersonaPerfil({ persona, es, onUpdated }) {
  const { lowBw } = useLowBw();
  const [abierto, setAbierto] = useState(false);
  const [telefono, setTelefono] = useState(persona.contacto_telefono || '');
  const [email, setEmail] = useState(persona.contacto_email || '');
  const [fotoUrls, setFotoUrls] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  const guardar = async () => {
    const cambios = {};
    if (telefono.trim() !== (persona.contacto_telefono || '')) cambios.contacto_telefono = telefono.trim();
    if (email.trim() !== (persona.contacto_email || '')) cambios.contacto_email = email.trim();
    if (fotoUrls[0]) cambios.foto_url = fotoUrls[0];
    if (fotoUrls[1]) cambios.foto_url_2 = fotoUrls[1];
    if (Object.keys(cambios).length === 0) return setAbierto(false);

    setGuardando(true);
    await base44.entities.PersonasBuscadas.update(persona.id, cambios);
    const evento = {
      persona_id: persona.id,
      tipo_pista: 'otra',
      ubicacion_pista: persona.ultima_ubicacion_conocida || persona.ciudad || (es ? 'Ficha de persona' : 'Person record'),
      descripcion: es ? 'Se actualizó la foto o información de contacto visible en la ficha.' : 'The photo or visible contact information was updated on this record.',
      created_date: new Date().toISOString(),
    };
    await base44.entities.PistasPersonas.create(evento).catch(() => {});
    onUpdated({ ...persona, ...cambios, updated_date: new Date().toISOString() }, evento);
    setOk(true);
    setAbierto(false);
    setGuardando(false);
    setTimeout(() => setOk(false), 2500);
  };

  if (!abierto) return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <button onClick={() => setAbierto(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium py-3 rounded-xl cursor-pointer">
        <Pencil size={14} /> {es ? 'Actualizar foto o contacto' : 'Update photo or contact'}
      </button>
      {ok && <p className="text-xs text-green-700 text-center mt-2">✅ {es ? 'Ficha actualizada.' : 'Record updated.'}</p>}
    </div>
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-900">{es ? 'Actualizar información visible' : 'Update visible information'}</h2>
          <p className="text-xs text-blue-700 mt-0.5">{es ? 'Agrega foto, teléfono o correo para que sepan a quién contactar si la encuentran.' : 'Add a photo, phone, or email so people know who to contact if they find them.'}</p>
        </div>
        <button onClick={() => setAbierto(false)} className="text-blue-500 p-1"><X size={16} /></button>
      </div>
      <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder={es ? 'Teléfono visible para llamar' : 'Visible phone to call'} className={inputCls} />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={es ? 'Correo visible de contacto' : 'Visible contact email'} className={inputCls} />
      {!lowBw && (
        <div>
          <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1"><Camera size={12} /> {es ? 'Nueva foto opcional (máx. 2)' : 'Optional new photo (max 2)'}</p>
          <FotosDragDrop category="personas" caseId={persona.id} caseLabel={persona.nombre_completo || 'persona'} maxFiles={2} onUploaded={setFotoUrls} disabled={guardando} />
        </div>
      )}
      <button onClick={guardar} disabled={guardando} className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50">
        {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {guardando ? (es ? 'Guardando...' : 'Saving...') : (es ? 'Guardar actualización' : 'Save update')}
      </button>
    </div>
  );
}