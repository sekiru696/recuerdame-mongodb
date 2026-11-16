# Recuérdame

Aplicación web de recordatorios por voz para personas con alzhéimer. El cuidador y el doctor programan avisos (medicamentos, citas y fechas especiales), el paciente los ve y los confirma, y todo se guarda en MongoDB. Proyecto integrador de bases de datos no relacionales.

## Tecnologías

- Node.js y Express (API y servidor web)
- MongoDB Atlas con el driver oficial
- JWT y bcrypt (sesión y contraseñas)
- helmet y express-rate-limit (seguridad)
- HTML, CSS y JavaScript sin frameworks (interfaz)

## Requisitos

- Node.js 20 o superior
- Una cuenta gratuita de MongoDB Atlas con un clúster creado
- La IP desde la que se ejecuta debe estar autorizada en Atlas (Security, Network Access)

## Instalación

```
git clone https://github.com/sekiru696/recuerdame-mongodb.git
cd recuerdame-mongodb
npm install
```

## Configuración

1. Copia `.env.example` como `.env`.
2. Completa `MONGODB_URI` con la cadena de conexión de tu clúster (Atlas, Connect, Drivers).
3. Completa `JWT_SECRET` con una clave aleatoria de al menos 32 caracteres. Se puede generar con:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

El archivo `.env` no se sube al repositorio. Si `JWT_SECRET` falta o es corta, el servidor no arranca.

## Preparar la base de datos

```
npm run setup
npm run seed
```

- `setup` crea las colecciones con sus reglas de validación y los índices.
- `seed` carga datos de ejemplo. Borra los recordatorios y registros existentes antes de cargarlos.

## Ejecutar

```
npm start
```

Abrir http://localhost:3000

## Pruebas

```
npm test
```

Ejecuta las pruebas automáticas de los dos flujos, los permisos, la paginación, las agregaciones, la validación de MongoDB y los casos límite. Las pruebas encienden su propio servidor en un puerto libre, así que no hace falta ejecutar `npm start` antes. Necesitan el `.env` configurado y los datos de ejemplo cargados (`npm run setup` y `npm run seed`).

La última prueba bloquea la cuenta `cuidador2@ejemplo.cl` y al terminar la deja desbloqueada.

## Usuarios de ejemplo

Todos usan la contraseña `clave-de-prueba`.

| Correo | Tipo | Pacientes a su cargo |
|---|---|---|
| cuidador@ejemplo.cl | cuidador | Paciente Demo y Paciente Dos |
| cuidador2@ejemplo.cl | cuidador | Paciente Tres |
| doctor@ejemplo.cl | doctor | Paciente Demo y Paciente Dos |
| paciente@ejemplo.cl | paciente | (es el propio paciente) |
| paciente2@ejemplo.cl | paciente | (es el propio paciente) |
| paciente3@ejemplo.cl | paciente | (es el propio paciente) |

## Qué puede hacer cada tipo de usuario

| Tipo | Funciones |
|---|---|
| Cuidador | Crear, filtrar, ordenar, paginar, editar y desactivar recordatorios de todos los tipos de sus pacientes. Ver el historial y los reportes |
| Doctor | Ver los recordatorios, el historial y los reportes de sus pacientes. Crear, editar y desactivar solo medicamentos |
| Paciente | Ver sus avisos de hoy, escucharlos y confirmarlos con el botón "Ya lo hice" |

La baja de un recordatorio es lógica (`activo: false`) para conservar el historial.

## Reportes (agregaciones)

La pantalla Reportes, disponible para el cuidador y el doctor, muestra dos agregaciones de MongoDB:

1. **Cumplimiento por semana:** porcentaje de avisos confirmados en las últimas 4 semanas.
2. **Avisos no atendidos por franja horaria:** en qué momento del día se atienden menos los avisos.

El detalle de cada pipeline está en `docs/semana6/agregaciones.md`.

## Seguridad

- Contraseñas cifradas con bcrypt y sesión con token JWT (HS256, 8 horas).
- Control de acceso por tipo de usuario y por paciente asignado.
- Validación de entradas en la API y reglas `$jsonSchema` en la base de datos.
- Límite de intentos de inicio de sesión y bloqueo de la cuenta por 15 minutos tras 5 fallos (`npm run desbloquear -- correo` la desbloquea).
- Cabeceras de seguridad con helmet y mensajes de error que no revelan datos internos.
- Credenciales fuera del repositorio (`.env`).

## Índices

Hay dos índices propios además del índice único del correo. Su justificación y la evidencia con `explain` están en `docs/semana5/indices.md`. Para repetir la medición:

```
npm run explain
npm run explain-agregaciones
```

Para medir con muchos datos (60.000 registros de pacientes ficticios) y luego limpiarlos:

```
npm run carga-masiva
npm run explain
npm run carga-masiva -- --limpiar
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Enciende el servidor |
| `npm test` | Ejecuta las pruebas automáticas (encienden su propio servidor) |
| `npm run setup` | Crea colecciones, validaciones e índices |
| `npm run seed` | Carga los datos de ejemplo |
| `npm run explain` | Compara las consultas de lista e historial con y sin índice |
| `npm run explain-agregaciones` | Compara las dos agregaciones con y sin índice |
| `npm run carga-masiva` | Inserta registros de pacientes ficticios (con `-- --limpiar` los elimina) |
| `npm run desbloquear -- correo` | Desbloquea una cuenta bloqueada |
| `node probar-conexion.js` | Comprueba que la conexión a Atlas funciona |
| `node src/casos-limite.js` | Muestra dos casos límite rechazados por MongoDB (horario inválido y correo duplicado) |
| `node src/editar-ejemplo.js` | Edita un recordatorio con `$set` y muestra que MongoDB rechaza una edición con horario inválido |

## Documentación

- `docs/semana1/`: ficha del proyecto y comparación relacional frente a documental
- `docs/semana2/`: historias de usuario, primer modelo y decisión de incrustar o referenciar
- `docs/semana3/`: modelo versión 2 y evidencia
- `docs/semana4/`: plan y bitácora del primer hito
- `docs/semana5/`: índices con evidencia y bitácora
- `docs/semana6/`: agregaciones y bitácora
- `docs/semana7/`: modelo final (diagrama, diccionario de campos y decisiones), análisis de rendimiento, resultados de pruebas y bitácora
- `docs/semana8/`: ensayo de instalación desde cero, guion de la defensa, defectos conocidos y límites, y bitácora

## Estructura

```
src/
  app.js                    servidor, seguridad y sesión
  auth.js                   token y control de acceso por tipo de usuario
  recordatorios.js          rutas del cuidador y del doctor
  paciente.js               rutas del paciente (avisos de hoy y confirmación)
  reportes.js               rutas de las agregaciones
  agregaciones.js           pipelines de las dos agregaciones
  db.js                     conexión a MongoDB
  setup.js                  colecciones, validaciones e índices
  seed.js                   datos de ejemplo
  explain.js                comparación de consultas con y sin índice
  explain-agregaciones.js   comparación de las agregaciones con y sin índice
  carga-masiva.js           datos de prueba en volumen
  casos-limite.js           dos casos límite rechazados por la base de datos
  desbloquear.js            desbloquea una cuenta bloqueada
tests/
  flujos.test.js            pruebas automáticas de los flujos
public/
  index.html                interfaz
docs/                       documentación por semana
```

## Problemas frecuentes

- **"No se pudo conectar a la base de datos" o `SSL alert number 80`:** la IP actual no está autorizada en Atlas. Agrégala en Security, Network Access, y reinicia el servidor.
- **`querySrv ECONNREFUSED`:** la red bloquea la consulta DNS. El proyecto fuerza los DNS de Google desde `src/db.js`.
- **"Demasiados intentos fallidos":** la cuenta quedó bloqueada. Desbloquéala con `npm run desbloquear -- correo`.
