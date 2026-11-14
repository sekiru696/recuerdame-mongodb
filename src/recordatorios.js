const express = require('express');
const { ObjectId } = require('mongodb');
const { conectar } = require('./db');
const { exigirSesion, exigirRoles } = require('./auth');

const router = express.Router();
const gestores = [exigirSesion, exigirRoles('cuidador', 'doctor')];

const TIPOS = ['medicamento', 'cita', 'fecha_especial'];
const REPETICIONES = ['unica', 'diaria', 'semanal'];
const HORA = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

// Qué tipos de recordatorio puede crear o modificar cada rol
const TIPOS_POR_ROL = {
  cuidador: ['medicamento', 'cita', 'fecha_especial'],
  doctor: ['medicamento']
};

function puedeGestionar(rol, tipo) {
  return (TIPOS_POR_ROL[rol] || []).includes(tipo);
}

async function idsDePacientes(db, usuarioId) {
  const usuario = await db.collection('usuarios').findOne({ _id: new ObjectId(usuarioId) });
  return (usuario && usuario.pacientesIds) || [];
}

router.get('/pacientes', gestores, async (req, res) => {
  try {
    const db = await conectar();
    const ids = await idsDePacientes(db, req.usuario.id);
    const pacientes = await db.collection('usuarios')
      .find({ _id: { $in: ids } }, { projection: { nombre: 1 } })
      .toArray();
    res.json(pacientes);
  } catch (err) {
    console.error('Error al listar pacientes:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/recordatorios', gestores, async (req, res) => {
  const { pacienteId, tipo, mensaje, horarios, repeticion, detalle, diasSemana } = req.body || {};

  if (!ObjectId.isValid(pacienteId)) {
    return res.status(400).json({ error: 'Paciente inválido' });
  }
  if (!TIPOS.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido. Usa: ' + TIPOS.join(', ') });
  }
  if (!puedeGestionar(req.usuario.rol, tipo)) {
    return res.status(403).json({ error: 'Tu tipo de usuario no puede crear recordatorios de tipo ' + tipo });
  }
  if (typeof mensaje !== 'string' || mensaje.trim().length < 5) {
    return res.status(400).json({ error: 'El mensaje debe tener al menos 5 caracteres' });
  }
  if (!Array.isArray(horarios) || horarios.length === 0 || !horarios.every(h => HORA.test(h))) {
    return res.status(400).json({ error: 'Los horarios deben tener formato HH:MM (00:00 a 23:59)' });
  }
  if (!REPETICIONES.includes(repeticion)) {
    return res.status(400).json({ error: 'Repetición inválida. Usa: ' + REPETICIONES.join(', ') });
  }

  try {
    const db = await conectar();
    const ids = await idsDePacientes(db, req.usuario.id);
    if (!ids.some(id => id.toString() === pacienteId)) {
      return res.status(403).json({ error: 'Ese paciente no está a tu cargo' });
    }

    const documento = {
      pacienteId: new ObjectId(pacienteId),
      creadoPor: new ObjectId(req.usuario.id),
      tipo,
      mensaje: mensaje.trim(),
      horarios,
      repeticion,
      activo: true,
      creadoEn: new Date()
    };
    if (detalle && typeof detalle === 'object') documento.detalle = detalle;
    if (repeticion === 'semanal' && Array.isArray(diasSemana)) documento.diasSemana = diasSemana;

    const resultado = await db.collection('recordatorios').insertOne(documento);
    res.status(201).json({ _id: resultado.insertedId, ...documento });
  } catch (err) {
    console.error('Error al crear recordatorio:', err.message);
    if (err.code === 121) {
      return res.status(400).json({ error: 'Los datos no cumplen las reglas de validación' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/recordatorios', gestores, async (req, res) => {
  try {
    const db = await conectar();
    const permitidos = await idsDePacientes(db, req.usuario.id);
    const filtro = { pacienteId: { $in: permitidos }, activo: true };

    const { pacienteId, tipo } = req.query;
    if (pacienteId) {
      if (!ObjectId.isValid(pacienteId) || !permitidos.some(id => id.toString() === pacienteId)) {
        return res.status(403).json({ error: 'Ese paciente no está a tu cargo' });
      }
      filtro.pacienteId = new ObjectId(pacienteId);
    }
    if (tipo) {
      if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
      filtro.tipo = tipo;
    }

    const lista = await db.collection('recordatorios')
      .find(filtro)
      .sort({ creadoEn: -1 })
      .toArray();
    res.json(lista);
  } catch (err) {
    console.error('Error al listar recordatorios:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/pacientes/:id/historial', gestores, async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 20, 1), 100);

  try {
    const db = await conectar();
    const permitidos = await idsDePacientes(db, req.usuario.id);
    if (!permitidos.some(p => p.toString() === id)) {
      return res.status(403).json({ error: 'Ese paciente no está a tu cargo' });
    }
    const registros = await db.collection('registros')
      .find({ pacienteId: new ObjectId(id) })
      .sort({ fechaProgramada: -1 })
      .limit(limite)
      .toArray();
    res.json(registros);
  } catch (err) {
    console.error('Error al consultar el historial:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function obtenerPropio(db, req, id) {
  if (!ObjectId.isValid(id)) {
    return { status: 400, error: 'Identificador inválido' };
  }
  const recordatorio = await db.collection('recordatorios').findOne({ _id: new ObjectId(id) });
  if (!recordatorio) {
    return { status: 404, error: 'Recordatorio no encontrado' };
  }
  const permitidos = await idsDePacientes(db, req.usuario.id);
  if (!permitidos.some(p => p.toString() === recordatorio.pacienteId.toString())) {
    return { status: 403, error: 'Ese recordatorio no pertenece a un paciente a tu cargo' };
  }
  if (!puedeGestionar(req.usuario.rol, recordatorio.tipo)) {
    return { status: 403, error: 'Tu tipo de usuario no puede modificar recordatorios de tipo ' + recordatorio.tipo };
  }
  if (!recordatorio.activo) {
    return { status: 409, error: 'El recordatorio está desactivado' };
  }
  return { recordatorio };
}

router.patch('/recordatorios/:id', gestores, async (req, res) => {
  const { tipo, mensaje, horarios, repeticion, detalle, diasSemana } = req.body || {};
  const cambios = {};

  if (tipo !== undefined) {
    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido. Usa: ' + TIPOS.join(', ') });
    if (!puedeGestionar(req.usuario.rol, tipo)) {
      return res.status(403).json({ error: 'Tu tipo de usuario no puede usar el tipo ' + tipo });
    }
    cambios.tipo = tipo;
  }
  if (mensaje !== undefined) {
    if (typeof mensaje !== 'string' || mensaje.trim().length < 5) {
      return res.status(400).json({ error: 'El mensaje debe tener al menos 5 caracteres' });
    }
    cambios.mensaje = mensaje.trim();
  }
  if (horarios !== undefined) {
    if (!Array.isArray(horarios) || horarios.length === 0 || !horarios.every(h => HORA.test(h))) {
      return res.status(400).json({ error: 'Los horarios deben tener formato HH:MM (00:00 a 23:59)' });
    }
    cambios.horarios = horarios;
  }
  if (repeticion !== undefined) {
    if (!REPETICIONES.includes(repeticion)) {
      return res.status(400).json({ error: 'Repetición inválida. Usa: ' + REPETICIONES.join(', ') });
    }
    cambios.repeticion = repeticion;
  }
  if (detalle !== undefined) {
    if (typeof detalle !== 'object' || detalle === null || Array.isArray(detalle)) {
      return res.status(400).json({ error: 'El detalle debe ser un objeto' });
    }
    cambios.detalle = detalle;
  }
  if (diasSemana !== undefined) {
    if (!Array.isArray(diasSemana) || !diasSemana.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
      return res.status(400).json({ error: 'Los días deben ser números de 0 a 6' });
    }
    cambios.diasSemana = diasSemana;
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No enviaste ningún campo para modificar' });
  }

  try {
    const db = await conectar();
    const r = await obtenerPropio(db, req, req.params.id);
    if (r.error) return res.status(r.status).json({ error: r.error });

    cambios.actualizadoEn = new Date();
    await db.collection('recordatorios').updateOne({ _id: r.recordatorio._id }, { $set: cambios });
    const actualizado = await db.collection('recordatorios').findOne({ _id: r.recordatorio._id });
    res.json(actualizado);
  } catch (err) {
    console.error('Error al editar:', err.message);
    if (err.code === 121) {
      return res.status(400).json({ error: 'Los datos no cumplen las reglas de validación' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/recordatorios/:id', gestores, async (req, res) => {
  try {
    const db = await conectar();
    const r = await obtenerPropio(db, req, req.params.id);
    if (r.error) return res.status(r.status).json({ error: r.error });

    await db.collection('recordatorios').updateOne(
      { _id: r.recordatorio._id },
      { $set: { activo: false, desactivadoEn: new Date() } }
    );
    res.json({ mensaje: 'Recordatorio desactivado', _id: r.recordatorio._id });
  } catch (err) {
    console.error('Error al desactivar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
