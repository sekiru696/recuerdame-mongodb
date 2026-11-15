const express = require('express');
const { ObjectId } = require('mongodb');
const { conectar } = require('./db');
const { exigirSesion, exigirRoles } = require('./auth');
const { pipelineCumplimiento, pipelineFranjas } = require('./agregaciones');

const router = express.Router();
const gestores = [exigirSesion, exigirRoles('cuidador', 'doctor')];
const DIA_MS = 24 * 60 * 60 * 1000;

function entero(valor, porDefecto, minimo, maximo) {
  if (valor === undefined) return porDefecto;
  const n = Number(valor);
  return Number.isInteger(n) && n >= minimo && n <= maximo ? n : null;
}

async function pacienteAutorizado(db, req) {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) return { status: 400, error: 'Identificador inválido' };
  const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(req.usuario.id) });
  const permitidos = (usuario && usuario.pacientesIds) || [];
  if (!permitidos.some(p => p.toString() === id)) {
    return { status: 403, error: 'Ese paciente no está a tu cargo' };
  }
  return { pacienteId: new ObjectId(id) };
}

router.get('/pacientes/:id/cumplimiento', gestores, async (req, res) => {
  const semanas = entero(req.query.semanas, 4, 1, 12);
  if (semanas === null) return res.status(400).json({ error: 'Las semanas deben ser un número entero entre 1 y 12' });

  try {
    const db = await conectar();
    const r = await pacienteAutorizado(db, req);
    if (r.error) return res.status(r.status).json({ error: r.error });

    const hasta = new Date();
    const desde = new Date(hasta.getTime() - semanas * 7 * DIA_MS);
    const resultado = await db.collection('registros')
      .aggregate(pipelineCumplimiento(r.pacienteId, desde, hasta))
      .toArray();
    res.json(resultado);
  } catch (err) {
    console.error('Error en cumplimiento:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/pacientes/:id/franjas', gestores, async (req, res) => {
  const dias = entero(req.query.dias, 28, 1, 90);
  if (dias === null) return res.status(400).json({ error: 'Los días deben ser un número entero entre 1 y 90' });

  try {
    const db = await conectar();
    const r = await pacienteAutorizado(db, req);
    if (r.error) return res.status(r.status).json({ error: r.error });

    const desde = new Date(Date.now() - dias * DIA_MS);
    const resultado = await db.collection('registros')
      .aggregate(pipelineFranjas(r.pacienteId, desde))
      .toArray();
    res.json(resultado);
  } catch (err) {
    console.error('Error en franjas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
