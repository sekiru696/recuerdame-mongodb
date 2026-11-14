const jwt = require('jsonwebtoken');

function crearToken(usuario) {
  return jwt.sign(
    { id: usuario._id.toString(), rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function exigirSesion(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Sesión inválida o vencida' });
  }
}

function exigirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

module.exports = { crearToken, exigirSesion, exigirRoles };
