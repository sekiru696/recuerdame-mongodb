const express = require('express');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { conectar } = require('./db');
const { crearToken, exigirSesion } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/api/salud', async (req, res) => {
  try {
    const db = await conectar();
    await db.command({ ping: 1 });
    res.json({ estado: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body || {};
  if (typeof correo !== 'string' || typeof password !== 'string' || !correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }
  try {
    const db = await conectar();
    const usuario = await db.collection('usuarios').findOne({ correo: correo.trim().toLowerCase() });
    const valido = usuario && await bcrypt.compare(password, usuario.passwordHash);
    if (!valido) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    res.json({
      token: crearToken(usuario),
      usuario: { nombre: usuario.nombre, rol: usuario.rol }
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/yo', exigirSesion, async (req, res) => {
  try {
    const db = await conectar();
    const u = await db.collection('usuarios').findOne(
      { _id: new ObjectId(req.usuario.id) },
      { projection: { nombre: 1, correo: 1, rol: 1 } }
    );
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ nombre: u.nombre, correo: u.correo, rol: u.rol });
  } catch (err) {
    console.error('Error en /api/yo:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.use('/api', require('./recordatorios'));
app.use('/api', require('./paciente'));

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor listo en http://localhost:${PUERTO}`);
});
