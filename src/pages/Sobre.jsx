import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

export default function Sobre() {
  const { lang } = useLang();
  const es = lang === 'es';

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <TopBar />
      <main className="max-w-2xl mx-auto w-full px-4 py-5 flex-1">
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-[#1A1F2E]">
          <ChevronLeft size={16} /> {es ? 'Volver' : 'Go back'}
        </Link>

        <div className="bg-white border border-[#EDEBE8] rounded-2xl p-6 mb-4">
          <div className="text-4xl mb-3">📍</div>
          <h1 className="text-2xl font-black text-[#1A1F2E] mb-4">
            {es ? 'Sobre Status Venezuela — CRIS' : 'About Status Venezuela — CRIS'}
          </h1>

          {es ? (
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>Status Venezuela (CRIS)</strong> es una plataforma ciudadana de respuesta a emergencias diseñada para apoyar a comunidades afectadas por desastres naturales, sismos, inundaciones y otras crisis humanitarias en Venezuela y América Latina.
              </p>
              <p>
                La plataforma permite a cualquier persona —sin necesidad de crear una cuenta— reportar edificios dañados, buscar personas desaparecidas, encontrar refugios y centros de apoyo, y compartir información operativa en tiempo real con otras personas y organizaciones de rescate.
              </p>
              <p>
                <strong>¿Para quién es CRIS?</strong> Está diseñada para ciudadanos, familias buscando a sus seres queridos, voluntarios, ingenieros civiles, arquitectos, médicos, instituciones de rescate, hospitales, refugios y cualquier organización que necesite coordinar ayuda humanitaria de forma rápida y confiable.
              </p>
              <p>
                La plataforma funciona en modo bajo consumo de datos, pensada para personas con poca batería, mala señal o acceso limitado a internet durante una emergencia. Toda la información es bilingüe: disponible en español e inglés.
              </p>
              <p>
                <strong>¿Quién construye CRIS?</strong> Status Venezuela es desarrollado por venezolanos comprometidos con la tecnología cívica. Es una iniciativa independiente, no partidista y sin fines de lucro. No recibimos financiamiento gubernamental. Nuestro objetivo es democratizar el acceso a información humanitaria durante crisis.
              </p>
              <p>
                Si quieres colaborar, reportar errores, subir listas institucionales o simplemente tienes información que puede salvar vidas, puedes <Link to="/contactanos" className="text-blue-600 underline">contactarnos aquí</Link>.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>Status Venezuela (CRIS)</strong> is a citizen emergency response platform designed to support communities affected by natural disasters, earthquakes, floods, and other humanitarian crises in Venezuela and Latin America.
              </p>
              <p>
                The platform allows anyone — without needing to create an account — to report damaged buildings, search for missing persons, find shelters and help centers, and share real-time operational information with other people and rescue organizations.
              </p>
              <p>
                <strong>Who is CRIS for?</strong> It is built for citizens, families searching for loved ones, volunteers, civil engineers, architects, doctors, rescue institutions, hospitals, shelters, and any organization that needs to coordinate humanitarian aid quickly and reliably.
              </p>
              <p>
                The platform operates in a low-bandwidth mode, designed for people with low battery, poor signal, or limited internet access during an emergency. All information is bilingual: available in Spanish and English.
              </p>
              <p>
                <strong>Who builds CRIS?</strong> Status Venezuela is developed by Venezuelans committed to civic technology. It is an independent, non-partisan, and non-profit initiative. We do not receive government funding. Our goal is to democratize access to humanitarian information during crises.
              </p>
              <p>
                If you want to collaborate, report errors, upload institutional lists, or simply have information that can save lives, you can <Link to="/contactanos" className="text-blue-600 underline">contact us here</Link>.
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 text-center">
          <p className="text-white font-black text-base mb-1">
            {es ? 'No partidista · Sin fines de lucro' : 'Non-partisan · Non-profit'}
          </p>
          <p className="text-gray-400 text-xs">
            {es ? 'Hecho por venezolanos ♥ · statusvzla.com' : 'Made by Venezuelans ♥ · statusvzla.com'}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}