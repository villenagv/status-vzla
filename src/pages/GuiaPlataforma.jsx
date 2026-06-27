import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

const SECCIONES = [
  {
    id: 'empezar',
    emoji: '🚀',
    es: '¿Por dónde empiezo?',
    en: 'Where do I start?',
    color: '#1A1F2E',
    bg: '#F4F4F8',
    border: '#E5E7EB',
    pasos: [
      {
        es: 'Estoy en la zona afectada',
        en: 'I am in the affected area',
        desc_es: 'Ve a "Zona afectada" → reporta daños, marca que estás bien, busca centros de apoyo cerca o reporta a alguien encontrado.',
        desc_en: 'Go to "Affected area" → report damage, mark that you are safe, find nearby help centers, or report a found person.',
        link: '/zona-afectada',
        linkLabel_es: 'Ir a Zona Afectada →',
        linkLabel_en: 'Go to Affected Area →',
        color: '#C0392B',
      },
      {
        es: 'Estoy fuera y busco a alguien',
        en: 'I am outside and looking for someone',
        desc_es: 'Ve a "Buscar persona" → registra la búsqueda → el sistema notifica si alguien tiene información. Sin cuenta necesaria.',
        desc_en: 'Go to "Search person" → register the search → the system notifies you if someone has information. No account needed.',
        link: '/buscar-persona',
        linkLabel_es: 'Registrar búsqueda →',
        linkLabel_en: 'Register search →',
        color: '#6C3483',
      },
      {
        es: 'Vi o encontré a alguien',
        en: 'I saw or found someone',
        desc_es: 'Ve a "Encontré a alguien" → describe a la persona o confirma que la viste → el sistema notifica a familias que la buscan.',
        desc_en: 'Go to "I found someone" → describe the person or confirm you saw them → the system notifies families searching for them.',
        link: '/reportar-encontrado',
        linkLabel_es: 'Reportar encontrado →',
        linkLabel_en: 'Report found →',
        color: '#1A7A4A',
      },
      {
        es: 'Quiero ver el estado de un edificio',
        en: 'I want to check a building\'s status',
        desc_es: 'Ve a "Edificios" → busca por dirección o nombre → verás el nivel de daño, semáforo y si hay personas atrapadas.',
        desc_en: 'Go to "Buildings" → search by address or name → you will see the damage level, traffic light status, and if there are trapped people.',
        link: '/edificios',
        linkLabel_es: 'Ver edificios →',
        linkLabel_en: 'View buildings →',
        color: '#1A5276',
      },
    ],
  },
  {
    id: 'personas',
    emoji: '👤',
    es: 'Cómo funciona la búsqueda de personas',
    en: 'How person search works',
    color: '#6C3483',
    bg: '#F3E8FD',
    border: '#D7B8F3',
    pasos: [
      {
        es: 'Paso 1: Registra la búsqueda',
        en: 'Step 1: Register the search',
        desc_es: 'Ve a /buscar-persona y llena el formulario con el nombre, edad aproximada, última ubicación conocida y tu teléfono o email de contacto.',
        desc_en: 'Go to /buscar-persona and fill in the form with the name, approximate age, last known location, and your phone or email.',
      },
      {
        es: 'Paso 2: El sistema cruza datos',
        en: 'Step 2: The system matches data',
        desc_es: 'CRIS revisa automáticamente si hay reportes de personas encontradas, listas institucionales o registros de "Estoy aquí" que coincidan.',
        desc_en: 'CRIS automatically checks if there are reports of found people, institutional lists, or "I am here" records that match.',
      },
      {
        es: 'Paso 3: Recibes alerta si hay coincidencia',
        en: 'Step 3: You receive an alert if there is a match',
        desc_es: 'Si alguien reporta información sobre la persona buscada, recibes un email inmediato. Sin spam — solo alertas reales.',
        desc_en: 'If someone reports information about the missing person, you receive an immediate email. No spam — only real alerts.',
      },
      {
        es: 'Paso 4: Suscríbete a actualizaciones',
        en: 'Step 4: Subscribe to updates',
        desc_es: 'En la ficha de cualquier persona puedes suscribirte con tu email para recibir cada actualización del caso sin necesidad de crear una cuenta.',
        desc_en: 'On any person\'s profile you can subscribe with your email to receive every case update without needing to create an account.',
      },
      {
        es: 'Privacidad: tus datos nunca se publican',
        en: 'Privacy: your data is never published',
        desc_es: 'Tu teléfono, email y redes sociales son privados. Solo se usan para contactarte si hay una coincidencia verificada.',
        desc_en: 'Your phone, email, and social media are private. They are only used to contact you if there is a verified match.',
      },
    ],
  },
  {
    id: 'edificios_guia',
    emoji: '🏗️',
    es: 'Cómo funciona el sistema de edificios',
    en: 'How the building system works',
    color: '#C0392B',
    bg: '#FDEDEC',
    border: '#F5B7B1',
    pasos: [
      {
        es: 'Reportar un edificio dañado',
        en: 'Report a damaged building',
        desc_es: 'Ve a /edificios → tab "Reportar" → ingresa la dirección, tipo de daño, si hay personas atrapadas y fotos opcionales. Solo desde lugar seguro.',
        desc_en: 'Go to /edificios → "Report" tab → enter the address, damage type, if there are trapped people, and optional photos. Only from a safe location.',
        link: '/edificios?tab=reportar',
        linkLabel_es: 'Ir a reportar →',
        linkLabel_en: 'Go to report →',
        color: '#C0392B',
      },
      {
        es: 'Consultar si un edificio es seguro',
        en: 'Check if a building is safe',
        desc_es: 'Ve a /edificios → tab "Buscar" → escribe la dirección o nombre → verás el semáforo de daño y las últimas actualizaciones de la comunidad.',
        desc_en: 'Go to /edificios → "Search" tab → type the address or name → you will see the damage traffic light and latest community updates.',
        link: '/edificios?tab=consultar',
        linkLabel_es: 'Buscar edificio →',
        linkLabel_en: 'Search building →',
        color: '#1A5276',
      },
      {
        es: 'Actualizar información de un edificio',
        en: 'Update information about a building',
        desc_es: 'Abre la ficha del edificio → botón "Agregar actualización" → reporta cambios de estado, nuevos riesgos o la recuperación de personas.',
        desc_en: 'Open the building record → "Add update" button → report status changes, new risks, or the recovery of people.',
      },
      {
        es: 'Recibir alertas de un edificio',
        en: 'Receive alerts for a building',
        desc_es: 'En la ficha del edificio, sección "Recibir actualizaciones por email" → ingresa tu email → te avisamos si cambia el estado o hay urgencias.',
        desc_en: 'In the building record, section "Get email updates" → enter your email → we notify you if the status changes or there are emergencies.',
      },
    ],
  },
  {
    id: 'refugios',
    emoji: '🏥',
    es: 'Refugios, hospitales y centros de ayuda',
    en: 'Shelters, hospitals, and help centers',
    color: '#1A7A4A',
    bg: '#E6F5ED',
    border: '#A8D8BC',
    pasos: [
      {
        es: 'Buscar centros de ayuda cerca',
        en: 'Find nearby help centers',
        desc_es: 'Ve a /centros-apoyo → filtra por tipo (refugio, hospital, comedor, acopio) y ciudad → verás capacidad, horarios y contacto.',
        desc_en: 'Go to /centros-apoyo → filter by type (shelter, hospital, canteen, collection) and city → you will see capacity, hours, and contact.',
        link: '/centros-apoyo',
        linkLabel_es: 'Ver centros de ayuda →',
        linkLabel_en: 'View help centers →',
        color: '#1A7A4A',
      },
      {
        es: 'Registrar un centro de apoyo',
        en: 'Register a help center',
        desc_es: 'Si administras un refugio u hospital, ve a /institucional → registra el nombre, ubicación, capacidad y necesidades urgentes.',
        desc_en: 'If you manage a shelter or hospital, go to /institucional → register the name, location, capacity, and urgent needs.',
        link: '/institucional',
        linkLabel_es: 'Registrar centro →',
        linkLabel_en: 'Register center →',
        color: '#1A5276',
      },
      {
        es: 'Actualizar estado de un centro',
        en: 'Update a center\'s status',
        desc_es: 'Si ya está registrado, usa el panel institucional para actualizar si está abierto, saturado, necesita suministros o voluntarios.',
        desc_en: 'If already registered, use the institutional panel to update whether it is open, full, needs supplies, or volunteers.',
        link: '/portal-institucional',
        linkLabel_es: 'Panel institucional →',
        linkLabel_en: 'Institutional panel →',
        color: '#D4621A',
      },
    ],
  },
  {
    id: 'institucional',
    emoji: '🏛️',
    es: 'Para instituciones y voluntarios',
    en: 'For institutions and volunteers',
    color: '#1A5276',
    bg: '#EBF5FB',
    border: '#AED6F1',
    pasos: [
      {
        es: 'Subir listas masivas de personas',
        en: 'Upload bulk lists of people',
        desc_es: 'Ve a /voluntario → sección "Carga masiva" → sube CSV, Excel o pega texto desde WhatsApp. El sistema indexa automáticamente.',
        desc_en: 'Go to /voluntario → "Bulk upload" section → upload CSV, Excel, or paste text from WhatsApp. The system indexes automatically.',
        link: '/voluntario',
        linkLabel_es: 'Ir a cargas masivas →',
        linkLabel_en: 'Go to bulk uploads →',
        color: '#1A5276',
      },
      {
        es: 'Registrar personas en un refugio',
        en: 'Register people at a shelter',
        desc_es: 'Desde el panel institucional puedes registrar a cada persona presente con su condición y destino de traslado si aplica.',
        desc_en: 'From the institutional panel you can register each person present with their condition and transfer destination if applicable.',
        link: '/portal-institucional',
        linkLabel_es: 'Panel institucional →',
        linkLabel_en: 'Institutional panel →',
        color: '#1A7A4A',
      },
      {
        es: 'Notificar a familias sobre un traslado',
        en: 'Notify families about a transfer',
        desc_es: 'Al registrar un traslado, el sistema notifica automáticamente por email a familias que tengan suscripción activa para esa persona.',
        desc_en: 'When registering a transfer, the system automatically notifies by email families who have an active subscription for that person.',
      },
    ],
  },
  {
    id: 'privacidad',
    emoji: '🔒',
    es: 'Privacidad y seguridad de la información',
    en: 'Privacy and information security',
    color: '#4B5563',
    bg: '#F9FAFB',
    border: '#E5E7EB',
    pasos: [
      {
        es: 'Qué es público y qué es privado',
        en: 'What is public and what is private',
        desc_es: 'Público: nombre, edad aproximada, zona, estado del caso. Privado: teléfono, email, redes sociales, notas médicas, dirección exacta de familiares.',
        desc_en: 'Public: name, approximate age, area, case status. Private: phone, email, social media, medical notes, exact family address.',
      },
      {
        es: 'Nadie te pedirá dinero por información',
        en: 'Nobody will ask you for money for information',
        desc_es: 'CRIS no autoriza pagos, intermediarios ni rescates privados. Si alguien te pide dinero para localizar a alguien, es una estafa. Repórtalo.',
        desc_en: 'CRIS does not authorize payments, intermediaries, or private rescue fees. If someone asks you for money to locate someone, it is a scam. Report it.',
      },
      {
        es: 'Quién puede ver qué',
        en: 'Who can see what',
        desc_es: 'El público general ve: nombre y estado. Suscriptores ven: actualizaciones del caso. Solo admins ven: datos de contacto y notas privadas.',
        desc_en: 'General public sees: name and status. Subscribers see: case updates. Only admins see: contact details and private notes.',
      },
      {
        es: 'Cómo solicitar eliminar información',
        en: 'How to request removal of information',
        desc_es: 'Escribe a través de la página de contacto (/contactanos) indicando el ID del registro. Los administradores procesan solicitudes en 24 horas.',
        desc_en: 'Write through the contact page (/contactanos) with the record ID. Administrators process requests within 24 hours.',
        link: '/contactanos',
        linkLabel_es: 'Ir a contacto →',
        linkLabel_en: 'Go to contact →',
        color: '#6B7280',
      },
    ],
  },
];

function SeccionGuia({ seccion, es }) {
  const [abierto, setAbierto] = useState(false);
  const [pasoAbierto, setPasoAbierto] = useState(null);

  return (
    <div className="rounded-2xl overflow-hidden border mb-3" style={{ borderColor: seccion.border }}>
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
        style={{ background: seccion.bg }}
      >
        <span className="text-2xl flex-shrink-0">{seccion.emoji}</span>
        <p className="flex-1 text-sm font-black" style={{ color: seccion.color }}>
          {es ? seccion.es : seccion.en}
        </p>
        <span style={{ color: seccion.color }}>
          {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {abierto && (
        <div style={{ background: '#FAFAFA' }}>
          {seccion.pasos.map((paso, i) => (
            <div key={i} className="border-t border-gray-100">
              <button
                onClick={() => setPasoAbierto(pasoAbierto === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white transition-colors"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-[10px] font-black text-gray-600 flex items-center justify-center">{i + 1}</span>
                <span className="text-sm font-semibold text-gray-800 flex-1">{es ? paso.es : paso.en}</span>
                <span className="text-gray-400 text-xs">{pasoAbierto === i ? '▲' : '▼'}</span>
              </button>
              {pasoAbierto === i && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-xl p-3 border border-gray-100">
                    {es ? paso.desc_es : paso.desc_en}
                  </p>
                  {paso.link && (
                    <Link to={paso.link}
                      className="inline-block text-xs font-bold px-3 py-2 rounded-xl no-underline text-white"
                      style={{ background: paso.color || '#1A1F2E' }}>
                      {es ? paso.linkLabel_es : paso.linkLabel_en}
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GuiaPlataforma() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;
  const [busqueda, setBusqueda] = useState('');

  const seccionesFiltradas = SECCIONES.filter(s =>
    !busqueda.trim() ||
    (es ? s.es : s.en).toLowerCase().includes(busqueda.toLowerCase()) ||
    s.pasos.some(p =>
      (es ? p.es : p.en).toLowerCase().includes(busqueda.toLowerCase()) ||
      (es ? p.desc_es : p.desc_en).toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">

        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Inicio', 'Home', 'Início')}
        </Link>

        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {t('Guía de uso', 'User guide', 'Guia de uso')}
          </p>
          <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">
            📖 {t('¿Cómo usar CRIS?', 'How to use CRIS?', 'Como usar o CRIS?')}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              'Guía paso a paso de todas las funciones. Sin jerga técnica. Para emergencias reales.',
              'Step-by-step guide to all features. No tech jargon. For real emergencies.',
              'Guia passo a passo de todas as funções. Sem jargão técnico. Para emergências reais.'
            )}
          </p>
        </div>

        {/* Accesos directos por situación */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            ⚡ {t('¿En qué situación estás ahora?', 'What is your situation right now?', 'Qual é a sua situação agora?')}
          </p>
          <div className="space-y-2">
            {[
              { emoji: '🆘', label: t('Estoy en zona de emergencia', 'I am in an emergency zone', 'Estou em zona de emergência'), to: '/zona-afectada', color: '#C0392B' },
              { emoji: '🔎', label: t('Busco a alguien desaparecido', 'I am looking for a missing person', 'Estou procurando alguém desaparecido'), to: '/buscar-persona', color: '#6C3483' },
              { emoji: '🙋', label: t('Vi / encontré a alguien', 'I saw / found someone', 'Vi / encontrei alguém'), to: '/reportar-encontrado', color: '#1A7A4A' },
              { emoji: '🏗️', label: t('Quiero ver edificios dañados', 'I want to see damaged buildings', 'Quero ver edifícios danificados'), to: '/edificios', color: '#1A5276' },
            ].map((item, i) => (
              <Link key={i} to={item.to}
                className="flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
                style={{ background: item.color }}>
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-bold text-white flex-1">{item.label}</span>
                <span className="text-white opacity-60">›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={t('Buscar tema en la guía...', 'Search topic in the guide...', 'Buscar tema no guia...')}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer">✕</button>
          )}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          {t('Temas de la guía', 'Guide topics', 'Tópicos do guia')} ({seccionesFiltradas.length})
        </p>

        {seccionesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm">{t('Tema no encontrado.', 'Topic not found.', 'Tema não encontrado.')}</p>
            <button onClick={() => setBusqueda('')} className="text-sm text-blue-600 underline mt-2 cursor-pointer">
              {t('Ver toda la guía', 'View full guide', 'Ver guia completo')}
            </button>
          </div>
        ) : (
          seccionesFiltradas.map(s => <SeccionGuia key={s.id} seccion={s} es={es} />)
        )}

        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-2">
            ⚠️ {t('Aviso de seguridad', 'Safety notice', 'Aviso de segurança')}
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            {t(
              'Nunca envíes dinero a cambio de información. CRIS no autoriza pagos, rescates privados ni intermediarios. Si alguien pide dinero, es una estafa.',
              'Never send money in exchange for information. CRIS does not authorize payments, private rescues, or intermediaries. If someone asks for money, it is a scam.',
              'Nunca envie dinheiro em troca de informações. O CRIS não autoriza pagamentos, resgates privados ou intermediários. Se alguém pedir dinheiro, é uma fraude.'
            )}
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/contactanos" className="text-sm text-blue-600 underline no-underline">
            {t('¿Tienes dudas? Contáctanos →', 'Have questions? Contact us →', 'Tem dúvidas? Fale conosco →')}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}