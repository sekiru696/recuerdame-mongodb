const { conectar, cerrar } = require('./db');

async function main() {
  const correo = (process.argv[2] || '').trim().toLowerCase();
  if (!correo) {
    console.log('Uso: node src/desbloquear.js correo@ejemplo.cl');
    return;
  }
  const db = await conectar();
  const r = await db.collection('usuarios').updateOne(
    { correo },
    { $set: { intentosFallidos: 0 }, $unset: { bloqueadoHasta: '' } }
  );
  console.log(r.matchedCount ? 'Cuenta desbloqueada: ' + correo : 'No existe un usuario con ese correo');
  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });
