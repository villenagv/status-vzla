import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, PawPrint, X, ChevronDown, ChevronUp } from 'lucide-react';

const ESPECIE_OPTS = [
  { val: 'perro',    es: '🐕 Perro',    en: '🐕 Dog'    },
  { val: 'gato',     es: '🐈 Gato',     en: '🐈 Cat'    },
  { val: 'ave',      es: '🐦 Ave',      en: '🐦 Bird'   },
  { val: 'conejo',   es: '🐇 Conejo',   en: '🐇 Rabbit' },
  { val: 'reptil',   es: '🦎 Reptil',   en: '🦎 Reptile'},
  { val: 'otro',     es: '🐾 Otro',     en: '🐾 Other'  },
];

const CONDICION_OPTS = [
  { val: 'bien',         es: '✅ Bien',           en: '✅ OK',           color: '#16A34A' },
  { val: 'asustada',     es: '😰 Asustada',       en: '😰 Scared',       color: '#D97706' },
  { val: 'herida_leve',  es: '🩹 Herida leve',    en: '🩹 Lightly hurt', color: '#EA580C' },
  { val: 'herida_grave', es: '🚑 Herida grave',   en: '🚑 Badly hurt',   color: '#DC2626' },
  { val: 'fallecida',    es: '⚫ Fallecida',       en: '⚫ Deceased',      color: '#374151' },
  { val: 'no_sabe',      es: '❓ No sé',           en: '❓ Unknown',       color: '#6B7280' },
];

const COLLAR_OPTS = [
  { val: 'si',      es: '✅ Sí tenía',   en: '✅ Yes'     },
  { val: 'no',      es: '❌ No tenía',   en: '❌ No'      },
  { val: 'no_sabe', es: '❓ No sé',      en: '❓ Unknown' },
];

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-400";

const FORM_INIT = {
  especie: '', descripcion: '', color: '', raza_aprox: '',
  tenia_collar: 'no_sabe', descripcion_collar: '',
  tenia_id_placa: 'no_sabe', info_id_placa: '',
  condicion: 'no_sabe', ubicacion_actual: '',
  reportante_nombre: '', reportante_telefono: '', reportante_email: '',
  notas_publicas: '',
};

