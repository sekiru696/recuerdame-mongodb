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
| Cuidador | Crear, filtrar, editar y desactivar recordatorios de todos los tipos de sus pacientes. Ver el historial de cumplimiento |
| Doctor | Ver los recordatorios y el historial de sus pacientes. Crear, editar y desactivar solo medicamentos |
| Paciente | Ver sus avisos de hoy, escucharlos y confirmarlos con el botón "Ya lo hice" |

La baja de un recordatorio es lógica (`activo: false`) para conservar el historial.

## Seguridad

- Contraseñas cifradas con bcrypt y sesión con token JWT (HS256, 8 horas).
- Control de acceso por tipo de usuario y por paciente asignado.
- Validación de entradas en la API y reglas `$jsonSchema` en la base de datos.
- Límite de intentos de inicio de sesión y bloqueo de la cuenta por 15 minutos tras 5 fallos (`npm run desbloquear -- correo` la desbloquea).
- Cabeceras de seguridad con helmet y mensajes de error que no revelan datos internos.
- Credenciales fuera del repositorio (`.env`).

## Índices

Los dos índices y su evidencia con `explain` están en `docs/semana5/indices.md`. Para repetir la medición:

```
npm run explain
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Enciende el servidor |
| `npm run setup` | Crea colecciones, validaciones e índices |
| `npm run seed` | Carga los datos de ejemplo |
| `npm run explain` | Compara las consultas con y sin índice |
| `npm run desbloquear -- correo` | Desbloquea una cuenta bloqueada |

## Documentación por semana

- `docs/semana1/`: ficha del proyecto y comparación relacional frente a documental
- `docs/semana2/`: historias de usuario, modelo y decisión de incrustar o referenciar
- `docs/semana3/`: modelo versión 2, diccionario de campos y evidencia
- `docs/semana4/`: plan y bitácora del primer hito
- `docs/semana5/`: índices con evidencia y bitácora

## Estructura

```
src/
  app.js            servidor, seguridad y sesión
  auth.js           token y control de acceso por tipo de usuario
  recordatorios.js  rutas del cuidador y del doctor
  paciente.js       rutas del paciente (avisos de hoy y confirmación)
  db.js             conexión a MongoDB
  setup.js          colecciones, validaciones e índices
  seed.js           datos de ejemplo
  explain.js        comparación de consultas con y sin índice
public/
  index.html        interfaz
docs/               documentación por semana
```

## Problemas frecuentes

- **"No se pudo conectar a la base de datos" o `SSL alert number 80`:** la IP actual no está autorizada en Atlas. Agrégala en Security, Network Access, y reinicia el servidor.
- **`querySrv ECONNREFUSED`:** la red bloquea la consulta DNS. El proyecto fuerza los DNS de Google desde `src/db.js`.
- **"Demasiados intentos fallidos":** la cuenta quedó bloqueada. Desbloquéala con `npm run desbloquear -- correo`.
