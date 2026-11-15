# Resultados de las pruebas (Semana 7)

Las pruebas están en `tests/flujos.test.js` y se ejecutan con `npm test`, con el servidor encendido y los datos de ejemplo cargados. Usan el ejecutor de pruebas incluido en Node.js y hacen llamadas reales a la API y a MongoDB Atlas.

La salida completa está en `docs/semana7/resultados-pruebas.txt`.

## Resumen

| Total | Aprobadas | Fallidas | Canceladas | Duración |
|---|---|---|---|---|
| 45 | 45 | 0 | 0 | 19,1 s |

## Qué cubre cada grupo

| Grupo | Pruebas | Qué comprueba |
|---|---|---|
| 1. Servidor y seguridad básica | 5 | Base de datos y página responden, cabeceras de seguridad, 404 en JSON y rechazo de JSON mal formado |
| 2. Autenticación | 5 | Inicio de sesión de los tres tipos de usuario, rechazo de inyección NoSQL, rutas sin token y token adulterado |
| 3. Permisos por tipo de usuario | 5 | El paciente no usa rutas del cuidador y viceversa, un cuidador no ve pacientes ajenos, el doctor solo gestiona medicamentos |
| 4. Flujo 1: el cuidador gestiona recordatorios | 9 | Crear con datos propios del tipo, listar, filtrar, validar, editar, desactivar y no editar un desactivado |
| 5. Paginación y orden | 6 | Páginas, total, página fuera de rango, parámetros inválidos, límite de 50 y orden por hora |
| 6. Flujo 2: el paciente confirma | 6 | Avisos de hoy, confirmación sin duplicados, horas inválidas, recordatorio ajeno e historial del doctor |
| 7. Agregaciones | 4 | Porcentajes coherentes, orden de las franjas, validación de parámetros y permisos |
| 8. Validación en la base de datos | 4 | Esquema `$jsonSchema` en inserciones y ediciones, índice único del correo y contraseñas cifradas |
| 9. Bloqueo de cuenta | 1 | Tras 5 contraseñas incorrectas la cuenta se bloquea aun con la clave correcta |

## Casos límite incluidos

- Horario inexistente (`25:99`) rechazado por la API y por la base de datos.
- Confirmar el mismo aviso dos veces no crea un segundo registro.
- Un paciente que intenta confirmar el recordatorio de otro recibe 404.
- Edición de un recordatorio ya desactivado (409).
- Página 999 con solo 3 páginas, que queda en la última.
- Inyección de operadores de MongoDB en el inicio de sesión.

## Defectos encontrados

Ninguno en la corrida final. Las dos fallas anteriores de la ejecución no eran del código: la primera ocurrió porque el servidor no estaba encendido (45 pruebas canceladas por `ECONNREFUSED`), y la segunda mostraba las tildes mal por la codificación de la terminal. Se resolvieron encendiendo el servidor y fijando la codificación UTF-8.
