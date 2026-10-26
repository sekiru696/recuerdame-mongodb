const bcrypt = require('bcryptjs');
const { conectar, cerrar } = require('./db');

async function usuario(db, correo, nombre, rol, extra = {}) {
  const hash = await bcrypt.hash('clave-de-prueba', 10);
  await db.collection('usuarios').updateOne(
    { correo },
    { $set: { nombre, rol, passwordHash: hash, ...extra } },
    { upsert: true }
  );
  return db.collection('usuarios').findOne({ correo });
}

async function main() {
  const db = await conectar();

  const p1 = await usuario(db, 'paciente@ejemplo.cl', 'Paciente Demo', 'paciente');
  const p2 = await usuario(db, 'paciente2@ejemplo.cl', 'Paciente Dos', 'paciente');
  const p3 = await usuario(db, 'paciente3@ejemplo.cl', 'Paciente Tres', 'paciente');
  const c1 = await usuario(db, 'cuidador@ejemplo.cl', 'Cuidador Demo', 'cuidador', { pacientesIds: [p1._id, p2._id] });
  const c2 = await usuario(db, 'cuidador2@ejemplo.cl', 'Cuidadora Dos', 'cuidador', { pacientesIds: [p3._id] });

  await db.collection('recordatorios').deleteMany({});
  await db.collection('registros').deleteMany({});

  const plantillas = [
    { p: p1, c: c1, tipo: 'medicamento', mensaje: 'Es hora de tomar tu pastilla con un vaso de agua', detalle: { nombre: 'Donepezilo', dosis: '5 mg' }, horarios: ['08:00', '20:00'], repeticion: 'diaria' },
    { p: p1, c: c1, tipo: 'medicamento', mensaje: 'Toma tu pastilla de la presión con el desayuno', detalle: { nombre: 'Losartán', dosis: '50 mg' }, horarios: ['09:00'], repeticion: 'diaria' },
    { p: p1, c: c1, tipo: 'cita', mensaje: 'Hoy tienes control con la doctora a las 11', detalle: { lugar: 'Consultorio central', profesional: 'Dra. Soto' }, horarios: ['10:00'], repeticion: 'unica' },
    { p: p1, c: c1, tipo: 'fecha_especial', mensaje: 'Hoy es el cumpleaños de tu nieta Camila', detalle: { persona: 'Camila' }, horarios: ['12:00'], repeticion: 'unica' },
    { p: p1, c: c1, tipo: 'medicamento', mensaje: 'Es hora de tu vitamina con la cena', detalle: { nombre: 'Vitamina D', dosis: '1 cápsula' }, horarios: ['19:30'], repeticion: 'semanal', diasSemana: [1, 3, 5] },
    { p: p2, c: c1, tipo: 'medicamento', mensaje: 'Recuerda tomar tu medicina de la tarde', detalle: { nombre: 'Memantina', dosis: '10 mg' }, horarios: ['14:00', '21:00'], repeticion: 'diaria' },
    { p: p2, c: c1, tipo: 'cita', mensaje: 'Mañana tienes kinesiología', detalle: { lugar: 'Centro de salud', profesional: 'Kinesiólogo Pérez' }, horarios: ['16:00'], repeticion: 'unica' },
    { p: p2, c: c1, tipo: 'medicamento', mensaje: 'Medicamento que ya no se toma', horarios: ['07:00'], repeticion: 'diaria', activo: false },
    { p: p3, c: c2, tipo: 'fecha_especial', mensaje: 'Hoy es tu aniversario de matrimonio', detalle: { persona: 'Don Luis' }, horarios: ['11:00'], repeticion: 'unica' }
  ];

  const creados = [];
  for (const t of plantillas) {
    const doc = {
      pacienteId: t.p._id,
      creadoPor: t.c._id,
      tipo: t.tipo,
      mensaje: t.mensaje,
      horarios: t.horarios,
      repeticion: t.repeticion,
      activo: t.activo !== false,
      creadoEn: new Date()
    };
    if (t.detalle) doc.detalle = t.detalle;
    if (t.diasSemana) doc.diasSemana = t.diasSemana;
    if (!doc.activo) doc.desactivadoEn = new Date();
    const r = await db.collection('recordatorios').insertOne(doc);
    creados.push({ ...doc, _id: r.insertedId });
  }

  // Historial de 14 días para los recordatorios diarios activos
  const registros = [];
  for (const r of creados.filter(x => x.activo && x.repeticion === 'diaria')) {
    for (let dia = 1; dia <= 14; dia++) {
      r.horarios.forEach((hora, i) => {
        const [h, m] = hora.split(':').map(Number);
        const programada = new Date();
        programada.setDate(programada.getDate() - dia);
        programada.setHours(h, m, 0, 0);
        const n = (dia * 3 + i) % 7;
        const reg = {
          recordatorioId: r._id,
          pacienteId: r.pacienteId,
          tipo: r.tipo,
          mensaje: r.mensaje,
          fechaProgramada: programada,
          estado: n === 0 ? 'no_atendido' : 'confirmado'
        };
        if (n !== 0) reg.confirmadoEn = new Date(programada.getTime() + (2 + n) * 60000);
        registros.push(reg);
      });
    }
  }
  await db.collection('registros').insertMany(registros);

  console.log(`Datos de ejemplo cargados: 5 usuarios, ${creados.length} recordatorios, ${registros.length} registros`);
  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });