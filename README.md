# Recuérdame

Aplicación web de recordatorios por voz para personas con alzhéimer. El cuidador programa avisos (medicamentos, citas y fechas especiales) y el sistema guarda todo en MongoDB. Proyecto integrador de bases de datos no relacionales.

## Tecnologías

- Node.js y Express (API y servidor web)
- MongoDB Atlas (base de datos)
- JWT y bcrypt (sesión y contraseñas)
- HTML, CSS y JavaScript (interfaz)

## Requisitos

- Node.js 20 o superior
- Una cuenta gratuita de MongoDB Atlas con un clúster creado
- La IP desde la que se ejecuta debe estar autorizada en Atlas (Security → Network Access)

## Instalación

```
git clone https://github.com/sekiru696/recuerdame-mongodb.git
cd recuerdame-mongodb
npm install
```

## Configuración

1. Copia `.env.example` como `.env`.
2. Completa `MONGODB_URI` con la cadena de conexión de tu clúster (Atlas → Connect → Drivers).
3. Completa `JWT_SECRET` con una clave larga y aleatoria. Se puede generar con:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

El archivo `.env` no se sube al repositorio.

## Preparar la base de datos

```
npm run setup
npm run seed
```

- `setup` crea las colecciones con sus reglas de validación y el índice único del correo.
- `seed` carga datos de ejemplo. Borra los recordatorios y registros existentes antes de cargarlos.

## Ejecutar

```
npm start
```

Abrir http://localhost:3000

## Usuarios de ejemplo

Todos usan la contraseña `clave-de-prueba`.

| Correo | Rol | Pacientes a su cargo |
|---|---|---|
| cuidador@ejemplo.cl | cuidador | Paciente Demo y Paciente Dos |
| cuidador2@ejemplo.cl | cuidador | Paciente Tres |

## Flujo disponible

1. Iniciar sesión como cuidador.
2. Elegir un paciente.
3. Crear, filtrar por tipo, editar y desactivar recordatorios (baja lógica).
4. Escuchar el mensaje con la voz del navegador.

## Documentación del diseño

- Ficha del proyecto: `docs/semana1/`
- Historias de usuario, modelo y decisión de incrustar o referenciar: `docs/semana2/`
- Modelo versión 2, diccionario de campos y evidencia: `docs/semana3/`

## Estructura

```
src/
  app.js            servidor y rutas de sesión
  auth.js           token y control de acceso por rol
  recordatorios.js  rutas de recordatorios
  db.js             conexión a MongoDB
  setup.js          colecciones, validaciones e índices
  seed.js           datos de ejemplo
public/
  index.html        interfaz
docs/               documentación por semana
```

## Problemas frecuentes

- **"No se pudo conectar a la base de datos":** la IP actual no está autorizada en Atlas. Agrégala en Security → Network Access y reinicia el servidor.
- **`querySrv ECONNREFUSED`:** la red bloquea la consulta DNS. El proyecto fuerza los DNS de Google desde `src/db.js`.