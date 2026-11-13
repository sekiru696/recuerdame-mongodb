const { conectar, cerrar } = require('./db');

async function main() {
  const db = await conectar();
  const recordatorios = db.collection('recordatorios');

  const antes = await recordatorios.findOne({ activo: true, tipo: 'medicamento' });
  console.log('Antes:   ', antes.mensaje, antes.horarios);

  // Edición válida con $set: solo cambia el mensaje, los horarios quedan igual
  const resultado = await recordatorios.updateOne(
    { _id: antes._id },
    { $set: { mensaje: 'Mensaje editado desde el script', actualizadoEn: new Date() } }
  );
  console.log('Coincidencias:', resultado.matchedCount, '| Modificados:', resultado.modifiedCount);

  const despues = await recordatorios.findOne({ _id: antes._id });
  console.log('Después: ', despues.mensaje, despues.horarios);

  // Edición inválida: la validación del esquema también protege las actualizaciones
  try {
    await recordatorios.updateOne({ _id: antes._id }, { $set: { horarios: ['99:99'] } });
    console.log('El horario inválido NO fue rechazado (revisar validación)');
  } catch (err) {
    console.log('Edición inválida rechazada:', err.message);
  }

  // Dejar el dato como estaba
  await recordatorios.updateOne({ _id: antes._id }, { $set: { mensaje: antes.mensaje } });
  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });
