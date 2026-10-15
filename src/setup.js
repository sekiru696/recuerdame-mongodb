const { conectar, cerrar } = require('./db');

const validadorRecordatorios = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['pacienteId', 'creadoPor', 'tipo', 'mensaje', 'horarios', 'repeticion', 'activo', 'creadoEn'],
    properties: {
      pacienteId: { bsonType: 'objectId' },
      creadoPor: { bsonType: 'objectId' },
      tipo: { enum: ['medicamento', 'cita', 'fecha_especial'] },
      mensaje: { bsonType: 'string', minLength: 5 },
      horarios: {
        bsonType: 'array',
        minItems: 1,
        items: { bsonType: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' }
      },
      repeticion: { enum: ['unica', 'diaria', 'semanal'] },
      activo: { bsonType: 'bool' }
    }
  }
};

const validadorRegistros = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['recordatorioId', 'pacienteId', 'tipo', 'mensaje', 'fechaProgramada', 'estado'],
    properties: {
      recordatorioId: { bsonType: 'objectId' },
      pacienteId: { bsonType: 'objectId' },
      estado: { enum: ['pendiente', 'confirmado', 'no_atendido'] }
    }
  }
};

async function asegurarColeccion(db, nombre, validator) {
  const existe = await db.listCollections({ name: nombre }).hasNext();
  if (existe) {
    await db.command({ collMod: nombre, validator });
  } else {
    await db.createCollection(nombre, { validator });
  }
}

async function main() {
  const db = await conectar();
  await asegurarColeccion(db, 'recordatorios', validadorRecordatorios);
  await asegurarColeccion(db, 'registros', validadorRegistros);
  await db.collection('usuarios').createIndex({ correo: 1 }, { unique: true });
  console.log('Colecciones, validaciones e índice creados');
  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });