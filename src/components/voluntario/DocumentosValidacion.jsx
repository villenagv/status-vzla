import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TIPOS = [
  { val: 'titulo',         es: 'Título profesional',      en: 'Professional degree' },
  { val: 'carnet',         es: 'Carnet de colegiado',     en: 'Professional license card' },
  { val: 'certificacion',  es: 'Certificación profesional', en: 'Professional certification' },
  { val: 'identificacion', es: 'Identificación',          en: 'ID document' },
  { val: 'otro',           es: 'Otro documento',          en: 'Other document' },
];

// Carga opcional de documentos de validación (título, carnet, certificación, ID, otro).
export default function DocumentosValidacion({ value = [], onChange, es }) {
  const [subiendo, setSubiendo] = useState('');

  const subir = async (tipo, file) => {
    setSubiendo(tipo);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...value.filter(d => d.tipo !== tipo), { tipo, url: file_url }]);
    } catch {}
    setSubiendo('');
  };

  const quitar = (tipo) => onChange(value.filter(d => d.tipo !== tipo));

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
        {es ? 'Documentos de validación (opcionales)' : 'Validation documents (optional)'}
      </p>
      <p className="text-xs text-gray-500 mb-2 leading-relaxed">
        {es ? 'Puedes subirlos ahora o más tarde. Aceleran la aprobación de tu perfil.'
             : 'You can upload them now or later. They speed up your profile approval.'}
      </p>
      <div className="space-y-2">
        {TIPOS.map(tp => {
          const doc = value.find(d => d.tipo === tp.val);
          return (
            <div key={tp.val} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#fff' }}>{es ? tp.es : tp.en}</span>
              {doc ? (
                <>
                  <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>✅ {es ? 'Subido' : 'Uploaded'}</span>
                  <button onClick={() => quitar(tp.val)} className="text-gray-400 hover:text-red-400 cursor-pointer">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#93C5FD', cursor: 'pointer' }}>
                  {subiendo === tp.val ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {es ? 'Subir' : 'Upload'}
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    disabled={!!subiendo}
                    onChange={e => { if (e.target.files?.[0]) subir(tp.val, e.target.files[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}