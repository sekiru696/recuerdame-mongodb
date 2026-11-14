# Bitácora de la semana 5

**Fecha:** 14-11-2026

## Decisiones
- Dos índices a partir de consultas reales: `{ pacienteId, activo, creadoEn }` en `recordatorios` y `{ pacienteId, fechaProgramada }` en `registros`. Evidencia en `docs/semana5/indices.md`.
- Tres tipos de usuario con permisos distintos: el cuidador gestiona todos los recordatorios de sus pacientes, el doctor ve los recordatorios y el historial de sus pacientes y solo crea o edita medicamentos, y el paciente ve sus avisos de hoy y los confirma.
- Segundo flujo de negocio: el paciente confirma un aviso y queda un registro en `registros`, que el doctor y el cuidador ven en la pantalla Historial. La confirmación es idempotente (confirmar dos veces no duplica el registro).
- Interfaz con menú lateral que cambia según el tipo de usuario, pantalla de carga y colores cálidos y apagados.
- Seguridad reforzada: cabeceras con helmet, límite de intentos de inicio de sesión, bloqueo de la cuenta tras 5 contraseñas incorrectas durante 15 minutos, rechazo de inyección en el login, token con algoritmo fijo y mensajes de error que no revelan datos internos.

## Problemas
- La IP de la red cambió varias veces y Atlas rechazó la conexión (`SSL alert number 80`). Se resolvió autorizando la IP nueva en Network Access.
- Una prueba falló porque PowerShell anidaba las listas de respuestas y los identificadores se leían mal. Era un error del script de pruebas y no de la API.
- El recordatorio de una sola vez no tiene fecha, por lo que al paciente le aparece hasta que lo confirma.

## Pendiente
- Orden y paginación en la lista de recordatorios.
- Dos agregaciones (cumplimiento por semana y avisos no atendidos por franja horaria).
- Fecha para los recordatorios de una sola vez.
- Pruebas automáticas y análisis de una consulta con muchos datos.

## Tareas para la semana 6
- Implementar las dos agregaciones y mostrarlas en pantalla.
- Agregar orden y paginación a la lista.
- Documentar un caso inválido controlado y cómo se mantiene la coherencia de los datos.
