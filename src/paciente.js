const express = require('express');
const { ObjectId } = require('mongodb');
const { conectar } = require('./db');
const { exigirSesion, exigirRoles } = require('./auth');

const router = express.Router();
const soloPaciente = [exigirSesion, exigirRoles('paciente')];
const HORA = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function limitesDeHoy() {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  return { inicio, fin };
}

function fechaDeHoy(hora) {
  const [h, m] = hora.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(h, m, 0, 0);
  return fecha;
}

function claveHora(fecha) {
  return String(fecha.getHours()).padStart(2, '0') + ':' + String(fecha.getMinutes()).padStart(2, '0');
}

// Avisos del día del paciente, con su estado (pendiente o confirmado)
router.get('/mi-dia', soloPaciente, async (req, res) => {
  try {
    const db = await conectar();
    const pacienteId = new ObjectId(req.usuario.id);
    const { inicio, fin } = limitesDeHoy();
    const diaSemana = new Date().getDay();

    const recordatorios = await db.collection('recordatorios')
      .find({ pacienteId, activo: true })
      .toArray();

    // Los recordatorios de una sola vez ya cumplidos en días anteriores no se vuelven a mostrar
    const unicas = recordatorios.filter(r => r.repeticion === 'unica').map(r => r._id);
    const previos = unicas.length === 0 ? [] : await db.collection('registros')
      .find({ pacienteId, recordatorioId: { $in: unicas }, estado: 'confirmado', fechaProgramada: { $lt: inicio } })
      .toArray();
    const cumplidas = new Set(previos.map(x => x.recordatorioId.toString()));

    const deHoy = await db.collection('registros')
      .find({ pacienteId, fechaProgramada: { $gte: inicio, $lt: fin } })
      .toArray();
    const confirmados = new Set(
      deHoy
        .filter(x => x.estado === 'confirmado')
        .map(x => x.recordatorioId.toString() + '|' + claveHora(x.fechaProgramada))
    );

    const items = [];
    for (const r of recordatorios) {
      if (r.repeticion === 'unica' && cumplidas.has(r._id.toString())) continue;
      if (r.repeticion === 'semanal' && Array.isArray(r.diasSemana) && !r.diasSemana.includes(diaSemana)) continue;
      for (const hora of r.horarios) {
        items.push({
          recordatorioId: r._id,
          tipo: r.tipo,
          mensaje: r.mensaje,
          detalle: r.detalle || null,
          hora,
          estado: confirmados.has(r._id.toString() + '|' + hora) ? 'confirmado' : 'pendiente'
        });
      }
    }
    items.sort((a, b) => a.hora.localeCompare(b.hora));
    res.json(items);
  } catch (err) {
    console.error('Error en /mi-dia:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// El paciente confirma un aviso de hoy
router.post('/mi-dia/:id/confirmar', soloPaciente, async (req, res) => {
  const { id } = req.params;
  const { hora } = req.body || {};

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }
  if (typeof hora !== 'string' || !HORA.test(hora)) {
    return res.status(400).json({ error: 'La hora debe tener formato HH:MM' });
  }

  try {
    const db = await conectar();
    const pacienteId = new ObjectId(req.usuario.id);

    // Se busca con el id del paciente: un recordatorio ajeno responde igual que uno inexistente
    const recordatorio = await db.collection('recordatorios')
      .findOne({ _id: new ObjectId(id), pacienteId, activo: true });
    if (!recordatorio) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    if (!recordatorio.horarios.includes(hora)) {
      return res.status(400).json({ error: 'Ese horario no pertenece al recordatorio' });
    }

    const filtro = { recordatorioId: recordatorio._id, fechaProgramada: fechaDeHoy(hora) };
    const existente = await db.collection('registros').findOne({ ...filtro, estado: 'confirmado' });
    if (existente) {
      return res.json({ mensaje: 'Ya estaba confirmado' });
    }

    await db.collection('registros').updateOne(
      filtro,
      {
        $set: { estado: 'confirmado', confirmadoEn: new Date() },
        $setOnInsert: { pacienteId, tipo: recordatorio.tipo, mensaje: recordatorio.mensaje }
      },
      { upsert: true }
    );
    res.status(201).json({ mensaje: 'Confirmado', recordatorioId: recordatorio._id, hora });
  } catch (err) {
    console.error('Error al confirmar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
