export default function NudgeBar({ es, estadoFisico, lugarSeguro, bateria }) {
  const rules = [];

  if (['no', 'near_damage', 'rubble'].includes(lugarSeguro)) {
    rules.push(es
      ? '⚡ Si estás cerca de un edificio dañado, aléjate si puedes hacerlo de forma segura.'
      : '⚡ If you are near a damaged building, move away if you can do so safely.');
  }
  if (lugarSeguro === 'gas_leak') {
    rules.push(es
      ? '🔥 Si hueles gas, no enciendas fósforos, yesqueros ni interruptores eléctricos.'
      : '🔥 If you smell gas, do not light matches, lighters, or flip electrical switches.');
  }
  if (lugarSeguro === 'fallen_wires') {
    rules.push(es
      ? '⚡ Si hay cables caídos, no los toques ni te acerques.'
      : '⚡ If there are fallen wires, do not touch or approach them.');
  }
  if (estadoFisico === 'atrapado') {
    rules.push(es
      ? '📱 Si estás atrapado, conserva batería. Envía tu ubicación, haz ruido periódicamente y evita gritar por mucho tiempo.'
      : '📱 If trapped, conserve battery. Send your location, make noise periodically, avoid shouting too long.');
  }
  if (['poca_bateria', 'una_vez', 'prestado'].includes(bateria)) {
    rules.push(es
      ? '⚡ Conserva batería. Escribe mensajes cortos y cierra apps que no uses.'
      : '⚡ Conserve battery. Write short messages and close apps you don\'t use.');
  }

  if (rules.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-3">
      {rules.map((r, i) => (
        <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 leading-relaxed">
          {r}
        </div>
      ))}
    </div>
  );
}