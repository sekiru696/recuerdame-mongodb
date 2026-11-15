const { ObjectId } = require('mongodb');
const { conectar, cerrar } = require('./db');

// Carga registros de prueba de pacientes ficticios para medir los índices con muchos datos.
// Uso:   npm run carga-masiva              (inserta)
//        npm run carga-masiva -- --limpiar (elimina solo lo insertado por este script)

const PACIENTES_FICTICIOS = 30;
const REGISTROS_POR_PACIENTE = 2000;
const LOTE = 5000;
const ESTADOS = ['confirmado', 'confirmado', 'confirmado', 'confirmado', 'no_atendido'];

async function main() {
  const db = await conectar();
  const registros = db.collection('registros');

  if (process.argv.includes('--limpiar')) {
    const r = await registros.deleteMany({ origen: 'carga-masiva' });
    console.log('Registros de carga masiva eliminados:', r.deletedCount);
    await cerrar();
    return;
  }

  const existentes = await registros.countDocuments({ origen: 'carga-masiva' });
  if (existentes > 0) {
    console.log('Ya hay ' + existentes + ' registros de carga masiva. Ejecuta primero: npm run carga-masiva -- --limpiar');
    await cerrar();
    return;
  }

  const ahora = Date.now();
  let lote = [];
  let total = 0;

  for (let p = 0; p < PACIENTES_FICTICIOS; p++) {
    const pacienteId = new ObjectId();
    const recordatorioId = new ObjectId();
    for (let i = 0; i < REGISTROS_POR_PACIENTE; i++) {
      const fecha = new Date(ahora - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      const estado = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
      const registro = {
        recordatorioId,
        pacienteId,
        tipo: 'medicamento',
        mensaje: 'Aviso de prueba de carga masiva',
        fechaProgramada: fecha,
        estado,
        origen: 'carga-masiva'
      };
      if (estado === 'confirmado') registro.confirmadoEn = new Date(fecha.getTime() + 5 * 60000);
      lote.push(registro);
      if (lote.length === LOTE) {
        await registros.insertMany(lote, { ordered: false });
        total += lote.length;
        lote = [];
      }
    }
  }
  if (lote.length > 0) {
    await registros.insertMany(lote, { ordered: false });
    total += lote.length;
  }

  console.log('Registros de carga masiva insertados: ' + total);
  console.log('Total de registros en la colección: ' + (await registros.countDocuments()));
  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });
