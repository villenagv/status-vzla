import { useState, useMemo } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import GaleriaTecnicaInspeccion from '@/components/edificio/GaleriaTecnicaInspeccion';

/**
 * FichaAuditoriaInspeccion
 * Vista de SOLO LECTURA para el inspector: muestra TODAS las preguntas del
 * reporte original del edificio, con lo que el ciudadano llenó y resaltando
 * en AMARILLO lo que quedó en blanco o sin confirmar.
 *
 * Sirve como lista de verificación visual antes de la visita técnica.
 * No modifica datos — solo presenta la ficha completa.
 *
 * Props: reporte (ReportesDano), es (bool idioma)
 */

// Valores que se consideran "sin información" (deben resaltarse en amarillo)
const VACIOS = ['', null, undefined, 'no_sabe', 'no_confirmado', 'no_verificado', 'sin_definir', 'sin_clasificar', 'pendiente_triage'];

const esVacio = (v) => {
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'boolean') return false; // los booleanos siempre tienen valor explícito
  return VACIOS.includes(v);
};

// Diccionarios de etiquetas legibles por campo
const MAP = {
  tipo_estructura: {
    edificio_residencial: { es: 'Edificio residencial', en: 'Residential building' },
    hospital: { es: 'Hospital', en: 'Hospital' }, escuela: { es: 'Escuela', en: 'School' },
    iglesia: { es: 'Iglesia', en: 'Church' }, comercio: { es: 'Comercio', en: 'Business' },
    calle_via: { es: 'Calle / Vía', en: 'Street / Road' }, puente: { es: 'Puente', en: 'Bridge' },
    servicio_publico: { es: 'Servicio público', en: 'Public service' }, refugio: { es: 'Refugio', en: 'Shelter' },
    otro: { es: 'Otro', en: 'Other' },
  },
  nivel_dano: {
    leve: { es: '🟡 Leve', en: '🟡 Minor' }, moderado: { es: '🟠 Moderado', en: '🟠 Moderate' },
    grave: { es: '🔴 Grave', en: '🔴 Severe' }, critico: { es: '🔴 Crítico', en: '🔴 Critical' },
    colapsado: { es: '💥 Colapsado', en: '💥 Collapsed' },
  },
  estado_acceso: {
    no_entrar: { es: '🚫 No entrar', en: '🚫 Do not enter' }, solo_rescatistas: { es: 'Solo rescatistas', en: 'Rescuers only' },
    entrada_limitada: { es: 'Entrada limitada', en: 'Limited entry' }, entrada_autorizada: { es: '✅ Entrada autorizada', en: '✅ Entry authorized' },
    clausurado: { es: 'Clausurado', en: 'Closed off' },
  },
  personas_atrapadas: {
    si: { es: '🆘 Sí', en: '🆘 Yes' }, no: { es: 'No', en: 'No' }, voces: { es: '👂 Se oyen voces', en: '👂 Voices heard' },
    posible: { es: 'Posible', en: 'Possible' },
  },
  acceso_calle: {
    normal: { es: 'Normal', en: 'Normal' }, dificultad: { es: 'Con dificultad', en: 'With difficulty' },
    solo_peatonal: { es: 'Solo peatonal', en: 'Pedestrian only' }, bloqueada: { es: 'Bloqueada', en: 'Blocked' },
    insegura: { es: 'Insegura', en: 'Unsafe' },
  },
  acceso_vehiculos: {
    carros: { es: 'Carros', en: 'Cars' }, ambulancias: { es: 'Ambulancias', en: 'Ambulances' },
    camiones: { es: 'Camiones', en: 'Trucks' }, solo_motos: { es: 'Solo motos', en: 'Motorcycles only' },
    bloqueado: { es: 'Bloqueado', en: 'Blocked' },
  },
  servicio: {
    disponible: { es: '✅ Disponible', en: '✅ Available' }, no_disponible: { es: '❌ No disponible', en: '❌ Unavailable' },
    intermitente: { es: 'Intermitente', en: 'Intermittent' }, suspendido: { es: 'Suspendido', en: 'Suspended' },
    fuga_reportada: { es: '⚠️ Fuga reportada', en: '⚠️ Leak reported' },
  },
  prioridad: {
    normal: { es: 'Normal', en: 'Normal' }, alta: { es: '🟠 Alta', en: '🟠 High' }, critica: { es: '🔴 Crítica', en: '🔴 Critical' },
  },
};

const lbl = (campo, val, es) => {
  const d = MAP[campo];
  if (d && d[val]) return es ? d[val].es : d[val].en;
  return val;
};

function Campo({ label, valor, es }) {
  const vacio = esVacio(valor);
  return (
    <div className={`flex items-start justify-between gap-3 px-3 py-2 rounded-lg ${vacio ? 'bg-amber-100 border border-amber-300' : 'bg-gray-50 border border-gray-100'}`}>
      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 flex-shrink-0">
        {vacio && <AlertTriangle size={11} className="text-amber-600" />}
        {label}
      </span>
      <span className={`text-xs text-right ${vacio ? 'text-amber-700 font-semibold italic' : 'text-gray-800 font-medium'}`}>
        {vacio ? (es ? 'Sin información — verificar' : 'No info — verify') : valor}
      </span>
    </div>
  );
}

function Seccion({ titulo, campos }) {
  const incompletos = campos.filter(c => esVacio(c.raw)).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{titulo}</p>
        {incompletos > 0 && (
          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full">
            {incompletos} ⚠️
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {campos.map((c, i) => <Campo key={i} label={c.label} valor={c.valor} es={c.es} />)}
      </div>
    </div>
  );
}

export default function FichaAuditoriaInspeccion({ reporte, es }) {
  const [abierto, setAbierto] = useState(false);
  const t = (a, b) => (es ? a : b);
  const boolLbl = (v) => v ? (es ? '⚠️ Sí' : '⚠️ Yes') : (es ? 'No reportado' : 'Not reported');

  const secciones = useMemo(() => [
    {
      titulo: t('🏗️ Estructura y daño', '🏗️ Structure & damage'),
      campos: [
        { label: t('Tipo de estructura', 'Structure type'), raw: reporte.tipo_estructura, valor: lbl('tipo_estructura', reporte.tipo_estructura, es), es },
        { label: t('Nivel de daño', 'Damage level'), raw: reporte.nivel_dano, valor: lbl('nivel_dano', reporte.nivel_dano, es), es },
        { label: t('Estado de acceso', 'Access status'), raw: reporte.estado_acceso, valor: lbl('estado_acceso', reporte.estado_acceso, es), es },
        { label: t('Descripción', 'Description'), raw: reporte.descripcion, valor: reporte.descripcion, es },
      ],
    },
    {
      titulo: t('🆘 Personas y prioridad', '🆘 People & priority'),
      campos: [
        { label: t('Personas atrapadas', 'Trapped people'), raw: reporte.personas_atrapadas, valor: lbl('personas_atrapadas', reporte.personas_atrapadas, es), es },
        { label: t('Prioridad', 'Priority'), raw: reporte.prioridad, valor: lbl('prioridad', reporte.prioridad, es), es },
      ],
    },
    {
      titulo: t('⚠️ Riesgos reportados', '⚠️ Reported hazards'),
      campos: [
        { label: t('Gas', 'Gas'), raw: reporte.riesgo_gas ? 'si' : '', valor: boolLbl(reporte.riesgo_gas), es },
        { label: t('Eléctrico', 'Electrical'), raw: reporte.riesgo_electrico ? 'si' : '', valor: boolLbl(reporte.riesgo_electrico), es },
        { label: t('Incendio', 'Fire'), raw: reporte.riesgo_incendio ? 'si' : '', valor: boolLbl(reporte.riesgo_incendio), es },
        { label: t('Colapso', 'Collapse'), raw: reporte.riesgo_colapso ? 'si' : '', valor: boolLbl(reporte.riesgo_colapso), es },
      ],
    },
    {
      titulo: t('🔌 Servicios básicos', '🔌 Basic utilities'),
      campos: [
        { label: t('Electricidad', 'Electricity'), raw: reporte.electricidad, valor: lbl('servicio', reporte.electricidad, es), es },
        { label: t('Agua', 'Water'), raw: reporte.agua, valor: lbl('servicio', reporte.agua, es), es },
        { label: t('Gas', 'Gas'), raw: reporte.gas, valor: lbl('servicio', reporte.gas, es), es },
      ],
    },
    {
      titulo: t('🚗 Acceso vial', '🚗 Road access'),
      campos: [
        { label: t('Acceso a pie / calle', 'Foot / street access'), raw: reporte.acceso_calle, valor: lbl('acceso_calle', reporte.acceso_calle, es), es },
        { label: t('Acceso de vehículos', 'Vehicle access'), raw: reporte.acceso_vehiculos, valor: lbl('acceso_vehiculos', reporte.acceso_vehiculos, es), es },
        { label: t('Notas de acceso', 'Access notes'), raw: reporte.notas_acceso, valor: reporte.notas_acceso, es },
      ],
    },
    {
      titulo: t('📍 Ubicación', '📍 Location'),
      campos: [
        { label: t('Dirección', 'Address'), raw: reporte.direccion, valor: reporte.direccion, es },
        { label: t('Referencia', 'Reference'), raw: reporte.referencia, valor: reporte.referencia, es },
        { label: t('Ciudad', 'City'), raw: reporte.ciudad, valor: reporte.ciudad, es },
        { label: t('Estado / Región', 'State / Region'), raw: reporte.estado_region, valor: reporte.estado_region, es },
        { label: t('Coordenadas GPS', 'GPS coordinates'), raw: (reporte.lat && reporte.lng) ? 'ok' : '', valor: (reporte.lat && reporte.lng) ? `${reporte.lat}, ${reporte.lng}` : '', es },
      ],
    },
  ], [reporte, es]);

  const totalCampos = secciones.reduce((n, s) => n + s.campos.length, 0);
  const vacios = secciones.reduce((n, s) => n + s.campos.filter(c => esVacio(c.raw)).length, 0);
  const llenos = totalCampos - vacios;
  const pct = Math.round((llenos / totalCampos) * 100);
  const fotos = reporte.foto_urls?.length || 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setAbierto(v => !v)} className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 cursor-pointer text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-gray-700">📋 {t('Ficha completa del reporte', 'Full report record')}</p>
          <ChevronDown size={15} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </div>
        {/* Barra de completitud */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">
              {t('Información cargada', 'Loaded info')}: {llenos}/{totalCampos} ({pct}%)
            </span>
            {vacios > 0 && (
              <span className="text-[10px] font-bold text-amber-700">⚠️ {vacios} {t('en blanco', 'blank')}</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 75 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626' }} />
          </div>
        </div>
      </button>

      {abierto && (
        <div className="p-3 space-y-3 bg-white">
          {vacios > 0 && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
              {t('Los campos en amarillo quedaron sin información en el reporte ciudadano. Confírmalos durante la inspección de campo.',
                 'Yellow fields had no information in the citizen report. Confirm them during the field inspection.')}
            </p>
          )}
          {secciones.map((s, i) => <Seccion key={i} titulo={s.titulo} campos={s.campos} />)}

          {/* Evidencia fotográfica — galería real con miniaturas y visor */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{t('📷 Evidencia fotográfica', '📷 Photo evidence')}</p>
            {fotos > 0 ? (
              <GaleriaTecnicaInspeccion edificio={reporte} es={es} />
            ) : (
              <p className="text-xs text-amber-700 font-semibold italic px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-600" /> {t('Sin fotos — tomar evidencia en campo', 'No photos — capture evidence on site')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}