import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, FileSpreadsheet, Loader2, RefreshCw, Shield } from 'lucide-react';
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
          <p className="text-sm text-gray-500 leading-relaxed">
            {es
              ? 'Descarga un solo archivo CSV centralizado con la información pública y operativa de la plataforma: personas, centros de ayuda, listados institucionales, reportes y actualizaciones.'
              : 'Download one centralized CSV file with the platform’s public operational information: people, help centers, institutional lists, reports, and updates.'}
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
      </main>
      <Footer />
    </div>
  );
}