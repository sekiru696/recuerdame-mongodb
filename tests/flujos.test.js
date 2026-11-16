// Pruebas de todos los flujos de Recuérdame.
// Requisitos: archivo .env configurado y datos de ejemplo cargados (npm run setup y npm run seed).
// Ejecutar desde la carpeta del proyecto con: npm test
// Las pruebas encienden su propio servidor en un puerto libre, no hace falta ejecutar npm start.
// Para probar un servidor que ya esté encendido, define BASE_URL (por ejemplo http://127.0.0.1:3000).

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { conectar, cerrar } = require('../src/db');

const app = require('../src/app');

let BASE = process.env.BASE_URL || null;
let servidor = null;
const CLAVE = 'clave-de-prueba';

async function llamar(ruta, { metodo = 'GET', token, cuerpo, crudo } = {}) {
  const tieneCuerpo = cuerpo !== undefined || crudo !== undefined;
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(tieneCuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: crudo !== undefined ? crudo : (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined)
  });
  let datos = null;
  try { datos = await res.json(); } catch (e) { datos = null; }
  return { estado: res.status, datos, cabeceras: res.headers };
}

async function iniciarSesion(correo) {
  const r = await llamar('/api/login', { metodo: 'POST', cuerpo: { correo, password: CLAVE } });
  assert.equal(r.estado, 200, 'No se pudo iniciar sesión como ' + correo + ' (estado ' + r.estado + ')');
  return r.datos.token;
}

describe('Recuérdame', () => {
  const t = {};      // tokens por usuario
  const id = {};     // identificadores útiles

  before(async () => {
    if (!BASE) {
      servidor = await new Promise((resolver, rechazar) => {
        const s = app.listen(0, '127.0.0.1', () => resolver(s));
        s.on('error', rechazar);
      });
      BASE = 'http://127.0.0.1:' + servidor.address().port;
    }

    t.cuidador = await iniciarSesion('cuidador@ejemplo.cl');
    t.cuidador2 = await iniciarSesion('cuidador2@ejemplo.cl');
    t.doctor = await iniciarSesion('doctor@ejemplo.cl');
    t.paciente = await iniciarSesion('paciente@ejemplo.cl');

    const pacientes = await llamar('/api/pacientes', { token: t.cuidador });
    id.demo = pacientes.datos.find(p => p.nombre === 'Paciente Demo')._id;

    const ajenos = await llamar('/api/pacientes', { token: t.cuidador2 });
    id.ajeno = ajenos.datos[0]._id;
    const recAjeno = await llamar('/api/recordatorios?pacienteId=' + id.ajeno, { token: t.cuidador2 });
    id.recordatorioAjeno = recAjeno.datos[0]._id;
    id.horaAjena = recAjeno.datos[0].horarios[0];
  });

  after(async () => {
    if (servidor) await new Promise(resolver => servidor.close(resolver));
    // Deja la cuenta usada en la prueba de bloqueo como estaba
    const db = await conectar();
    await db.collection('usuarios').updateOne(
      { correo: 'cuidador2@ejemplo.cl' },
      { $set: { intentosFallidos: 0 }, $unset: { bloqueadoHasta: '' } }
    );
    await cerrar();
  });

  describe('1. Servidor y seguridad básica', () => {
    it('la base de datos responde', async () => {
      const r = await llamar('/api/salud');
      assert.equal(r.estado, 200);
      assert.equal(r.datos.estado, 'ok');
    });

    it('la página principal carga', async () => {
      const res = await fetch(BASE + '/');
      assert.equal(res.status, 200);
    });

    it('envía cabeceras de seguridad y oculta X-Powered-By', async () => {
      const r = await llamar('/api/salud');
      assert.equal(r.cabeceras.get('x-powered-by'), null);
      assert.ok(r.cabeceras.get('content-security-policy'), 'falta Content-Security-Policy');
      assert.ok(r.cabeceras.get('x-content-type-options'), 'falta X-Content-Type-Options');
      assert.ok(r.cabeceras.get('x-frame-options'), 'falta X-Frame-Options');
    });

    it('responde 404 en JSON a una ruta inexistente', async () => {
      const r = await llamar('/api/nada');
      assert.equal(r.estado, 404);
      assert.equal(r.datos.error, 'Ruta no encontrada');
    });

    it('rechaza un JSON mal formado con 400', async () => {
      const r = await llamar('/api/login', { metodo: 'POST', crudo: '{malo' });
      assert.equal(r.estado, 400);
    });
  });

  describe('2. Autenticación', () => {
    it('el cuidador, el doctor y el paciente inician sesión con su tipo de usuario', async () => {
      for (const [correo, rol] of [['cuidador@ejemplo.cl', 'cuidador'], ['doctor@ejemplo.cl', 'doctor'], ['paciente@ejemplo.cl', 'paciente']]) {
        const r = await llamar('/api/login', { metodo: 'POST', cuerpo: { correo, password: CLAVE } });
        assert.equal(r.estado, 200);
        assert.equal(r.datos.usuario.rol, rol);
        assert.ok(r.datos.token);
      }
    });

    it('rechaza un intento de inyección NoSQL en el login', async () => {
      const r = await llamar('/api/login', { metodo: 'POST', cuerpo: { correo: { $ne: null }, password: { $ne: null } } });
      assert.equal(r.estado, 400);
    });

    it('rechaza las rutas protegidas sin token', async () => {
      const r = await llamar('/api/pacientes');
      assert.equal(r.estado, 401);
    });

    it('rechaza un token adulterado', async () => {
      const malo = t.cuidador.slice(0, -3) + 'xyz';
      const r = await llamar('/api/pacientes', { token: malo });
      assert.equal(r.estado, 401);
    });

    it('/api/yo devuelve los datos del usuario con sesión', async () => {
      const r = await llamar('/api/yo', { token: t.doctor });
      assert.equal(r.estado, 200);
      assert.equal(r.datos.rol, 'doctor');
      assert.equal(r.datos.correo, 'doctor@ejemplo.cl');
    });
  });

  describe('3. Permisos por tipo de usuario', () => {
    it('el paciente no puede usar las rutas del cuidador', async () => {
      assert.equal((await llamar('/api/pacientes', { token: t.paciente })).estado, 403);
      assert.equal((await llamar('/api/recordatorios', { token: t.paciente })).estado, 403);
    });

    it('el cuidador no puede usar las rutas del paciente', async () => {
      assert.equal((await llamar('/api/mi-dia', { token: t.cuidador })).estado, 403);
    });

    it('un cuidador no puede ver los recordatorios de un paciente ajeno', async () => {
      const r = await llamar('/api/recordatorios?pacienteId=' + id.ajeno, { token: t.cuidador });
      assert.equal(r.estado, 403);
    });

    it('el doctor puede crear medicamentos pero no citas', async () => {
      const cita = await llamar('/api/recordatorios', {
        metodo: 'POST', token: t.doctor,
        cuerpo: { pacienteId: id.demo, tipo: 'cita', mensaje: 'Cita que no le corresponde', horarios: ['10:00'], repeticion: 'unica' }
      });
      assert.equal(cita.estado, 403);

      const med = await llamar('/api/recordatorios', {
        metodo: 'POST', token: t.doctor,
        cuerpo: { pacienteId: id.demo, tipo: 'medicamento', mensaje: 'Prueba de medicamento del doctor', horarios: ['23:30'], repeticion: 'diaria', detalle: { nombre: 'Prueba', dosis: '1 mg' } }
      });
      assert.equal(med.estado, 201);

      const baja = await llamar('/api/recordatorios/' + med.datos._id, { metodo: 'DELETE', token: t.doctor });
      assert.equal(baja.estado, 200);
    });

    it('el doctor no puede editar una cita', async () => {
      const lista = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&tipo=cita', { token: t.doctor });
      assert.ok(lista.datos.length > 0);
      const r = await llamar('/api/recordatorios/' + lista.datos[0]._id, {
        metodo: 'PATCH', token: t.doctor, cuerpo: { mensaje: 'Intento de edición no permitido' }
      });
      assert.equal(r.estado, 403);
    });
  });

  describe('4. Flujo 1: el cuidador gestiona recordatorios', () => {
    let creado;

    it('crea una cita con sus datos propios (lugar y profesional)', async () => {
      const r = await llamar('/api/recordatorios', {
        metodo: 'POST', token: t.cuidador,
        cuerpo: {
          pacienteId: id.demo, tipo: 'cita', mensaje: 'Prueba: control con la kinesióloga',
          horarios: ['15:00'], repeticion: 'unica', detalle: { lugar: 'Centro de salud', profesional: 'Kinesióloga Rojas' }
        }
      });
      assert.equal(r.estado, 201);
      assert.equal(r.datos.detalle.lugar, 'Centro de salud');
      assert.equal(r.datos.activo, true);
      creado = r.datos;
    });

    it('la lista incluye el recordatorio creado y el filtro por tipo funciona', async () => {
      const todos = await llamar('/api/recordatorios?pacienteId=' + id.demo, { token: t.cuidador });
      assert.ok(todos.datos.some(r => r._id === creado._id));

      const citas = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&tipo=cita', { token: t.cuidador });
      assert.ok(citas.datos.length > 0);
      assert.ok(citas.datos.every(r => r.tipo === 'cita'));
    });

    it('rechaza un tipo inválido en el filtro', async () => {
      const r = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&tipo=otro', { token: t.cuidador });
      assert.equal(r.estado, 400);
    });

    it('rechaza un horario inválido al crear', async () => {
      const r = await llamar('/api/recordatorios', {
        metodo: 'POST', token: t.cuidador,
        cuerpo: { pacienteId: id.demo, tipo: 'cita', mensaje: 'Hora imposible', horarios: ['25:99'], repeticion: 'unica' }
      });
      assert.equal(r.estado, 400);
    });

    it('rechaza un mensaje demasiado corto', async () => {
      const r = await llamar('/api/recordatorios', {
        metodo: 'POST', token: t.cuidador,
        cuerpo: { pacienteId: id.demo, tipo: 'cita', mensaje: 'hola', horarios: ['10:00'], repeticion: 'unica' }
      });
      assert.equal(r.estado, 400);
    });

    it('edita el mensaje y el horario, y guarda la fecha de edición', async () => {
      const r = await llamar('/api/recordatorios/' + creado._id, {
        metodo: 'PATCH', token: t.cuidador, cuerpo: { mensaje: 'Prueba: control editado', horarios: ['16:00'] }
      });
      assert.equal(r.estado, 200);
      assert.equal(r.datos.mensaje, 'Prueba: control editado');
      assert.deepEqual(r.datos.horarios, ['16:00']);
      assert.ok(r.datos.actualizadoEn);
    });

    it('rechaza una edición con horario inválido y con identificador inválido', async () => {
      const malo = await llamar('/api/recordatorios/' + creado._id, { metodo: 'PATCH', token: t.cuidador, cuerpo: { horarios: ['99:99'] } });
      assert.equal(malo.estado, 400);
      const sinId = await llamar('/api/recordatorios/abc', { metodo: 'PATCH', token: t.cuidador, cuerpo: { mensaje: 'Mensaje válido' } });
      assert.equal(sinId.estado, 400);
    });

    it('desactiva el recordatorio (baja lógica) y ya no aparece en la lista', async () => {
      const baja = await llamar('/api/recordatorios/' + creado._id, { metodo: 'DELETE', token: t.cuidador });
      assert.equal(baja.estado, 200);

      const lista = await llamar('/api/recordatorios?pacienteId=' + id.demo, { token: t.cuidador });
      assert.ok(!lista.datos.some(r => r._id === creado._id));
    });

    it('no permite editar un recordatorio desactivado', async () => {
      const r = await llamar('/api/recordatorios/' + creado._id, { metodo: 'PATCH', token: t.cuidador, cuerpo: { mensaje: 'Intento sobre un desactivado' } });
      assert.equal(r.estado, 409);
    });
  });

  describe('5. Paginación y orden', () => {
    it('devuelve la página pedida con el total y el número de páginas', async () => {
      const r = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=1&limite=2', { token: t.cuidador });
      assert.equal(r.estado, 200);
      assert.ok(r.datos.datos.length <= 2);
      assert.equal(r.datos.pagina, 1);
      assert.equal(r.datos.limite, 2);
      assert.equal(r.datos.paginas, Math.ceil(r.datos.total / 2));
    });

    it('la página 2 trae recordatorios distintos a los de la página 1', async () => {
      const p1 = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=1&limite=2', { token: t.cuidador });
      const p2 = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=2&limite=2', { token: t.cuidador });
      assert.ok(p2.datos.datos.length > 0);
      const ids1 = new Set(p1.datos.datos.map(r => r._id));
      assert.ok(p2.datos.datos.every(r => !ids1.has(r._id)));
    });

    it('una página fuera de rango queda en la última', async () => {
      const r = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=999&limite=2', { token: t.cuidador });
      assert.equal(r.estado, 200);
      assert.equal(r.datos.pagina, r.datos.paginas);
    });

    it('rechaza una página inválida y un orden inválido', async () => {
      assert.equal((await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=0', { token: t.cuidador })).estado, 400);
      assert.equal((await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=1&orden=otro', { token: t.cuidador })).estado, 400);
    });

    it('limita el tamaño de página a 50', async () => {
      const r = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=1&limite=500', { token: t.cuidador });
      assert.equal(r.datos.limite, 50);
    });

    it('el orden por hora entrega los avisos de la hora más temprana a la más tardía', async () => {
      const r = await llamar('/api/recordatorios?pacienteId=' + id.demo + '&pagina=1&limite=50&orden=hora', { token: t.cuidador });
      const primeras = r.datos.datos.map(x => [...x.horarios].sort()[0]);
      assert.deepEqual(primeras, [...primeras].sort());
    });
  });

  describe('6. Flujo 2: el paciente confirma y el historial lo refleja', () => {
    it('el paciente ve sus avisos de hoy ordenados por hora', async () => {
      const r = await llamar('/api/mi-dia', { token: t.paciente });
      assert.equal(r.estado, 200);
      assert.ok(r.datos.length > 0);
      const horas = r.datos.map(x => x.hora);
      assert.deepEqual(horas, [...horas].sort());
      assert.ok(r.datos.every(x => ['pendiente', 'confirmado'].includes(x.estado)));
    });

    it('confirma un aviso, queda confirmado y confirmar de nuevo no duplica', async () => {
      const antes = await llamar('/api/mi-dia', { token: t.paciente });
      const pendiente = antes.datos.find(x => x.estado === 'pendiente');
      const objetivo = pendiente || antes.datos.find(x => x.estado === 'confirmado');
      const ruta = '/api/mi-dia/' + objetivo.recordatorioId + '/confirmar';

      if (pendiente) {
        const primera = await llamar(ruta, { metodo: 'POST', token: t.paciente, cuerpo: { hora: objetivo.hora } });
        assert.equal(primera.estado, 201);
        assert.equal(primera.datos.mensaje, 'Confirmado');
      }

      const despues = await llamar('/api/mi-dia', { token: t.paciente });
      const mismo = despues.datos.find(x => x.recordatorioId === objetivo.recordatorioId && x.hora === objetivo.hora);
      assert.equal(mismo.estado, 'confirmado');

      const repetida = await llamar(ruta, { metodo: 'POST', token: t.paciente, cuerpo: { hora: objetivo.hora } });
      assert.equal(repetida.estado, 200);
      assert.equal(repetida.datos.mensaje, 'Ya estaba confirmado');
    });

    it('rechaza una hora que no pertenece al recordatorio y una hora mal escrita', async () => {
      const lista = await llamar('/api/mi-dia', { token: t.paciente });
      const ruta = '/api/mi-dia/' + lista.datos[0].recordatorioId + '/confirmar';
      assert.equal((await llamar(ruta, { metodo: 'POST', token: t.paciente, cuerpo: { hora: '03:33' } })).estado, 400);
      assert.equal((await llamar(ruta, { metodo: 'POST', token: t.paciente, cuerpo: { hora: 'abc' } })).estado, 400);
    });

    it('un paciente no puede confirmar el recordatorio de otro paciente', async () => {
      const r = await llamar('/api/mi-dia/' + id.recordatorioAjeno + '/confirmar', {
        metodo: 'POST', token: t.paciente, cuerpo: { hora: id.horaAjena }
      });
      assert.equal(r.estado, 404);
    });

    it('el doctor ve el historial más reciente primero, incluida la confirmación de hoy', async () => {
      const r = await llamar('/api/pacientes/' + id.demo + '/historial?limite=10', { token: t.doctor });
      assert.equal(r.estado, 200);
      assert.ok(r.datos.length > 0);
      const fechas = r.datos.map(x => new Date(x.fechaProgramada).getTime());
      assert.deepEqual(fechas, [...fechas].sort((a, b) => b - a));
      assert.ok(r.datos.some(x => x.estado === 'confirmado'));
    });

    it('el historial rechaza a un cuidador ajeno y a un paciente', async () => {
      assert.equal((await llamar('/api/pacientes/' + id.demo + '/historial', { token: t.cuidador2 })).estado, 403);
      assert.equal((await llamar('/api/pacientes/' + id.demo + '/historial', { token: t.paciente })).estado, 403);
    });
  });

  describe('7. Agregaciones', () => {
    it('el cumplimiento semanal devuelve porcentajes coherentes', async () => {
      const r = await llamar('/api/pacientes/' + id.demo + '/cumplimiento?semanas=4', { token: t.cuidador });
      assert.equal(r.estado, 200);
      assert.ok(r.datos.length > 0);
      for (const s of r.datos) {
        assert.ok(s.total > 0);
        assert.ok(s.confirmados <= s.total);
        assert.ok(s.porcentaje >= 0 && s.porcentaje <= 100);
        assert.ok(Math.abs(s.porcentaje - (s.confirmados / s.total * 100)) < 0.06);
      }
      const semanas = r.datos.map(s => new Date(s.semana).getTime());
      assert.deepEqual(semanas, [...semanas].sort((a, b) => a - b));
    });

    it('los no atendidos por franja vienen ordenados de la peor franja a la mejor', async () => {
      const r = await llamar('/api/pacientes/' + id.demo + '/franjas?dias=28', { token: t.doctor });
      assert.equal(r.estado, 200);
      assert.ok(r.datos.length > 0);
      for (const f of r.datos) {
        assert.ok(['manana', 'tarde', 'noche'].includes(f.franja));
        assert.ok(f.noAtendidos <= f.total);
        assert.ok(f.porcentajeNoAtendidos >= 0 && f.porcentajeNoAtendidos <= 100);
      }
      const cantidades = r.datos.map(f => f.noAtendidos);
      assert.deepEqual(cantidades, [...cantidades].sort((a, b) => b - a));
    });

    it('valida los parámetros de las agregaciones', async () => {
      assert.equal((await llamar('/api/pacientes/' + id.demo + '/cumplimiento?semanas=99', { token: t.cuidador })).estado, 400);
      assert.equal((await llamar('/api/pacientes/' + id.demo + '/franjas?dias=abc', { token: t.cuidador })).estado, 400);
      assert.equal((await llamar('/api/pacientes/abc/cumplimiento', { token: t.cuidador })).estado, 400);
    });

    it('los reportes rechazan al paciente y a un cuidador ajeno', async () => {
      assert.equal((await llamar('/api/pacientes/' + id.demo + '/cumplimiento', { token: t.paciente })).estado, 403);
      assert.equal((await llamar('/api/pacientes/' + id.demo + '/franjas', { token: t.cuidador2 })).estado, 403);
    });
  });

  describe('8. Validación en la base de datos', () => {
    it('MongoDB rechaza un recordatorio con horario inválido (esquema $jsonSchema)', async () => {
      const db = await conectar();
      const paciente = await db.collection('usuarios').findOne({ correo: 'paciente@ejemplo.cl' });
      await assert.rejects(
        db.collection('recordatorios').insertOne({
          pacienteId: paciente._id, creadoPor: paciente._id, tipo: 'medicamento',
          mensaje: 'Horario imposible', horarios: ['25:99'], repeticion: 'diaria', activo: true, creadoEn: new Date()
        }),
        err => err.code === 121
      );
    });

    it('MongoDB rechaza una edición con un tipo fuera de la lista', async () => {
      const db = await conectar();
      const rec = await db.collection('recordatorios').findOne({ activo: true });
      await assert.rejects(
        db.collection('recordatorios').updateOne({ _id: rec._id }, { $set: { tipo: 'inventado' } }),
        err => err.code === 121
      );
    });

    it('el índice único impide dos usuarios con el mismo correo', async () => {
      const db = await conectar();
      await assert.rejects(
        db.collection('usuarios').insertOne({ nombre: 'Duplicado', correo: 'cuidador@ejemplo.cl', passwordHash: 'x', rol: 'cuidador' }),
        err => err.code === 11000
      );
    });

    it('las contraseñas se guardan cifradas', async () => {
      const db = await conectar();
      const u = await db.collection('usuarios').findOne({ correo: 'cuidador@ejemplo.cl' });
      assert.match(u.passwordHash, /^\$2[aby]\$/);
      assert.notEqual(u.passwordHash, CLAVE);
    });
  });

  describe('9. Bloqueo de cuenta (se ejecuta al final)', () => {
    it('tras 5 contraseñas incorrectas la cuenta se bloquea, aun con la clave correcta', async () => {
      for (let i = 0; i < 5; i++) {
        const r = await llamar('/api/login', { metodo: 'POST', cuerpo: { correo: 'cuidador2@ejemplo.cl', password: 'incorrecta' } });
        assert.equal(r.estado, 401);
        assert.equal(r.datos.error, 'Correo o contraseña incorrectos');
      }
      const bloqueada = await llamar('/api/login', { metodo: 'POST', cuerpo: { correo: 'cuidador2@ejemplo.cl', password: CLAVE } });
      assert.equal(bloqueada.estado, 429);
    });
  });
});
