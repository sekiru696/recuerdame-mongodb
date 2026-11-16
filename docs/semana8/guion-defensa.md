# Guion de la defensa (15 a 20 minutos)

Antes de empezar: IP autorizada en Atlas, `npm run seed` ejecutado hace poco, servidor encendido (`npm start`), dos ventanas del navegador (cuidador y paciente) y Atlas abierto en la colección `recordatorios`.

| Minuto | Tema | Qué mostrar |
|---|---|---|
| 0 a 2 | Problema y usuarios | Personas con alzhéimer olvidan medicamentos, citas y fechas. El cuidador y el doctor programan avisos y el paciente los escucha y los confirma. |
| 2 a 4 | Por qué MongoDB | El `detalle` cambia de forma según el tipo (medicamento, cita, fecha especial) y los horarios van incrustados en el recordatorio. Los registros crecen cada día, por eso van en otra colección. Mostrar un documento real en Atlas. Límite: sin claves foráneas, la coherencia entre colecciones la cuida la aplicación. |
| 4 a 7 | Flujo 1: el cuidador gestiona recordatorios | Iniciar sesión como `cuidador@ejemplo.cl`. Crear una cita con lugar y profesional, filtrar por tipo, ordenar y paginar, editar el horario, desactivar (baja lógica). Mostrar en Atlas que el documento sigue con `activo: false`. |
| 7 a 10 | Flujo 2: el paciente confirma | Iniciar sesión como `paciente@ejemplo.cl`. Ver los avisos de hoy, escuchar uno y confirmarlo. Confirmar otra vez para mostrar que no se duplica. Entrar como `doctor@ejemplo.cl` y ver el historial con la confirmación. |
| 10 a 12 | Dos agregaciones | Pantalla Reportes: cumplimiento por semana y no atendidos por franja horaria. Explicar qué decisión puede tomar el cuidador con cada una. Pipelines en `src/agregaciones.js`. |
| 12 a 14 | Dos índices | Ejecutar `npm run explain`. Mostrar `COLLSCAN` frente a `IXSCAN`, claves y documentos revisados. Costo: cada índice agrega trabajo en cada escritura. Detalle en `docs/semana5/indices.md` y `docs/semana7/analisis-rendimiento.md`. |
| 14 a 16 | Validación y seguridad | Caso inválido controlado: `node src/casos-limite.js` (horario `25:99` y correo duplicado rechazados por MongoDB). Bloqueo de cuenta tras 5 fallos. Mostrar que `.env` no está en el repositorio. |
| 16 a 17 | Pruebas | Ejecutar `npm test` y mostrar el resultado. |
| 17 a 18 | Límites y defectos | Leer `docs/semana8/defectos-y-limites.md`. |
| 18 a 20 | Preguntas | Cada integrante responde sobre su parte. |

## Si algo falla durante la demostración
Mostrar el mensaje de error, decir la causa probable y qué parte del producto afecta. Causas más probables:
- **No conecta a Atlas:** la IP de esta red no está autorizada (Security, Network Access).
- **Cuenta bloqueada:** `npm run desbloquear -- correo`.
- **Lista vacía:** faltan los datos de ejemplo (`npm run seed`).

## Preguntas que conviene tener preparadas
- ¿Por qué incrustar `horarios` y `detalle`, pero referenciar `registros`?
- ¿Qué pasa si se edita un recordatorio? ¿Qué ocurre con el historial? (`tipo` y `mensaje` se copian en `registros`.)
- ¿Cómo se evita que un cuidador vea pacientes ajenos? (`pacientesIds` y comprobación en cada ruta.)
- ¿Qué costo tiene cada índice? ¿Qué pasaría sin ellos con 60.000 registros?
- ¿Por qué baja lógica y no borrar?
- ¿Cómo se evita la inyección NoSQL en el login? (Se exige que correo y contraseña sean texto.)

## Aportes individuales
Completar con los nombres reales del equipo.

| Integrante | Aporte principal | Parte que defiende |
|---|---|---|
|  |  |  |
|  |  |  |
