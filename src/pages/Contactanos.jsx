import { Link } from 'react-router-dom';
import { ChevronLeft, Mail, FileSpreadsheet, MessageCircle } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const EMAIL = 'villenagv@gmail.com';

export default function Contactanos() {
  const { lang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <main className="max-w-lg mx-auto w-full px-4 py-5 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <div className="bg-white border border-[#EDEBE8] rounded-2xl p-5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <Mail size={22} />
          </div>
          <h1 className="text-2xl font-black text-[#1A1F2E] mb-2">
            {es ? 'Contáctanos' : 'Contact us'}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {es
              ? 'Si tienes información, correcciones, listados o necesitas ayuda para cargar datos, escríbenos por correo.'
              : 'If you have information, corrections, lists, or need help uploading data, email us.'}
          </p>
        </div>

        <a href={`mailto:${EMAIL}`} className="flex items-center justify-center gap-2 bg-[#1A1F2E] text-white font-black py-4 rounded-2xl text-base no-underline mb-4">
          <Mail size={18} /> {EMAIL}
        </a>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <FileSpreadsheet size={18} className="text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1">
                {es ? 'Varios archivos o listados' : 'Several files or lists'}
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                {es
                  ? 'Si tienes varios CSV, Excel, capturas o listados copiados desde WhatsApp o Google Sheets, envíalos por correo para ayudarte a cargarlos correctamente.'
                  : 'If you have several CSV, Excel files, screenshots, or lists copied from WhatsApp or Google Sheets, send them by email so we can help upload them correctly.'}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <MessageCircle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900 mb-1">
                {es ? 'Incluye contexto claro' : 'Include clear context'}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {es
                  ? 'Indica la ciudad, institución, fecha aproximada y qué tipo de información estás enviando. No compartas datos privados innecesarios.'
                  : 'Include the city, institution, approximate date, and what type of information you are sending. Do not share unnecessary private data.'}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}