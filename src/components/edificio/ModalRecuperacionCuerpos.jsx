import { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PasoCantidadCuerpos from './PasoCantidadCuerpos';
import PasoDetalleCuerpo from './PasoDetalleCuerpo';

const CUERPO_VACIO = { edad_aparente: '', sexo: 'no_se_sabe', identidad: '', destino_traslado: '' };

export default function ModalRecuperacionCuerpos({ edificioId, edificio, es, t, lang, onClose, onCompletado }) {
  const [paso, setPaso] = useState('cantidad'); // 'cantidad' | 'detalle' | 'ok'
  const [cantidad, setCantidad] = useState(1);
  const [cuerpos, setCuerpos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const iniciarDetalle = () => {
    setCuerpos(Array.from({ length: cantidad }, () => ({ ...CUERPO_VACIO })));
    setIndice(0);
    setPaso('detalle');
  };

  const actualizarCuerpo = (data) => {
    setCuerpos(prev => prev.map((c, i) => i === indice ? data : c));
  };

  const enviar = async () => {
    setEnviando(true);
    setError('');
    try {
      await base44.entities.CuerposRecuperados.bulkCreate(
        cuerpos.map(c => ({ ...c, edificio_id: edificioId }))
      );
      const descripcion = es
        ? `Se recuperaron ${cuerpos.length} cuerpo(s) de este edificio.`
        : `${cuerpos.length} body(ies) recovered from this building.`;
      await base44.entities.ActualizacionesSitios.create({
        sitio_id: edificioId, tipo_sitio: 'edificio', tipo_accion: 'persona_fallecida_recuperada',
        descripcion, es_sensible: true, fuente: 'ciudadano',
      });
      base44.functions.invoke('notificarActualizacionEdificio', {
        edificio_id: edificioId, tipo_accion: 'persona_fallecida_recuperada',
        nivel_dano: edificio?.nivel_dano, nombre_lugar: edificio?.nombre_lugar,
        descripcion, lang,
      }).catch(() => {});
      onCompletado?.(descripcion);
      setPaso('ok');
    } catch {
      setError(t('Error al guardar. Intenta de nuevo.', 'Error saving. Try again.', 'Erro ao salvar. Tente novamente.'));
    }
    setEnviando(false);
  };

  const esUltimo = indice === cuerpos.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={paso !== 'detalle' ? onClose : undefined}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">⚫ {t('Cuerpos recuperados', 'Bodies recovered', 'Corpos recuperados')}</p>
            <h2 className="text-base font-black text-[#1A1F2E] leading-tight">
              {t('Registrar recuperación', 'Register recovery', 'Registrar recuperação')}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer flex-shrink-0">
            <X size={14} className="text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {paso === 'ok' ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3.5">
              <Check size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-bold text-green-700">
                {t('Registro guardado. Gracias por reportar.', 'Record saved. Thank you for reporting.', 'Registro salvo. Obrigado por reportar.')}
              </p>
            </div>
          ) : paso === 'cantidad' ? (
            <PasoCantidadCuerpos cantidad={cantidad} setCantidad={setCantidad} onContinuar={iniciarDetalle} t={t} />
          ) : (
            <>
              <PasoDetalleCuerpo cuerpo={cuerpos[indice]} onChange={actualizarCuerpo} indice={indice} total={cuerpos.length} t={t} />
              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              <div className="flex gap-2 mt-4">
                {indice > 0 && (
                  <button onClick={() => setIndice(i => i - 1)} disabled={enviando}
                    className="flex-1 border border-gray-300 text-gray-700 text-sm font-bold py-3 rounded-xl cursor-pointer disabled:opacity-40">
                    {t('← Anterior', '← Back', '← Anterior')}
                  </button>
                )}
                <button onClick={() => esUltimo ? enviar() : setIndice(i => i + 1)} disabled={enviando}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
                  {enviando ? <Loader2 size={14} className="animate-spin" /> : null}
                  {esUltimo ? t('Guardar', 'Save', 'Salvar') : t('Siguiente →', 'Next →', 'Próximo →')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}