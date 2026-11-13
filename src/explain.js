const { conectar, cerrar } = require('./db');

function resumen(nombre, plan) {
  const e = plan.executionStats;
  const raiz = plan.queryPlanner.winningPlan.queryPlan || plan.queryPlanner.winningPlan;
  const etapas = [];
  let indice = '-';
  for (let nodo = raiz; nodo; nodo = nodo.inputStage) {
    etapas.push(nodo.stage);
    if (nodo.stage === 'IXSCAN') indice = nodo.indexName;
  }
  return {
    consulta: nombre,
    etapas: etapas.join(' > '),
    indice,
    'claves revisadas': e.totalKeysExamined,
    'documentos revisados': e.totalDocsExamined,
    devueltos: e.nReturned,
    'ms': e.executionTimeMillis
  };
}

async function comparar(coleccion, titulo, filtro, orden) {
  const sinIndice = await coleccion.find(filtro).sort(orden).hint({ $natural: 1 }).explain('executionStats');
  const conIndice = await coleccion.find(filtro).sort(orden).explain('executionStats');
  console.log('\n' + titulo);
  console.table([resumen('sin índice (COLLSCAN forzado)', sinIndice), resumen('con índice (plan elegido)', conIndice)]);
}

async function main() {
  const db = await conectar();
  const paciente = await db.collection('usuarios').findOne({ correo: 'paciente@ejemplo.cl' });
  const hace7dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  await comparar(
    db.collection('recordatorios'),
    'Consulta 1: recordatorios activos de un paciente, del más nuevo al más antiguo',
    { pacienteId: paciente._id, activo: true },
    { creadoEn: -1 }
  );

  await comparar(
    db.collection('registros'),
    'Consulta 2: historial de la última semana de un paciente',
    { pacienteId: paciente._id, fechaProgramada: { $gte: hace7dias } },
    { fechaProgramada: -1 }
  );

  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });