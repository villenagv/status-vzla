import { useState } from 'react';
import { Camera, Loader2, Pencil, Save, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLowBw } from '@/lib/LowBwContext';
import FotosDragDrop from '@/components/svzla/FotosDragDrop';

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";

export default function ActualizarPersonaPerfil({ persona, es, onUpdated }) {
  const { lowBw } = useLowBw();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({
    edad_aprox: persona.edad_aprox || '',
    ultima_ubicacion_conocida: persona.ultima_ubicacion_conocida || '',
    ciudad: persona.ciudad || '',
    estado_region: persona.estado_region || '',
    descripcion_fisica: persona.descripcion_fisica || '',
    notas_publicas: persona.notas_publicas || '',
    contacto_nombre: persona.contacto_nombre || '',
    contacto_telefono: persona.contacto_telefono || '',
    contacto_email: persona.contacto_email || '',
    contacto_whatsapp: persona.contacto_whatsapp || '',
  });
  const [fotoUrls, setFotoUrls] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const guardar = async () => {
    const cambios = {};
    Object.entries(form).forEach(([key, value]) => {
      if (String(value || '').trim() !== String(persona[key] || '').trim()) cambios[key] = String(value || '').trim();
    });
    if (fotoUrls[0]) cambios.foto_url = fotoUrls[0];
    if (fotoUrls[1]) cambios.foto_url_2 = fotoUrls[1];
    if (Object.keys(cambios).length === 0) return setAbierto(false);

    setGuardando(true);
    await base44.entities.PersonasBuscadas.update(persona.id, cambios);
    const campos = Object.keys(cambios).filter(k => !k.startsWith('foto')).join(', ');
    const evento = {
      persona_id: persona.id,
      tipo_pista: 'otra',
      ubicacion_pista: cambios.ultima_ubicacion_conocida || persona.ultima_ubicacion_conocida || persona.ciudad || (es ? 'Ficha de persona' : 'Person record'),
      descripcion: es
        ? `Se actualizó información visible de la ficha${campos ? `: ${campos}` : ''}.`
        : `Visible record information was updated${campos ? `: ${campos}` : ''}.`,
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
        <Pencil size={14} /> {es ? 'Actualizar información, fotos y contacto' : 'Update information, photos and contact'}
      </button>
      {ok && <p className="text-xs text-green-700 text-center mt-2">✅ {es ? 'Ficha actualizada.' : 'Record updated.'}</p>}
    </div>
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-blue-900">{es ? 'Actualizar información visible' : 'Update visible information'}</h2>
          <p className="text-xs text-blue-700 mt-0.5">{es ? 'Edita edad, ubicación, descripción, fotos y contacto. Los cambios quedan registrados en la línea de tiempo.' : 'Edit age, location, description, photos and contact. Changes are recorded in the timeline.'}</p>
        </div>
        <button onClick={() => setAbierto(false)} className="text-blue-500 p-1"><X size={16} /></button>
      </div>

      <input value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} placeholder={es ? 'Edad aproximada' : 'Approximate age'} className={inputCls} />
      <input value={form.ultima_ubicacion_conocida} onChange={e => set('ultima_ubicacion_conocida', e.target.value)} placeholder={es ? 'Última ubicación conocida' : 'Last known location'} className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder={es ? 'Ciudad' : 'City'} className={inputCls} />
        <input value={form.estado_region} onChange={e => set('estado_region', e.target.value)} placeholder={es ? 'Estado / región' : 'State / region'} className={inputCls} />
      </div>
      <textarea rows={2} value={form.descripcion_fisica} onChange={e => set('descripcion_fisica', e.target.value)} placeholder={es ? 'Descripción física o señas particulares' : 'Physical description or identifying marks'} className={`${inputCls} resize-none`} />
      <textarea rows={2} value={form.notas_publicas} onChange={e => set('notas_publicas', e.target.value)} placeholder={es ? 'Información pública adicional' : 'Additional public information'} className={`${inputCls} resize-none`} />

      <div className="bg-white border border-blue-100 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-blue-900">{es ? 'Contacto visible para esta ficha' : 'Visible contact for this record'}</p>
        <input value={form.contacto_nombre} onChange={e => set('contacto_nombre', e.target.value)} placeholder={es ? 'Nombre de contacto' : 'Contact name'} className={inputCls} />
        <input value={form.contacto_telefono} onChange={e => set('contacto_telefono', e.target.value)} placeholder={es ? 'Teléfono visible para llamar' : 'Visible phone to call'} className={inputCls} />
        <input value={form.contacto_whatsapp} onChange={e => set('contacto_whatsapp', e.target.value)} placeholder="WhatsApp" className={inputCls} />
        <input type="email" value={form.contacto_email} onChange={e => set('contacto_email', e.target.value)} placeholder={es ? 'Correo visible de contacto' : 'Visible contact email'} className={inputCls} />
      </div>

      {!lowBw && (
        <div>
          <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1"><Camera size={12} /> {es ? 'Actualizar fotos opcionales (máx. 2)' : 'Update optional photos (max 2)'}</p>
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