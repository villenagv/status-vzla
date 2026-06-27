import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, CheckCircle, Phone, Search } from 'lucide-react';
import { useLang } from '@/lib/LangContext';
import TopBar from '@/components/svzla/TopBar';
import Footer from '@/components/svzla/Footer';

// ── Contenido de la guía ──────────────────────────────────────────────────────

const SECCIONES = [
  {
    id: 'antes',
    emoji: '🏠',
    es: '¿Qué hacer ANTES de entrar a un edificio?',
    en: 'What to do BEFORE entering a building?',
    color: '#1A5276',
    bg: '#EBF5FB',
    border: '#AED6F1',
    items: [
      {
        es: '👁️ Observa desde afuera primero',
        en: '👁️ Observe from outside first',
        desc_es: 'Antes de acercarte, examina visualmente el edificio desde una distancia segura. Busca grietas en fachada, paredes inclinadas o escombros en la entrada.',
        desc_en: 'Before approaching, visually examine the building from a safe distance. Look for cracks in the facade, leaning walls, or debris at the entrance.',
      },
      {
        es: '👃 Huele el ambiente',
        en: '👃 Smell the air',
        desc_es: 'Si detectas olor a gas (similar a huevo podrido), NO entres. Aleja a todos y llama a los bomberos inmediatamente.',
        desc_en: 'If you detect a gas smell (like rotten eggs), DO NOT enter. Move everyone away and call firefighters immediately.',
      },
      {
        es: '👂 Escucha antes de avanzar',
        en: '👂 Listen before moving',
        desc_es: 'Crujidos, sonidos de desprendimiento o ruidos inusuales indican que la estructura está cediendo. Detente y retrocede.',
        desc_en: 'Creaking, crumbling sounds, or unusual noises indicate the structure is giving way. Stop and go back.',
      },
      {
        es: '🔦 Luz y cables eléctricos',
        en: '🔦 Lights and electrical wires',
        desc_es: 'Cables caídos, postes inclinados o chispas visibles = peligro eléctrico. Mantén distancia mínima de 10 metros y no toques nada metálico.',
        desc_en: 'Fallen wires, leaning poles, or visible sparks = electrical danger. Keep a minimum distance of 10 meters and do not touch anything metal.',
      },
      {
        es: '🚪 Verifica el estado oficial',
        en: '🚪 Check the official status',
        desc_es: 'Busca el edificio en el directorio CRIS antes de entrar. Si está marcado como "NO ENTRAR", respeta la señalización.',
        desc_en: 'Search the building in the CRIS directory before entering. If it is marked "DO NOT ENTER", respect the signage.',
      },
    ],
  },
  {
    id: 'senales',
    emoji: '🚨',
    es: 'Señales de peligro inmediato',
    en: 'Signs of immediate danger',
    color: '#C0392B',
    bg: '#FDEDEC',
    border: '#F5B7B1',
    items: [
      {
        es: '💥 Grietas en forma de X o diagonal',
        en: '💥 X-shaped or diagonal cracks',
        desc_es: 'Las grietas diagonales en columnas o paredes estructurales indican daño severo. Son más graves que las grietas horizontales o verticales.',
        desc_en: 'Diagonal cracks in columns or structural walls indicate severe damage. They are more serious than horizontal or vertical cracks.',
      },
      {
        es: '🏚️ Piso inclinado o hundido',
        en: '🏚️ Slanted or sunken floor',
        desc_es: 'Si el piso no está nivelado o hay hundimientos visibles, los pilotes o cimientos pueden estar comprometidos. NO entres.',
        desc_en: 'If the floor is not level or there are visible sinkholes, the piles or foundations may be compromised. DO NOT enter.',
      },
      {
        es: '🌊 Humedad inusual o paredes mojadas',
        en: '🌊 Unusual moisture or wet walls',
        desc_es: 'Puede indicar tuberías rotas o infiltración. En combinación con daño estructural, aumenta el riesgo de colapso.',
        desc_en: 'May indicate broken pipes or infiltration. Combined with structural damage, it increases the risk of collapse.',
      },
      {
        es: '🚪 Puertas o ventanas que no cierran',
        en: '🚪 Doors or windows that do not close',
        desc_es: 'Si marcos de puertas o ventanas están deformados, la estructura del edificio se ha movido. Es señal de daño estructural.',
        desc_en: 'If door or window frames are deformed, the building structure has shifted. This is a sign of structural damage.',
      },
      {
        es: '💧 Polvo constante cayendo',
        en: '💧 Constant dust falling',
        desc_es: 'Si ves polvo o pequeños fragmentos de concreto cayendo del techo sin motivo aparente, el edificio puede estar cediendo activamente.',
        desc_en: 'If you see dust or small concrete fragments falling from the ceiling for no apparent reason, the building may be actively collapsing.',
      },
    ],
  },
  {
    id: 'semaforeo',
    emoji: '🚦',
    es: 'Semaforización: ¿Qué significa cada nivel?',
    en: 'Traffic light system: What does each level mean?',
    color: '#1A7A4A',
    bg: '#E6F5ED',
    border: '#A8D8BC',
    items: [
      {
        es: '🟢 ENTRADA AUTORIZADA',
        en: '🟢 ENTRY AUTHORIZED',
        desc_es: 'Estructura inspeccionada y declarada segura por autoridad competente. Puede haber daños estéticos menores pero la estructura es firme.',
        desc_en: 'Structure inspected and declared safe by competent authority. There may be minor cosmetic damage but the structure is solid.',
      },
      {
        es: '🟡 PRECAUCIÓN — Daño leve',
        en: '🟡 CAUTION — Minor damage',
        desc_es: 'Grietas pequeñas o daños estéticos. La estructura parece firme pero debe ser revisada por un técnico. Entrada con cuidado, mínimo tiempo adentro.',
        desc_en: 'Small cracks or cosmetic damage. The structure appears solid but must be inspected by a technician. Enter with care, minimum time inside.',
      },
      {
        es: '🟠 ENTRADA LIMITADA — Daño moderado',
        en: '🟠 LIMITED ENTRY — Moderate damage',
        desc_es: 'Daños visibles en paredes, piso o escaleras. Solo entrada para rescatistas entrenados o para recuperar documentos esenciales muy rápido.',
        desc_en: 'Visible damage to walls, floor, or stairs. Entry only for trained rescuers or to retrieve essential documents very quickly.',
      },
      {
        es: '🔴 NO ENTRAR — Daño grave o crítico',
        en: '🔴 DO NOT ENTER — Severe or critical damage',
        desc_es: 'Colapso parcial, daño estructural grave o riesgos activos (gas, electricidad, incendio). NADIE debe entrar excepto rescatistas especializados con equipo.',
        desc_en: 'Partial collapse, severe structural damage, or active risks (gas, electricity, fire). NO ONE should enter except specialized rescuers with equipment.',
      },
      {
        es: '💥 COLAPSADO — Zona de rescate activo',
        en: '💥 COLLAPSED — Active rescue zone',
        desc_es: 'Estructura derrumbada. Zona de operaciones de rescate activo. Mantente a distancia mínima de 50 metros. No obstaculices a los rescatistas.',
        desc_en: 'Structure collapsed. Active rescue operations zone. Maintain a minimum distance of 50 meters. Do not obstruct rescuers.',
      },
    ],
  },
  {
    id: 'gas',
    emoji: '💨',
    es: 'Riesgo de gas: protocolo de emergencia',
    en: 'Gas risk: emergency protocol',
    color: '#D35400',
    bg: '#FEF5E7',
    border: '#FAD7A0',
    items: [
      {
        es: '1. No enciendas nada eléctrico',
        en: '1. Do not turn on anything electrical',
        desc_es: 'Ni luces, ni interruptores, ni teléfono cerca de la fuga. Una chispa puede causar explosión.',
        desc_en: 'No lights, no switches, no phone near the leak. A spark can cause an explosion.',
      },
      {
        es: '2. Abre puertas y ventanas',
        en: '2. Open doors and windows',
        desc_es: 'Si puedes hacerlo sin tocar electricidad, ventila el espacio. Muévete rápido pero sin correr para no generar chispas estáticas.',
        desc_en: 'If you can do it without touching electricity, ventilate the space. Move quickly but do not run to avoid generating static sparks.',
      },
      {
        es: '3. Evacúa a todos inmediatamente',
        en: '3. Evacuate everyone immediately',
        desc_es: 'Saca a todas las personas del edificio y aléjalas al menos 100 metros. Nadie regresa hasta que lleguen los bomberos.',
        desc_en: 'Get everyone out of the building and move them at least 100 meters away. No one goes back until firefighters arrive.',
      },
      {
        es: '4. Llama desde afuera del edificio',
        en: '4. Call from outside the building',
        desc_es: 'Bomberos: 171 (CANTV fijo), *1 (Movilnet), 112 (Digitel), 911 (Movistar). Llama solo cuando estés a distancia segura.',
        desc_en: 'Fire: 171 (CANTV landline), *1 (Movilnet), 112 (Digitel), 911 (Movistar). Call only when at a safe distance.',
      },
      {
        es: '5. No regreses aunque "ya no huela"',
        en: '5. Do not go back even if "you can no longer smell it"',
        desc_es: 'El gas puede acumularse en zonas bajas sin ser detectado por el olfato. Solo los bomberos con equipos especiales confirman si es seguro.',
        desc_en: 'Gas can accumulate in low areas without being detectable by smell. Only firefighters with special equipment can confirm if it is safe.',
      },
    ],
  },
  {
    id: 'atrapados',
    emoji: '🆘',
    es: 'Si hay personas atrapadas',
    en: 'If there are trapped people',
    color: '#C0392B',
    bg: '#FDEDEC',
    border: '#E74C3C',
    items: [
      {
        es: '📢 Comunícate sin entrar',
        en: '📢 Communicate without entering',
        desc_es: 'Habla desde afuera en voz alta. Golpea tuberías o paredes si puedes para que la persona sepa que hay ayuda. No entres a estructuras dañadas.',
        desc_en: 'Speak loudly from outside. Bang on pipes or walls if possible so the person knows help is coming. Do not enter damaged structures.',
      },
      {
        es: '📱 Reporta ahora en CRIS',
        en: '📱 Report now in CRIS',
        desc_es: 'Abre la ficha del edificio en CRIS y selecciona "Personas atrapadas". Esto alerta a rescatistas que monitorean la plataforma.',
        desc_en: 'Open the building record in CRIS and select "Trapped people". This alerts rescuers monitoring the platform.',
      },
      {
        es: '🚒 Llama a los bomberos y da ubicación exacta',
        en: '🚒 Call firefighters and give exact location',
        desc_es: 'Da la dirección exacta, número de personas aproximado, si hay gas o fuego, y qué piso o sección del edificio.',
        desc_en: 'Give the exact address, approximate number of people, if there is gas or fire, and which floor or section of the building.',
      },
      {
        es: '🕯️ Marca la posición visible',
        en: '🕯️ Mark the visible position',
        desc_es: 'Si puedes, marca con tela, tiza u objeto visible la ubicación exacta donde está la persona atrapada para guiar a los rescatistas.',
        desc_en: 'If possible, mark with cloth, chalk, or a visible object the exact location of the trapped person to guide rescuers.',
      },
      {
        es: '⏳ No muevas escombros sin entrenamiento',
        en: '⏳ Do not move debris without training',
        desc_es: 'Mover escombros sin técnica puede causar derrumbes secundarios. Espera a los rescatistas. Tu seguridad también importa.',
        desc_en: 'Moving debris without technique can cause secondary collapses. Wait for rescuers. Your safety matters too.',
      },
    ],
  },
  {
    id: 'reportar',
    emoji: '📋',
    es: 'Cómo reportar un edificio dañado correctamente',
    en: 'How to correctly report a damaged building',
    color: '#1A5276',
    bg: '#EBF5FB',
    border: '#AED6F1',
    items: [
      {
        es: '📍 Información mínima necesaria',
        en: '📍 Minimum required information',
        desc_es: 'Para un reporte útil necesitas: dirección o referencia clara, ciudad, nivel de daño visible, y si hay personas atrapadas o riesgos activos.',
        desc_en: 'For a useful report you need: clear address or reference, city, visible damage level, and whether there are trapped people or active risks.',
      },
      {
        es: '📸 Fotos solo desde lugar seguro',
        en: '📸 Photos only from a safe location',
        desc_es: 'No te arriesgues para obtener una mejor foto. Una foto desde lejos es mejor que ninguna foto y un reportante lesionado.',
        desc_en: 'Do not take risks for a better photo. A photo from far away is better than no photo and an injured reporter.',
      },
      {
        es: '🔁 Actualiza en lugar de duplicar',
        en: '🔁 Update instead of duplicating',
        desc_es: 'Busca si el edificio ya existe en CRIS antes de crear un reporte nuevo. Es mejor agregar información a un reporte existente.',
        desc_en: 'Check if the building already exists in CRIS before creating a new report. It is better to add information to an existing report.',
      },
      {
        es: '✅ Solo reporta lo que viste',
        en: '✅ Only report what you saw',
        desc_es: 'No publiques rumores ni información de segunda mano sin confirmar. Indica si tu información es directa, te la contaron, o la viste en foto.',
        desc_en: "Do not publish rumors or unconfirmed secondhand information. Indicate whether your information is direct, told to you, or seen in a photo.",
      },
      {
        es: '📞 Escribe tu contacto (es privado)',
        en: '📞 Write your contact (it is private)',
        desc_es: 'Tu teléfono y email nunca se publican. Solo son usados si una institución necesita contactarte para verificar el reporte.',
        desc_en: 'Your phone and email are never published. They are only used if an institution needs to contact you to verify the report.',
      },
    ],
  },
];

// ── Componente de sección expandible ─────────────────────────────────────────
function SeccionGuia({ seccion, es }) {
  const [abierto, setAbierto] = useState(false);
  const [itemAbierto, setItemAbierto] = useState(null);

  return (
    <div className="rounded-2xl overflow-hidden border-2 mb-3" style={{ borderColor: seccion.border }}>
      {/* Header clickable */}
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
        style={{ background: seccion.bg }}
      >
        <span className="text-2xl flex-shrink-0">{seccion.emoji}</span>
        <p className="flex-1 text-sm font-black leading-tight" style={{ color: seccion.color }}>
          {es ? seccion.es : seccion.en}
        </p>
        <span style={{ color: seccion.color }}>
          {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Contenido */}
      {abierto && (
        <div style={{ background: '#FAFAFA' }}>
          {seccion.items.map((item, i) => (
            <div key={i} className="border-t" style={{ borderColor: seccion.border }}>
              <button
                onClick={() => setItemAbierto(itemAbierto === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white transition-colors"
              >
                <span className="text-sm font-semibold text-gray-800 flex-1">{es ? item.es : item.en}</span>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  {itemAbierto === i ? '▲' : '▼'}
                </span>
              </button>
              {itemAbierto === i && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-xl p-3 border border-gray-100">
                    {es ? item.desc_es : item.desc_en}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function GuiaEdificios() {
  const { lang } = useLang();
  const es = lang === 'es';
  const pt = lang === 'pt';
  const t = (esStr, enStr, ptStr) => pt ? (ptStr || esStr) : es ? esStr : enStr;
  const [busqueda, setBusqueda] = useState('');

  const seccionesFiltradas = SECCIONES.filter(s =>
    !busqueda.trim() ||
    (es ? s.es : s.en).toLowerCase().includes(busqueda.toLowerCase()) ||
    s.items.some(item =>
      (es ? item.es : item.en).toLowerCase().includes(busqueda.toLowerCase()) ||
      (es ? item.desc_es : item.desc_en).toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="max-w-lg mx-auto w-full px-4 py-5">

        <Link to="/edificios" className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-800 no-underline">
          <ChevronLeft size={16} /> {t('Edificios', 'Buildings', 'Edifícios')}
        </Link>

        {/* Encabezado */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            {t('Guía de seguridad', 'Safety guide', 'Guia de segurança')}
          </p>
          <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">
            🏗️ {t('Edificios dañados: qué hacer', 'Damaged buildings: what to do', 'Edifícios danificados: o que fazer')}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t(
              'Guía práctica para evaluar, reportar y actuar correctamente ante un edificio dañado. Sin cuenta. Sin tecnicismos.',
              'Practical guide to evaluate, report, and act correctly when facing a damaged building. No account. No jargon.',
              'Guia prática para avaliar, reportar e agir corretamente ante um edifício danificado. Sem conta. Sem jargão.'
            )}
          </p>
        </div>

        {/* Alerta principal */}
        <div className="flex gap-3 bg-red-50 border-2 border-red-400 rounded-2xl p-4 mb-5">
          <ShieldAlert size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-800 mb-1">
              🚫 {t('Regla número uno: NO ENTRES.', 'Rule number one: DO NOT ENTER.', 'Regra número um: NÃO ENTRE.')}
            </p>
            <p className="text-xs text-red-700 leading-relaxed">
              {t(
                'Ante la duda, no entres. Espera a Protección Civil (171), Bomberos o rescatistas autorizados. Tu vida vale más que cualquier objeto.',
                'When in doubt, do not enter. Wait for Civil Protection (171), Firefighters, or authorized rescuers. Your life is worth more than any object.',
                'Na dúvida, não entre. Aguarde Proteção Civil (171), Bombeiros ou resgatistas autorizados. Sua vida vale mais do que qualquer objeto.'
              )}
            </p>
          </div>
        </div>

        {/* Teléfonos de emergencia — siempre visibles */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            📞 {t('Llama ahora si hay emergencia activa', 'Call now if there is an active emergency', 'Ligue agora se houver emergência ativa')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[{ num: '171', op: 'CANTV' }, { num: '*1', op: 'Movilnet' }, { num: '112', op: 'Digitel' }, { num: '911', op: 'Movistar' }].map(({ num, op }) => (
              <a key={num} href={`tel:${num}`}
                className="flex flex-col items-center bg-red-600 rounded-xl py-3 no-underline">
                <span className="text-sm font-black text-white">{num}</span>
                <span className="text-[9px] text-red-200 mt-0.5">{op}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <Link to="/edificios?tab=consultar"
            className="flex flex-col items-center gap-2 bg-blue-700 text-white rounded-2xl py-4 no-underline text-center">
            <Search size={20} />
            <span className="text-xs font-black">{t('¿Es seguro mi edificio?', 'Is my building safe?', 'Meu edifício é seguro?')}</span>
          </Link>
          <Link to="/edificios?tab=reportar"
            className="flex flex-col items-center gap-2 bg-red-600 text-white rounded-2xl py-4 no-underline text-center">
            <AlertTriangle size={20} />
            <span className="text-xs font-black">{t('Reportar daño ahora', 'Report damage now', 'Reportar dano agora')}</span>
          </Link>
        </div>

        {/* Buscador de temas */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder={t('Buscar tema en la guía...', 'Search topic in the guide...', 'Buscar tema no guia...')}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs cursor-pointer">✕</button>
          )}
        </div>

        {/* Secciones de la guía */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          📖 {t('Contenido de la guía', 'Guide contents', 'Conteúdo do guia')} ({seccionesFiltradas.length})
        </p>

        {seccionesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-sm">{t('No encontramos ese tema.', 'Topic not found.', 'Tema não encontrado.')}</p>
            <button onClick={() => setBusqueda('')} className="text-sm text-blue-600 underline mt-2 cursor-pointer">
              {t('Ver toda la guía', 'View full guide', 'Ver guia completo')}
            </button>
          </div>
        ) : (
          seccionesFiltradas.map(s => <SeccionGuia key={s.id} seccion={s} es={es} />)
        )}

        {/* Resumen de semáforo visual */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            🚦 {t('Referencia rápida de semáforo', 'Quick traffic light reference', 'Referência rápida do semáforo')}
          </p>
          <div className="space-y-2">
            {[
              { icon: '🟢', label: t('ENTRADA AUTORIZADA', 'ENTRY AUTHORIZED', 'ENTRADA AUTORIZADA'), desc: t('Estructura segura verificada', 'Verified safe structure', 'Estrutura segura verificada'), color: '#16a34a', bg: '#f0fdf4' },
              { icon: '🟡', label: t('PRECAUCIÓN', 'CAUTION', 'CUIDADO'),                             desc: t('Daño leve — entrar con cuidado', 'Minor damage — enter carefully', 'Dano leve — entrar com cuidado'), color: '#d97706', bg: '#fffbeb' },
              { icon: '🟠', label: t('ENTRADA LIMITADA', 'LIMITED ENTRY', 'ENTRADA LIMITADA'),        desc: t('Solo rescatistas o urgencia extrema', 'Only rescuers or extreme emergency', 'Somente resgatistas ou urgência extrema'), color: '#ea580c', bg: '#fff7ed' },
              { icon: '🔴', label: t('NO ENTRAR', 'DO NOT ENTER', 'NÃO ENTRAR'),                     desc: t('Daño grave o crítico', 'Severe or critical damage', 'Dano grave ou crítico'), color: '#dc2626', bg: '#fef2f2' },
              { icon: '💥', label: t('COLAPSADO', 'COLLAPSED', 'COLAPSADO'),                         desc: t('Zona de rescate — mantén distancia', 'Rescue zone — keep distance', 'Zona de resgate — mantenha distância'), color: '#4A0E0E', bg: '#fcecec' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: item.bg }}>
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-black" style={{ color: item.color }}>{item.label}</p>
                  <p className="text-[10px] text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-2">
          <p className="text-xs font-bold text-white mb-3">
            {t('¿Tienes información sobre un edificio?', 'Do you have info about a building?', 'Tem informações sobre um edifício?')}
          </p>
          <Link to="/edificios" className="flex items-center justify-between bg-white text-gray-900 rounded-xl px-4 py-3 no-underline">
            <span className="text-sm font-bold">📋 {t('Ver directorio de edificios', 'View building directory', 'Ver diretório de edifícios')}</span>
            <span className="text-gray-400">›</span>
          </Link>
          <Link to="/edificios?tab=reportar" className="flex items-center justify-between bg-red-600 text-white rounded-xl px-4 py-3 no-underline">
            <span className="text-sm font-bold">🚨 {t('Reportar edificio dañado', 'Report damaged building', 'Reportar edifício danificado')}</span>
            <span className="text-red-200">›</span>
          </Link>
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          {t(
            'Esta guía es informativa y no sustituye a las instrucciones de autoridades locales. Siempre sigue las indicaciones de Protección Civil, Bomberos y rescatistas profesionales.',
            'This guide is informational and does not replace instructions from local authorities. Always follow the instructions of Civil Protection, Firefighters, and professional rescuers.',
            'Este guia é informativo e não substitui as instruções das autoridades locais. Sempre siga as instruções da Proteção Civil, Bombeiros e resgatistas profissionais.'
          )}
        </p>
      </div>
      <Footer />
    </div>
  );
}