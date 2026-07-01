import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';
import SeoMeta from '@/components/seo/SeoMeta';

// ── Datos de los módulos ──────────────────────────────────────────────────────
const MODULOS = [
  {
    emoji: '🚨',
    color: '#C0392B',
    bg: 'rgba(192,57,43,0.07)',
    border: 'rgba(192,57,43,0.20)',
    to: '/edificios?tab=reportar',
    es: {
      titulo: 'Reportar daños en edificios',
      desc: 'Cualquier persona puede reportar daños visibles en edificios, casas, puentes, escuelas u otras estructuras. Se puede incluir fotos, nivel de daño, riesgos de gas o electricidad, y si hay personas atrapadas.',
      pasos: [
        'Tomas una foto o llenas el formulario desde afuera del edificio.',
        'La plataforma registra el reporte públicamente.',
        'Un voluntario técnico o inspector puede hacer seguimiento.',
        'La comunidad puede confirmar o actualizar el estado en cualquier momento.',
      ],
      nota: '⚠️ No entres a estructuras dañadas. Reporta siempre desde afuera.',
      cta: 'Reportar daño',
    },
    en: {
      titulo: 'Report building damage',
      desc: 'Anyone can report visible damage to buildings, houses, bridges, schools or other structures. You can include photos, damage level, gas or electrical hazards, and whether people are trapped.',
      pasos: [
        'Take a photo or fill out the form from outside the building.',
        'The platform registers the report publicly.',
        'A technical volunteer or inspector can follow up.',
        'The community can confirm or update the status at any time.',
      ],
      nota: '⚠️ Do not enter damaged structures. Always report from outside.',
      cta: 'Report damage',
    },
    pt: {
      titulo: 'Reportar danos em edifícios',
      desc: 'Qualquer pessoa pode reportar danos visíveis em edifícios, casas, pontes, escolas ou outras estruturas. Você pode incluir fotos, nível de dano, riscos de gás ou elétricos e se há pessoas presas.',
      pasos: [
        'Tire uma foto ou preencha o formulário de fora do edifício.',
        'A plataforma registra o reporte publicamente.',
        'Um voluntário técnico ou inspetor pode fazer o acompanhamento.',
        'A comunidade pode confirmar ou atualizar o estado a qualquer momento.',
      ],
      nota: '⚠️ Não entre em estruturas danificadas. Sempre reporte de fora.',
      cta: 'Reportar dano',
    },
  },
  {
    emoji: '🔎',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.07)',
    border: 'rgba(124,58,237,0.20)',
    to: '/buscar-persona',
    es: {
      titulo: 'Buscar personas desaparecidas',
      desc: 'Si estás buscando a un familiar o conocido, puedes registrar su información en la plataforma. Cualquier ciudadano o voluntario que tenga información puede responder y ayudarte a localizarlo.',
      pasos: [
        'Describes a la persona: nombre, edad, zona, descripción física.',
        'El caso queda visible públicamente para que otros puedan ayudar.',
        'Si alguien tiene información, puede enviar una pista de forma anónima.',
        'Recibes una notificación por email cuando haya novedades.',
      ],
      nota: '🔒 Nunca envíes dinero a cambio de información. Es una estafa.',
      cta: 'Buscar persona',
    },
    en: {
      titulo: 'Search for missing people',
      desc: 'If you are looking for a family member or acquaintance, you can register their information on the platform. Any citizen or volunteer with information can respond and help you locate them.',
      pasos: [
        'Describe the person: name, age, area, physical description.',
        'The case becomes publicly visible so others can help.',
        'If someone has information, they can send a tip anonymously.',
        'You receive an email notification when there are updates.',
      ],
      nota: '🔒 Never send money in exchange for information. It is a scam.',
      cta: 'Search person',
    },
    pt: {
      titulo: 'Procurar pessoas desaparecidas',
      desc: 'Se você está procurando um familiar ou conhecido, pode registrar suas informações na plataforma. Qualquer cidadão ou voluntário com informações pode responder e ajudar a localizá-lo.',
      pasos: [
        'Descreva a pessoa: nome, idade, área, descrição física.',
        'O caso fica visível publicamente para que outros possam ajudar.',
        'Se alguém tiver informações, pode enviar uma dica anonimamente.',
        'Você recebe uma notificação por e-mail quando há novidades.',
      ],
      nota: '🔒 Nunca envie dinheiro por informações. É um golpe.',
      cta: 'Procurar pessoa',
    },
  },
  {
    emoji: '🙋',
    color: '#15803D',
    bg: 'rgba(21,128,61,0.07)',
    border: 'rgba(21,128,61,0.20)',
    to: '/reportar-encontrado',
    es: {
      titulo: 'Reportar que encontré a alguien',
      desc: 'Si encontraste, viste o tienes información sobre una persona que alguien está buscando, puedes reportarlo aquí. Esto ayuda a las familias a saber que su ser querido está a salvo.',
      pasos: [
        'Describes lo que sabes: nombre, apariencia, dónde lo viste.',
        'La plataforma cruza automáticamente con personas buscadas.',
        'Si hay coincidencia, se notifica al familiar de forma privada.',
        'Tus datos de contacto no se muestran al público.',
      ],
      nota: '✅ Tu información puede reunir a una familia.',
      cta: 'Reportar que encontré a alguien',
    },
    en: {
      titulo: 'Report that I found someone',
      desc: 'If you found, saw or have information about a person that someone is looking for, you can report it here. This helps families know their loved one is safe.',
      pasos: [
        'Describe what you know: name, appearance, where you saw them.',
        'The platform automatically cross-references with missing persons.',
        'If there is a match, the family is notified privately.',
        'Your contact details are not shown to the public.',
      ],
      nota: '✅ Your information can reunite a family.',
      cta: 'Report found person',
    },
    pt: {
      titulo: 'Reportar que encontrei alguém',
      desc: 'Se você encontrou, viu ou tem informações sobre uma pessoa que alguém está procurando, pode reportar aqui. Isso ajuda famílias a saber que seu ente querido está a salvo.',
      pasos: [
        'Descreva o que sabe: nome, aparência, onde a viu.',
        'A plataforma cruza automaticamente com pessoas procuradas.',
        'Se houver correspondência, a família é notificada de forma privada.',
        'Seus dados de contato não são mostrados ao público.',
      ],
      nota: '✅ Sua informação pode reunir uma família.',
      cta: 'Reportar que encontrei alguém',
    },
  },
  {
    emoji: '🏥',
    color: '#0E7490',
    bg: 'rgba(14,116,144,0.07)',
    border: 'rgba(14,116,144,0.20)',
    to: '/centros-apoyo',
    es: {
      titulo: 'Refugios, hospitales y centros de ayuda',
      desc: 'El directorio de puntos de apoyo te ayuda a encontrar dónde ir si necesitas refugio, atención médica, agua, comida o medicamentos. La información se actualiza en tiempo real por voluntarios e instituciones.',
      pasos: [
        'Buscas por ciudad o tipo de ayuda que necesitas.',
        'Ves la dirección, horario, capacidad disponible y servicios.',
        'Puedes llamar directamente o ver cómo llegar.',
        'Los centros pueden actualizar su estado cuando cambia la situación.',
      ],
      nota: '📍 Si conoces un centro de ayuda que no está en el mapa, agrégalo.',
      cta: 'Ver centros de apoyo',
    },
    en: {
      titulo: 'Shelters, hospitals and help centers',
      desc: 'The support points directory helps you find where to go if you need shelter, medical care, water, food or medicine. Information is updated in real time by volunteers and institutions.',
      pasos: [
        'Search by city or type of help you need.',
        'See address, hours, available capacity and services.',
        'You can call directly or see how to get there.',
        'Centers can update their status when the situation changes.',
      ],
      nota: '📍 If you know a help center not on the map, add it.',
      cta: 'View help centers',
    },
    pt: {
      titulo: 'Abrigos, hospitais e centros de ajuda',
      desc: 'O diretório de pontos de apoio ajuda você a encontrar onde ir se precisar de abrigo, atendimento médico, água, comida ou medicamentos. As informações são atualizadas em tempo real por voluntários e instituições.',
      pasos: [
        'Busque por cidade ou tipo de ajuda que você precisa.',
        'Veja endereço, horário, capacidade disponível e serviços.',
        'Você pode ligar diretamente ou ver como chegar.',
        'Os centros podem atualizar seu estado quando a situação mudar.',
      ],
      nota: '📍 Se você conhece um centro de ajuda que não está no mapa, adicione-o.',
      cta: 'Ver centros de apoio',
    },
  },
  {
    emoji: '📸',
    color: '#1D4ED8',
    bg: 'rgba(29,78,216,0.07)',
    border: 'rgba(29,78,216,0.20)',
    to: '/solicitar-inspeccion',
    es: {
      titulo: 'Solicitar inspección técnica de tu edificio',
      desc: 'Si quieres saber si tu edificio o vivienda es seguro después de un sismo u otro evento, puedes solicitar una inspección. Un voluntario técnico (ingeniero o arquitecto) la revisará remotamente con tus fotos y te dará una evaluación.',
      pasos: [
        'Tomas fotos desde afuera: fachada, grietas visibles, daños en pisos.',
        'Llenas un formulario corto describiendo lo que observas.',
        'Un especialista revisa tu caso en la cola de triaje.',
        'Recibes una evaluación con recomendaciones concretas.',
      ],
      nota: '🏗️ Este servicio es gratuito y lo realizan voluntarios verificados.',
      cta: 'Solicitar inspección',
    },
    en: {
      titulo: 'Request a technical inspection of your building',
      desc: 'If you want to know if your building or home is safe after an earthquake or other event, you can request an inspection. A technical volunteer (engineer or architect) will review it remotely with your photos and give you an assessment.',
      pasos: [
        'Take photos from outside: facade, visible cracks, floor damage.',
        'Fill out a short form describing what you observe.',
        'A specialist reviews your case in the triage queue.',
        'You receive an assessment with concrete recommendations.',
      ],
      nota: '🏗️ This service is free and carried out by verified volunteers.',
      cta: 'Request inspection',
    },
    pt: {
      titulo: 'Solicitar inspeção técnica do seu edifício',
      desc: 'Se você quer saber se seu edifício ou moradia é segura após um terremoto ou outro evento, pode solicitar uma inspeção. Um voluntário técnico (engenheiro ou arquiteto) a revisará remotamente com suas fotos e dará uma avaliação.',
      pasos: [
        'Tire fotos de fora: fachada, rachaduras visíveis, danos nos andares.',
        'Preencha um formulário curto descrevendo o que observa.',
        'Um especialista revisa seu caso na fila de triagem.',
        'Você recebe uma avaliação com recomendações concretas.',
      ],
      nota: '🏗️ Este serviço é gratuito e realizado por voluntários verificados.',
      cta: 'Solicitar inspeção',
    },
  },
  {
    emoji: '🤝',
    color: '#0F766E',
    bg: 'rgba(15,118,110,0.07)',
    border: 'rgba(15,118,110,0.20)',
    to: '/voluntario',
    es: {
      titulo: 'Ser voluntario o especialista',
      desc: 'La plataforma funciona gracias a una red de voluntarios ciudadanos, ingenieros, arquitectos, médicos y operadores de comunicaciones que dedican su tiempo a validar información y ayudar a coordinar la respuesta.',
      pasos: [
        'Te registras y describes tu perfil o especialidad.',
        'El equipo valida tu perfil si eres profesional técnico.',
        'Accedes al portal de voluntarios para gestionar casos.',
        'Puedes hacer triaje de edificios, actualizar personas o subir listas.',
      ],
      nota: '🌟 Todo voluntario actúa desde la distancia. No asumas riesgos físicos.',
      cta: 'Unirme como voluntario',
    },
    en: {
      titulo: 'Become a volunteer or specialist',
      desc: 'The platform works thanks to a network of citizen volunteers, engineers, architects, doctors and communications operators who dedicate their time to validating information and helping coordinate the response.',
      pasos: [
        'You register and describe your profile or specialty.',
        'The team validates your profile if you are a technical professional.',
        'You access the volunteer portal to manage cases.',
        'You can triage buildings, update people or upload lists.',
      ],
      nota: '🌟 All volunteers act remotely. Do not take physical risks.',
      cta: 'Join as volunteer',
    },
    pt: {
      titulo: 'Ser voluntário ou especialista',
      desc: 'A plataforma funciona graças a uma rede de voluntários cidadãos, engenheiros, arquitetos, médicos e operadores de comunicações que dedicam seu tempo a validar informações e ajudar a coordenar a resposta.',
      pasos: [
        'Você se cadastra e descreve seu perfil ou especialidade.',
        'A equipe valida seu perfil se você for um profissional técnico.',
        'Você acessa o portal de voluntários para gerenciar casos.',
        'Você pode fazer triagem de edifícios, atualizar pessoas ou enviar listas.',
      ],
      nota: '🌟 Todos os voluntários atuam à distância. Não assuma riscos físicos.',
      cta: 'Cadastrar como voluntário',
    },
  },
];

