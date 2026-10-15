const bcrypt = require('bcryptjs');
const { conectar, cerrar } = require('./db');

async function main() {
  const db = await conectar();
  const usuarios = db.collection('usuarios');
  const recordatorios = db.collection('recordatorios');

  const hash = await bcrypt.hash('clave-de-prueba', 10);

  await usuarios.updateOne(
    { correo: 'cuidador@ejemplo.cl' },
    { $setOnInsert: { nombre: 'Cuidador Demo', passwordHash: hash, rol: 'cuidador', pacientesIds: [] } },
    { upsert: true }
  );
  await usuarios.updateOne(
    { correo: 'paciente@ejemplo.cl' },
    { $setOnInsert: { nombre: 'Paciente Demo', passwordHash: hash, rol: 'paciente' } },
    { upsert: true }
  );

  const cuidador = await usuarios.findOne({ correo: 'cuidador@ejemplo.cl' });
  const paciente = await usuarios.findOne({ correo: 'paciente@ejemplo.cl' });

  await usuarios.updateOne(
    { _id: cuidador._id },
    { $addToSet: { pacientesIds: paciente._id } }
  );

  // Crear
  const resultado = await recordatorios.insertOne({
    pacienteId: paciente._id,
    creadoPor: cuidador._id,
    tipo: 'medicamento',
    mensaje: 'Es hora de tomar tu pastilla con un vaso de agua',
    detalle: { nombre: 'Donepezilo', dosis: '5 mg' },
    horarios: ['08:00', '20:00'],
    repeticion: 'diaria',
    activo: true,
    creadoEn: new Date()
  });
  console.log('Recordatorio creado con id:', resultado.insertedId.toString());

  // Leer
  const lista = await recordatorios
    .find({ pacienteId: paciente._id, activo: true })
    .toArray();
  console.log('Recordatorios activos del paciente:', lista.length);
  console.log(JSON.stringify(lista, null, 2));

  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });