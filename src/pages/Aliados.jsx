import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, FileSpreadsheet, Loader2, RefreshCw, Shield, Copy, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

export default function Aliados() {
  const { lang } = useLang();
  const es = lang === 'es';
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  const promptAliados = es
    ? `Actúa como analista de datos humanitarios para una emergencia. Voy a subir o pegar un CSV de CRIS / Status Venezuela con información pública y operativa de personas, centros de ayuda, listados institucionales, edificios dañados, solicitudes y actualizaciones.

Ayúdame a leerlo y reorganizarlo de forma útil. Primero explícame qué columnas contiene y qué significa cada campo importante. Luego organiza la información en tablas claras por: 1) personas o listados, 2) centros de ayuda, 3) edificios o infraestructura, 4) alertas urgentes, 5) registros que necesitan verificación.

Prioriza zonas con más necesidad, detecta duplicados probables, marca registros incompletos, identifica centros saturados o que requieren actualización, y crea un resumen breve para coordinar ayuda. No publiques teléfonos, correos ni datos privados. Usa lenguaje simple y separa lo urgente de lo informativo.`
    : `Act as a humanitarian data analyst during an emergency. I will upload or paste a CRIS / Status Venezuela CSV with public operational information about people, help centers, institutional lists, damaged buildings, requests, and updates.

Help me read it and reorganize it in a useful way. First explain what columns it contains and what each important field means. Then organize the information into clear tables by: 1) people or lists, 2) help centers, 3) buildings or infrastructure, 4) urgent alerts, 5) records that need verification.

Prioritize areas with the highest needs, detect likely duplicates, flag incomplete records, identify saturated centers or records that need updates, and create a short coordination summary. Do not publish phone numbers, emails, or private data. Use simple language and separate urgent items from informational items.`;

  const copiarPrompt = async () => {
    await navigator.clipboard.writeText(promptAliados);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  };

  const cargarArchivo = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await base44.functions.invoke('actualizarBaseAliadosCsv', { force: false });
      setArchivo(res.data);
    } catch (err) {
      setError(es ? 'No se pudo preparar el archivo. Intenta de nuevo.' : 'The file could not be prepared. Try again.');
    }
    setCargando(false);
  };

  useEffect(() => { cargarArchivo(); }, [lang]);

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <main className="max-w-lg mx-auto w-full px-4 py-5 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <section className="bg-white border border-[#EDEBE8] rounded-2xl p-5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <FileSpreadsheet size={22} />
          </div>
          <h1 className="text-2xl font-black text-[#1A1F2E] mb-2">{es ? 'Aliados' : 'Partners'}</h1>
          <p className="text-base font-black text-[#0F766E] mb-2 leading-snug">
            {es ? 'Estamos todos juntos en la lucha por ayudar.' : 'We are all together in the fight to help.'}
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            {es
              ? 'Si necesitas la base de datos, descárgala aquí. Se actualiza automáticamente cada 6 horas con la información pública y operativa de la plataforma: personas, centros de ayuda, listados institucionales, reportes y actualizaciones.'
              : 'If you need the database, download it here. It updates automatically every 6 hours with the platform’s public operational information: people, help centers, institutional lists, reports, and updates.'}
          </p>
        </section>

        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex gap-3">
          <Shield size={18} className="text-blue-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            {es
              ? 'Por seguridad, el archivo excluye contactos privados, correos personales, teléfonos privados y notas internas.'
              : 'For safety, the file excludes private contacts, personal emails, private phone numbers, and internal notes.'}
          </p>
        </section>

        <section className="bg-white border border-[#EDEBE8] rounded-2xl p-4 mb-4">
          <h2 className="text-base font-black text-[#1A1F2E] mb-1">
            {es ? 'Dossier visual para auditoría' : 'Visual audit dossier'}
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            {es
              ? 'Archivo navegable con páginas, subpáginas, procesos, módulos, archivos principales, capturas visuales bajo demanda, checklist y notas para el auditor.'
              : 'Navigable file with pages, subpages, processes, modules, main files, on-demand visual captures, checklist, and auditor notes.'}
          </p>
          <a href="/auditoria_cris_visual.html" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#2471A3] text-white text-sm font-black py-3 rounded-xl no-underline">
            {es ? 'Abrir dossier de auditoría' : 'Open audit dossier'}
          </a>
        </section>

        <section className="bg-white border border-[#EDEBE8] rounded-2xl p-4">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> {es ? 'Preparando enlace...' : 'Preparing link...'}
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm font-semibold text-red-700 mb-3">{error}</p>
              <button onClick={cargarArchivo} className="inline-flex items-center gap-2 bg-[#1A1F2E] text-white text-sm font-bold px-4 py-2.5 rounded-xl">
                <RefreshCw size={14} /> {es ? 'Reintentar' : 'Try again'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-[#1A1F2E]">{archivo?.total_records || 0}</p>
                  <p className="text-[10px] font-semibold text-gray-500">{es ? 'Registros' : 'Records'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-[#1A1F2E]">6h</p>
                  <p className="text-[10px] font-semibold text-gray-500">{es ? 'Actualización' : 'Refresh'}</p>
                </div>
              </div>

              {archivo?.generated_at && (
                <p className="text-xs text-gray-500 mb-3">
                  {es ? 'Última actualización:' : 'Last updated:'} {new Date(archivo.generated_at).toLocaleString()}
                </p>
              )}

              <a href={archivo?.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#0F766E] text-white font-black py-4 rounded-2xl text-base no-underline">
                <Download size={18} /> {es ? 'Descargar CSV centralizado' : 'Download centralized CSV'}
              </a>
            </>
          )}
        </section>

        <section className="bg-white border border-[#EDEBE8] rounded-2xl p-4 mt-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
              <Copy size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1A1F2E]">
                {es ? 'Prompt para copiar y pegar' : 'Prompt to copy and paste'}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                {es
                  ? 'Úsalo en ChatGPT u otra herramienta para leer el CSV, organizarlo y convertirlo en tablas o resúmenes según lo que necesites.'
                  : 'Use it in ChatGPT or another tool to read the CSV, organize it, and turn it into tables or summaries as needed.'}
              </p>
            </div>
          </div>

          <textarea
            readOnly
            value={promptAliados}
            rows={10}
            className="w-full border border-[#EDEBE8] rounded-xl p-3 text-xs text-gray-700 bg-gray-50 leading-relaxed resize-none focus:outline-none"
          />

          <button onClick={copiarPrompt} className="mt-3 w-full flex items-center justify-center gap-2 bg-[#6C3483] text-white text-sm font-black py-3 rounded-xl">
            {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copiado ? (es ? 'Prompt copiado' : 'Prompt copied') : (es ? 'Copiar prompt' : 'Copy prompt')}
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}