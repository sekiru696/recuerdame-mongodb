const express = require('express');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ObjectId } = require('mongodb');
const { conectar } = require('./db');
const { crearToken, exigirSesion } = require('./auth');

const app = express();
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

app.use(express.json({ limit: '20kb' }));
app.use(express.static('public'));

const limiteGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento.' }
});

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos fallidos desde esta conexión. Intenta nuevamente en 15 minutos.' }
});

app.use('/api', limiteGeneral);

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa', 10);

app.get('/api/salud', async (req, res) => {
  try {
    const db = await conectar();
    await db.command({ ping: 1 });
    res.json({ estado: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo conectar a la base de datos' });
  }
});

app.post('/api/login', limiteLogin, async (req, res) => {
  const { correo, password } = req.body || {};
  if (typeof correo !== 'string' || typeof password !== 'string' || !correo || !password || correo.length > 120 || password.length > 200) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }
  try {
    const db = await conectar();
    const usuarios = db.collection('usuarios');
    const usuario = await usuarios.findOne({ correo: correo.trim().toLowerCase() });

    if (usuario && usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Intenta nuevamente en unos minutos.' });
    }

    // Se compara siempre contra un hash, exista o no el usuario, para que el tiempo de respuesta no lo delate
    const valido = await bcrypt.compare(password, usuario ? usuario.passwordHash : HASH_FALSO);

    if (!usuario || !valido) {
      if (usuario) {
        const intentos = (usuario.intentosFallidos || 0) + 1;
        const cambios = intentos >= MAX_INTENTOS
          ? { $set: { intentosFallidos: 0, bloqueadoHasta: new Date(Date.now() + BLOQUEO_MS) } }
          : { $set: { intentosFallidos: intentos } };
        await usuarios.updateOne({ _id: usuario._id }, cambios);
      }
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    if (usuario.intentosFallidos || usuario.bloqueadoHasta) {
      await usuarios.updateOne({ _id: usuario._id }, { $set: { intentosFallidos: 0 }, $unset: { bloqueadoHasta: '' } });
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
app.use('/api', require('./reportes'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande' });
  }
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Solo enciende el servidor si se ejecuta directamente (npm start).
// Si otro archivo lo importa (por ejemplo las pruebas), no abre el puerto por su cuenta.
if (require.main === module) {
  const PUERTO = process.env.PORT || 3000;
  app.listen(PUERTO, () => {
    console.log(`Servidor listo en http://localhost:${PUERTO}`);
  });
}

module.exports = app;