const PRINCIPIOS = [
  {
    emoji: '📵',
    es: { t: 'Sin cuenta obligatoria', d: 'Puedes reportar y consultar información sin crear una cuenta. Solo es necesaria para funciones de voluntario.' },
    en: { t: 'No account required', d: 'You can report and browse information without creating an account. Only needed for volunteer functions.' },
    pt: { t: 'Sem conta obrigatória', d: 'Você pode reportar e consultar informações sem criar uma conta. Só é necessária para funções de voluntário.' },
  },
  {
    emoji: '📶',
    es: { t: 'Funciona con poca señal', d: 'Diseñada para usarse en zonas con internet lento, poca batería o conexión intermitente.' },
    en: { t: 'Works with poor signal', d: 'Designed to be used in areas with slow internet, low battery or intermittent connection.' },
    pt: { t: 'Funciona com pouco sinal', d: 'Projetada para ser usada em áreas com internet lenta, pouca bateria ou conexão intermitente.' },
  },
  {
    emoji: '🔒',
    es: { t: 'Privacidad por defecto', d: 'Los datos de contacto nunca son públicos. Solo se muestran estados, zonas y condiciones generales.' },
    en: { t: 'Privacy by default', d: 'Contact details are never public. Only statuses, areas and general conditions are shown.' },
    pt: { t: 'Privacidade por padrão', d: 'Os dados de contato nunca são públicos. Apenas estados, zonas e condições gerais são exibidos.' },
  },
  {
    emoji: '🌐',
    es: { t: 'Trilingüe', d: 'Toda la plataforma está disponible en español, inglés y portugués.' },
    en: { t: 'Trilingual', d: 'The entire platform is available in Spanish, English and Portuguese.' },
    pt: { t: 'Trilíngue', d: 'Toda a plataforma está disponível em espanhol, inglês e português.' },
  },
  {
    emoji: '🆓',
    es: { t: 'Gratis y sin publicidad', d: 'Sin costo para los usuarios. Sin anuncios. Sin agendas políticas.' },
    en: { t: 'Free and ad-free', d: 'No cost to users. No ads. No political agendas.' },
    pt: { t: 'Gratuito e sem publicidade', d: 'Sem custo para os usuários. Sem anúncios. Sem agendas políticas.' },
  },
  {
    emoji: '🔄',
    es: { t: 'Actualización continua', d: 'Cada ficha puede ser actualizada por la comunidad. El historial nunca se borra.' },
    en: { t: 'Continuous updates', d: 'Each record can be updated by the community. The history is never deleted.' },
    pt: { t: 'Atualização contínua', d: 'Cada ficha pode ser atualizada pela comunidade. O histórico nunca é apagado.' },
  },
];

