const { conectar, cerrar } = require('./db');
const { pipelineCumplimiento, pipelineFranjas } = require('./agregaciones');

function encontrar(obj, clave) {
  let hallado = null;
  (function recorrer(o) {
    if (hallado !== null || !o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === clave && v && typeof v === 'object') { hallado = v; return; }
      recorrer(v);
    }
  })(obj);
  return hallado;
}

function maximo(obj, clave) {
  let mejor = 0;
  (function recorrer(o) {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === clave && typeof v === 'number') mejor = Math.max(mejor, v);
      else recorrer(v);
    }
  })(obj);
  return mejor;
}

function resumen(nombre, plan) {
  const etapas = new Set();
  const indices = new Set();
  (function recorrer(o) {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'stage' && typeof v === 'string') etapas.add(v);
      if (k === 'indexName' && typeof v === 'string') indices.add(v);
      recorrer(v);
    }
  })(encontrar(plan, 'winningPlan') || {});
  return {
    consulta: nombre,
    etapas: [...etapas].join(' > '),
    indice: [...indices].join(', ') || '-',
    'claves revisadas': maximo(plan, 'totalKeysExamined'),
    'documentos revisados': maximo(plan, 'totalDocsExamined')
  };
}

async function comparar(coleccion, titulo, pipeline) {
  const sin = await coleccion.aggregate(pipeline, { hint: { $natural: 1 } }).explain('executionStats');
  const con = await coleccion.aggregate(pipeline).explain('executionStats');
  console.log('\n' + titulo);
  console.table([resumen('sin índice (COLLSCAN forzado)', sin), resumen('con índice (plan elegido)', con)]);
}

async function main() {
  const db = await conectar();
  const paciente = await db.collection('usuarios').findOne({ correo: 'paciente@ejemplo.cl' });
  const registros = db.collection('registros');
  const hasta = new Date();

  await comparar(registros, 'Agregación 1: cumplimiento semanal (4 semanas)',
    pipelineCumplimiento(paciente._id, new Date(hasta.getTime() - 28 * 86400000), hasta));
  await comparar(registros, 'Agregación 2: no atendidos por franja horaria (28 días)',
    pipelineFranjas(paciente._id, new Date(hasta.getTime() - 28 * 86400000)));

  await cerrar();
}

main().catch(err => { console.error(err.message); process.exit(1); });