function MascotaCard({ mascota, es }) {
  const [expanded, setExpanded] = useState(false);
  const esp = ESPECIE_OPTS.find(e => e.val === mascota.especie);
  const cond = CONDICION_OPTS.find(c => c.val === mascota.condicion);

  return (
    <div style={{
      border: `1.5px solid #FDE68A`, borderRadius: 12,
      background: '#FFFBEB', marginBottom: 8, overflow: 'hidden',
    }}>
      <button onClick={() => setExpanded(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{esp ? esp.es.split(' ')[0] : '🐾'}</span>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#78350F', margin: 0 }}>
              {esp ? (es ? esp.es : esp.en) : mascota.especie}
              {mascota.color ? ` · ${mascota.color}` : ''}
            </p>
            {cond && (
              <p style={{ fontSize: 11, fontWeight: 600, color: cond.color, margin: 0 }}>
                {es ? cond.es : cond.en}
              </p>
            )}
          </div>
        </div>
        <span style={{ color: '#92400E', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #FDE68A' }}>
          {mascota.descripcion && <p style={{ fontSize: 12, color: '#374151', margin: '8px 0 4px', lineHeight: 1.5 }}>{mascota.descripcion}</p>}
          {mascota.raza_aprox && <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0' }}>🐾 {es ? 'Raza/Tipo:' : 'Breed/Type:'} {mascota.raza_aprox}</p>}
          <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0' }}>
            🏷️ {es ? 'Collar:' : 'Collar:'} <strong style={{ color: '#374151' }}>{mascota.tenia_collar === 'si' ? (es ? 'Sí' : 'Yes') : mascota.tenia_collar === 'no' ? (es ? 'No' : 'No') : (es ? 'No sé' : 'Unknown')}</strong>
            {mascota.descripcion_collar ? ` — ${mascota.descripcion_collar}` : ''}
          </p>
          {mascota.tenia_id_placa === 'si' && (
            <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0' }}>
              🪪 {es ? 'ID/Placa:' : 'ID Tag:'} <strong style={{ color: '#374151' }}>{mascota.info_id_placa || (es ? 'Sí, sin texto visible' : 'Yes, no visible text')}</strong>
            </p>
          )}
          {mascota.ubicacion_actual && (
            <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0' }}>📍 {mascota.ubicacion_actual}</p>
          )}
          {mascota.reportante_nombre && (
            <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0' }}>👤 {es ? 'Reportado por:' : 'Reported by:'} {mascota.reportante_nombre}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MascotasEnEdificio({ edificioId, edificio, es }) {
  const [mascotas, setMascotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const t = (esStr, enStr) => es ? esStr : enStr;
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!edificioId) return;
    base44.entities.MascotasEncontradas.filter({ edificio_id: edificioId }, '-created_date', 30)
      .then(data => setMascotas(data || []))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [edificioId]);

  const handleEnviar = async () => {
    if (!form.especie) {
      setError(t('Selecciona la especie de la mascota.', 'Select the pet species.'));
      return;
    }
    setError('');
    setEnviando(true);
    try {
      const nueva = await base44.entities.MascotasEncontradas.create({
        edificio_id: edificioId,
        especie: form.especie,
        descripcion: form.descripcion.trim() || undefined,
        color: form.color.trim() || undefined,
        raza_aprox: form.raza_aprox.trim() || undefined,
        tenia_collar: form.tenia_collar,
        descripcion_collar: form.descripcion_collar.trim() || undefined,
        tenia_id_placa: form.tenia_id_placa,
        info_id_placa: form.info_id_placa.trim() || undefined,
        condicion: form.condicion,
        ubicacion_actual: form.ubicacion_actual.trim() || undefined,
        ciudad: edificio?.ciudad,
        estado_region: edificio?.estado_region,
        reportante_nombre: form.reportante_nombre.trim() || undefined,
        reportante_telefono: form.reportante_telefono.trim() || undefined,
        reportante_email: form.reportante_email.trim() || undefined,
        notas_publicas: form.notas_publicas.trim() || undefined,
        estado_caso: 'encontrada',
        fuente: 'ciudadano',
      });
      setMascotas(prev => [nueva, ...prev]);
      setForm(FORM_INIT);
      setMostrarForm(false);
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch {
      setError(t('Error al guardar. Intenta de nuevo.', 'Error saving. Please try again.'));
    }
    setEnviando(false);
  };

  return (
    <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PawPrint size={16} style={{ color: '#D97706', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#78350F', margin: 0 }}>
              {t('Mascotas encontradas en este edificio', 'Pets found in this building')}
            </p>
            {!cargando && mascotas.length > 0 && (
              <p style={{ fontSize: 10, color: '#92400E', margin: 0 }}>
                {mascotas.length} {t('mascota(s) registrada(s)', 'pet(s) registered')}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => { setMostrarForm(v => !v); setError(''); }} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: mostrarForm ? '#FEF3C7' : '#D97706', color: mostrarForm ? '#78350F' : '#fff',
          border: mostrarForm ? '1.5px solid #FCD34D' : 'none',
          borderRadius: 10, padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          {mostrarForm ? <X size={13} /> : <PawPrint size={13} />}
          {mostrarForm ? t('Cancelar', 'Cancel') : t('Reportar mascota', 'Report pet')}
        </button>
      </div>

      {/* Confirmación */}
      {enviado && (
        <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D', margin: 0 }}>
            🐾 {t('¡Mascota registrada! Gracias por reportarla.', 'Pet registered! Thank you for reporting.')}
          </p>
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div style={{ background: '#fff', border: '1.5px solid #FCD34D', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#78350F', margin: '0 0 10px' }}>
            🐾 {t('Registrar mascota encontrada', 'Register found pet')}
          </p>

          {/* Especie */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              {t('Especie', 'Species')} <span style={{ color: '#EF4444' }}>*</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {ESPECIE_OPTS.map(o => (
                <button key={o.val} onClick={() => setF('especie', o.val)} style={{
                  padding: '9px 6px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: form.especie === o.val ? '#D97706' : '#FFFBEB',
                  color: form.especie === o.val ? '#fff' : '#374151',
                  border: `1.5px solid ${form.especie === o.val ? '#D97706' : '#FCD34D'}`,
                }}>{es ? o.es : o.en}</button>
              ))}
            </div>
          </div>

          {/* Descripción y color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            <input value={form.color} onChange={e => setF('color', e.target.value)}
              placeholder={t('Color (ej: negro, blanco con manchas cafés)', 'Color (e.g. black, white with brown spots)')}
              className={inputCls} />
            <input value={form.raza_aprox} onChange={e => setF('raza_aprox', e.target.value)}
              placeholder={t('Raza o tipo aproximado (ej: labrador, mestizo grande)', 'Approx. breed/type (e.g. labrador, large mixed)')}
              className={inputCls} />
            <textarea rows={2} value={form.descripcion} onChange={e => setF('descripcion', e.target.value)}
              placeholder={t('Descripción adicional (señas particulares, comportamiento...)', 'Additional description (markings, behavior...)')}
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', color: '#111827', resize: 'none', fontFamily: 'inherit', outline: 'none' }} />
          </div>

          {/* Collar */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              🏷️ {t('¿Tenía collar?', 'Did it have a collar?')}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {COLLAR_OPTS.map(o => (
                <button key={o.val} onClick={() => setF('tenia_collar', o.val)} style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: form.tenia_collar === o.val ? '#D97706' : '#FFFBEB',
                  color: form.tenia_collar === o.val ? '#fff' : '#374151',
                  border: `1.5px solid ${form.tenia_collar === o.val ? '#D97706' : '#FCD34D'}`,
                }}>{es ? o.es : o.en}</button>
              ))}
            </div>
            {form.tenia_collar === 'si' && (
              <input value={form.descripcion_collar} onChange={e => setF('descripcion_collar', e.target.value)}
                placeholder={t('Describe el collar (color, texto, medalla...)', 'Describe the collar (color, text, tag...)')}
                className={inputCls} />
            )}
          </div>

          {/* ID / Placa */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              🪪 {t('¿Tenía placa de identificación?', 'Did it have an ID tag?')}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {COLLAR_OPTS.map(o => (
                <button key={o.val} onClick={() => setF('tenia_id_placa', o.val)} style={{
                  padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: form.tenia_id_placa === o.val ? '#D97706' : '#FFFBEB',
                  color: form.tenia_id_placa === o.val ? '#fff' : '#374151',
                  border: `1.5px solid ${form.tenia_id_placa === o.val ? '#D97706' : '#FCD34D'}`,
                }}>{es ? o.es : o.en}</button>
              ))}
            </div>
            {form.tenia_id_placa === 'si' && (
              <input value={form.info_id_placa} onChange={e => setF('info_id_placa', e.target.value)}
                placeholder={t('Texto en la placa, número de chip, teléfono...', 'Text on tag, chip number, phone...')}
                className={inputCls} />
            )}
          </div>

          {/* Condición */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              {t('Condición', 'Condition')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
              {CONDICION_OPTS.map(o => (
                <button key={o.val} onClick={() => setF('condicion', o.val)} style={{
                  padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: form.condicion === o.val ? o.color : '#FFFBEB',
                  color: form.condicion === o.val ? '#fff' : '#374151',
                  border: `1.5px solid ${form.condicion === o.val ? o.color : '#FCD34D'}`,
                }}>{es ? o.es : o.en}</button>
              ))}
            </div>
          </div>

          {/* Ubicación actual */}
          <input value={form.ubicacion_actual} onChange={e => setF('ubicacion_actual', e.target.value)}
            placeholder={t('¿Dónde está la mascota ahora? (ej: con vecino del piso 3, refugio...)', 'Where is the pet now? (e.g. with neighbor on floor 3, shelter...)')}
            className={inputCls} style={{ marginBottom: 10 }} />

          {/* Contacto reportante */}
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#78350F', margin: '0 0 6px' }}>
              👤 {t('Tu contacto (privado, no se publica)', 'Your contact (private, not published)')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input value={form.reportante_nombre} onChange={e => setF('reportante_nombre', e.target.value)}
                placeholder={t('Tu nombre (opcional)', 'Your name (optional)')} className={inputCls} />
              <input value={form.reportante_telefono} onChange={e => setF('reportante_telefono', e.target.value)}
                placeholder={t('Teléfono / WhatsApp (opcional)', 'Phone / WhatsApp (optional)')} className={inputCls} />
              <input value={form.reportante_email} onChange={e => setF('reportante_email', e.target.value)}
                type="email"
                placeholder={t('Email (opcional)', 'Email (optional)')} className={inputCls} />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, margin: '0 0 8px' }}>⚠️ {error}</p>
          )}

          <button onClick={handleEnviar} disabled={enviando || !form.especie} style={{
            width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
            background: (enviando || !form.especie) ? '#FCD34D' : '#D97706',
            color: '#fff', border: 'none', cursor: (enviando || !form.especie) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <PawPrint size={15} />}
            {enviando ? t('Guardando...', 'Saving...') : t('Registrar mascota', 'Register pet')}
          </button>
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#92400E', fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />
          {t('Cargando...', 'Loading...')}
        </div>
      ) : mascotas.length === 0 ? (
        <p style={{ fontSize: 12, color: '#92400E', margin: 0, textAlign: 'center' }}>
          {t('Sin mascotas registradas aún en este sitio.', 'No pets registered yet at this site.')}
        </p>
      ) : (
        mascotas.map(m => <MascotaCard key={m.id} mascota={m} es={es} />)
      )}
    </div>
  );
}