import { Link } from 'react-router-dom';
import { Upload, FileSpreadsheet, ClipboardList, MessageSquareText } from 'lucide-react';

export default function SubidaMasivaModulo({ es }) {
  const opciones = [
    { icon: <FileSpreadsheet size={15} />, es: 'CSV o Excel', en: 'CSV or Excel' },
    { icon: <ClipboardList size={15} />, es: 'Tabla pegada', en: 'Pasted table' },
    { icon: <MessageSquareText size={15} />, es: 'Texto de WhatsApp', en: 'WhatsApp text' },
  ];

  return (
    <section className="mt-6 bg-white border-2 border-[#0F766E] rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center flex-shrink-0">
          <Upload size={18} />
        </div>
        <div>
          <h2 className="text-base font-black text-[#1A1F2E]">{es ? 'Subida masiva de listados' : 'Bulk list upload'}</h2>
          <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
            {es
              ? 'Usa esto para cargar listas de personas en refugios, hospitales o centros de apoyo. Revisa antes de publicar.'
              : 'Use this to upload people lists from shelters, hospitals or help centers. Review before publishing.'}
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

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
        <p className="text-[11px] text-amber-800 leading-relaxed">
          {es
            ? 'Los datos delicados deben revisarse. No publiques documentos completos, teléfonos privados ni notas médicas sensibles.'
            : 'Sensitive data must be reviewed. Do not publish full documents, private phones or sensitive medical notes.'}
        </p>
      </div>

      <Link to="/registro-institucional" className="flex items-center justify-center gap-2 bg-[#0F766E] text-white text-sm font-black py-3 rounded-xl no-underline">
        <Upload size={16} /> {es ? 'Abrir subida masiva' : 'Open bulk upload'}
      </Link>
    </section>
  );
}