export default function ComoFunciona() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
      <SeoMeta
        title={t('Cómo funciona Status Vzla', 'How Status Vzla works', 'Como funciona o Status Vzla')}
        description={t(
          'Aprende cómo usar la plataforma de emergencias: reportar edificios, buscar personas, encontrar refugios y ser voluntario.',
          'Learn how to use the emergency platform: report buildings, search for people, find shelters and volunteer.',
          'Saiba como usar a plataforma de emergências: reportar edifícios, procurar pessoas, encontrar abrigos e ser voluntário.'
        )}
        lang={lang}
      />
      <TopBar />

      <main className="max-w-lg mx-auto w-full px-4 py-5 flex-1 flex flex-col gap-6">

        {/* Back */}
        <Link to="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Inicio', 'Home', 'Início')}
        </Link>

        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
            style={{ background: 'rgba(13,34,89,0.08)', color: '#1E40AF', border: '1px solid rgba(30,64,175,0.25)' }}>
            📍 Status Vzla
          </div>
          <h1 className="text-2xl font-black leading-tight mb-2" style={{ color: '#111827', letterSpacing: '-0.02em' }}>
            {t('¿Qué hacemos y cómo lo hacemos?', 'What we do and how we do it?', 'O que fazemos e como fazemos?')}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {t(
              'Status Vzla es una plataforma ciudadana de respuesta a emergencias. No es una app de noticias. No es un chat. Es una herramienta práctica para actuar rápido cuando ocurre una crisis: sismo, inundación, derrumbe u otro desastre.',
              'Status Vzla is a citizen emergency response platform. It is not a news app. It is not a chat. It is a practical tool to act fast when a crisis occurs: earthquake, flood, collapse or other disaster.',
              'Status Vzla é uma plataforma cidadã de resposta a emergências. Não é um aplicativo de notícias. Não é um chat. É uma ferramenta prática para agir rapidamente quando ocorre uma crise: terremoto, inundação, desabamento ou outro desastre.'
            )}
          </p>
        </div>

        {/* Principios */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
            {t('🧭 Cómo está diseñada', '🧭 How it is designed', '🧭 Como foi projetada')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PRINCIPIOS.map((p, i) => {
              const txt = pt ? (p.pt || p.es) : es ? p.es : p.en;
              return (
                <div key={i} className="rounded-xl px-3.5 py-3.5" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: 22 }}>{p.emoji}</span>
                  <p className="text-xs font-bold mt-1.5 mb-1" style={{ color: '#111827' }}>{txt.t}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#6B7280' }}>{txt.d}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Módulos */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>
            {t('⚙️ Qué puedes hacer en cada módulo', '⚙️ What you can do in each module', '⚙️ O que você pode fazer em cada módulo')}
          </p>
          <div className="flex flex-col gap-3">
            {MODULOS.map((mod, i) => {
              const txt = pt ? (mod.pt || mod.es) : es ? mod.es : mod.en;
              return (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${mod.border}`, background: '#fff' }}>
                  {/* Header del módulo */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ background: mod.bg }}>
                    <span style={{ fontSize: 24 }}>{mod.emoji}</span>
                    <p className="font-bold text-sm flex-1" style={{ color: mod.color }}>{txt.titulo}</p>
                  </div>
                  {/* Contenido */}
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{txt.desc}</p>
                    {/* Pasos */}
                    <div className="space-y-1.5">
                      {txt.pasos.map((paso, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5"
                            style={{ background: mod.color, color: '#fff' }}>
                            {j + 1}
                          </span>
                          <p className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>{paso}</p>
                        </div>
                      ))}
                    </div>
                    {/* Nota */}
                    <p className="text-xs leading-relaxed px-3 py-2 rounded-lg" style={{ background: mod.bg, color: mod.color }}>
                      {txt.nota}
                    </p>
                    {/* CTA */}
                    <Link to={mod.to} className="no-underline flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: mod.color, color: '#fff' }}>
                      {txt.cta} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Para quién es */}
        <div className="rounded-2xl px-5 py-5" style={{ background: '#111827' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>
            {t('👥 ¿Para quién es?', '👥 Who is it for?', '👥 Para quem é?')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: '👨‍👩‍👧', es: 'Familias buscando a sus seres queridos', en: 'Families searching for loved ones', pt: 'Famílias procurando seus entes queridos' },
              { emoji: '🏘️', es: 'Vecinos que ven daños en su zona', en: 'Neighbors who see damage in their area', pt: 'Vizinhos que veem danos em sua área' },
              { emoji: '⚙️', es: 'Ingenieros y arquitectos voluntarios', en: 'Volunteer engineers and architects', pt: 'Engenheiros e arquitetos voluntários' },
              { emoji: '🏥', es: 'Hospitales, refugios y centros de acopio', en: 'Hospitals, shelters and aid centers', pt: 'Hospitais, abrigos e centros de apoio' },
              { emoji: '🚒', es: 'Equipos de rescate e instituciones', en: 'Rescue teams and institutions', pt: 'Equipes de resgate e instituições' },
              { emoji: '🌍', es: 'Venezolanos en el exterior que buscan ayudar', en: 'Venezuelans abroad who want to help', pt: 'Venezuelanos no exterior que querem ajudar' },
            ].map((item, i) => {
              const label = pt ? (item.pt || item.es) : es ? item.es : item.en;
              return (
                <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
                  <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Qué NO somos */}
        <div className="rounded-2xl px-5 py-4" style={{ background: '#FEF9F0', border: '1px solid rgba(245,158,11,0.3)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#B45309' }}>
            {t('⚠️ Importante saber', '⚠️ Important to know', '⚠️ Importante saber')}
          </p>
          <ul className="space-y-1.5">
            {[
              {
                es: 'No somos Protección Civil ni un servicio de emergencias oficial. Llama al 171 si hay una emergencia activa.',
                en: 'We are not Civil Protection or an official emergency service. Call 171 if there is an active emergency.',
                pt: 'Não somos Proteção Civil nem um serviço de emergência oficial. Ligue 171 se houver uma emergência ativa.',
              },
              {
                es: 'No garantizamos que toda la información esté verificada. Siempre confirma antes de actuar.',
                en: 'We do not guarantee all information is verified. Always confirm before acting.',
                pt: 'Não garantimos que todas as informações estejam verificadas. Sempre confirme antes de agir.',
              },
              {
                es: 'No autorizamos cobros ni rescates privados. Si alguien te pide dinero, es una estafa.',
                en: 'We do not authorize fees or private rescues. If someone asks you for money, it is a scam.',
                pt: 'Não autorizamos cobranças nem resgates privados. Se alguém pedir dinheiro, é um golpe.',
              },
            ].map((item, i) => {
              const label = pt ? (item.pt || item.es) : es ? item.es : item.en;
              return (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: '#92400E' }}>
                  <span className="flex-shrink-0 mt-0.5">•</span>
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* CTAs finales */}
        <div className="flex flex-col gap-2">
          <Link to="/" className="no-underline flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: '#111827', color: '#fff' }}>
            {t('← Volver al inicio', '← Back to home', '← Voltar ao início')}
          </Link>
          <Link to="/voluntario" className="no-underline flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: '#0F766E', color: '#fff' }}>
            🤝 {t('Quiero ser voluntario', 'I want to volunteer', 'Quero ser voluntário')}
          </Link>
          <Link to="/contactanos" className="no-underline flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }}>
            ✉️ {t('Contáctanos', 'Contact us', 'Contate-nos')}
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}