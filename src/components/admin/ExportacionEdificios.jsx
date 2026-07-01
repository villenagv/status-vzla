import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, Plus, Trash2, Mail, CheckCircle2 } from 'lucide-react';

const FIJOS = ['luken.quintana@hachaymacheteve.com', 'villenagv@gmail.com'];

export default function ExportacionEdificios({ es = true }) {
  const [destinatarios, setDestinatarios] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const cargarDestinatarios = async () => {
    setCargando(true);
    try {
      const rows = await base44.entities.ExportacionDestinatarios.filter({ activo: true }, '-created_date', 100);
      setDestinatarios(rows);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargarDestinatarios(); }, []);

  const agregarEmail = async () => {
    const email = nuevoEmail.trim();
    if (!email || !email.includes('@')) return;
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.ExportacionDestinatarios.create({ email, activo: true, agregado_por: user?.email || '' });
      setNuevoEmail('');
      await cargarDestinatarios();
    } catch {
      setError(es ? 'No se pudo agregar el correo.' : 'Could not add email.');
    }
  };

  const quitarEmail = async (id) => {
    try {
      await base44.entities.ExportacionDestinatarios.delete(id);
      await cargarDestinatarios();
    } catch {}
  };

  const exportar = async () => {
    setExportando(true);
    setResultado(null);
    setError('');
    try {
      const res = await base44.functions.invoke('exportarDatosCsv', {});
      setResultado(res.data);
    } catch {
      setError(es ? 'No se pudo generar la exportación.' : 'Could not generate export.');
    }
    setExportando(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-black text-gray-900 mb-1">
          📤 {es ? 'Exportar edificios e inspecciones' : 'Export buildings & inspections'}
        </h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {es
            ? 'Genera un archivo CSV con todos los edificios reportados y sus inspecciones solicitadas o procesadas, incluyendo enlaces a fotos y al PDF de la ficha técnica. El archivo se enviará por correo a los destinatarios configurados abajo.'
            : 'Generates a CSV file with all reported buildings and their requested or processed inspections, including links to photos and the technical PDF report. The file will be emailed to the recipients configured below.'}
        </p>

        <button
          onClick={exportar}
          disabled={exportando}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60"
        >
          {exportando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exportando
            ? (es ? 'Generando y enviando...' : 'Generating and sending...')
            : (es ? 'Exportar y enviar por correo' : 'Export and send by email')}
        </button>

        {resultado && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 leading-relaxed">
              {es
                ? `Se exportaron ${resultado.total_registros} registros y se envió el enlace a ${resultado.recipients?.length || 0} correo(s).`
                : `Exported ${resultado.total_registros} records and sent the link to ${resultado.recipients?.length || 0} email(s).`}
              {' '}<a href={resultado.file_url} target="_blank" rel="noreferrer" className="underline font-bold">{es ? 'Descargar CSV' : 'Download CSV'}</a>
            </p>
          </div>
        )}
        {error && <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">{error}</div>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
          <Mail size={15} /> {es ? 'Destinatarios de las exportaciones' : 'Export recipients'}
        </h3>

        <div className="mb-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{es ? 'Correos fijos (siempre reciben copia)' : 'Fixed emails (always cc\'d)'}</p>
          {FIJOS.map(email => (
            <div key={email} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 mb-1">{email}</div>
          ))}
        </div>

        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{es ? 'Correos adicionales' : 'Additional emails'}</p>
        {cargando ? (
          <div className="py-4 text-center text-gray-400"><Loader2 size={18} className="animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-1.5 mb-3">
            {destinatarios.length === 0 && <p className="text-xs text-gray-400">{es ? 'No hay destinatarios adicionales.' : 'No additional recipients.'}</p>}
            {destinatarios.map(d => (
              <div key={d.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                <span className="text-xs text-blue-900 font-semibold">{d.email}</span>
                <button onClick={() => quitarEmail(d.id)} className="text-red-500 hover:text-red-700"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={nuevoEmail}
            onChange={e => setNuevoEmail(e.target.value)}
            placeholder={es ? 'correo@ejemplo.com' : 'email@example.com'}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') agregarEmail(); }}
          />
          <button onClick={agregarEmail} className="flex items-center gap-1 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl">
            <Plus size={14} /> {es ? 'Agregar' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}