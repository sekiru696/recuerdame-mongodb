const { conectar, cerrar } = require('./db');

async function main() {
  const db = await conectar();
  const usuarios = db.collection('usuarios');
  const recordatorios = db.collection('recordatorios');

  const cuidador = await usuarios.findOne({ correo: 'cuidador@ejemplo.cl' });
  const paciente = await usuarios.findOne({ correo: 'paciente@ejemplo.cl' });

  // Caso 1: recordatorio con horario inválido
  try {
    await recordatorios.insertOne({
      pacienteId: paciente._id,
      creadoPor: cuidador._id,
      tipo: 'medicamento',
      mensaje: 'Recordatorio con hora imposible',
      horarios: ['25:99'],
      repeticion: 'diaria',
      activo: true,
      creadoEn: new Date()
    });
    console.log('Caso 1: NO fue rechazado (revisar validación)');
  } catch (err) {
    console.log('Caso 1 rechazado correctamente:', err.message);
  }

  // Caso 2: usuario con correo duplicado
  try {
    await usuarios.insertOne({
      nombre: 'Otro Usuario',
      correo: 'cuidador@ejemplo.cl',
      passwordHash: 'x',
      rol: 'cuidador'
    });
    console.log('Caso 2: NO fue rechazado (revisar índice)');
  } catch (err) {
    console.log('Caso 2 rechazado correctamente:', err.message);
  }

  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });