export function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generarcodigo(personaId) {
  const suffix = (personaId || generarCodigo()).slice(-4).toUpperCase();
  return 'CRIS-' + generarCodigo() + suffix;
}

export function guardarcodigo(personaId, codigo) {
  try {
    const saved = JSON.parse(localStorage.getItem('cris_codes') || '{}');
    saved[personaId] = { codigo, fecha: new Date().toISOString() };
    localStorage.setItem('cris_codes', JSON.stringify(saved));
  } catch (e) { /* ignore */ }
}