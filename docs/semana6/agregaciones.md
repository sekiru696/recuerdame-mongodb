# Agregaciones (Semana 6)

Las dos agregaciones están en `src/agregaciones.js`, se exponen en `src/reportes.js` y se muestran en la pantalla **Reportes** para el cuidador y el doctor. Ambas trabajan sobre la colección `registros` y solo sobre pacientes a cargo del usuario que consulta.

## Agregación 1: cumplimiento por semana

**Pregunta que responde:** ¿qué porcentaje de los avisos de un paciente se confirma cada semana?

**Ruta:** `GET /api/pacientes/:id/cumplimiento?semanas=4` (de 1 a 12 semanas, 4 por defecto).

```javascript
[
  { $match: { pacienteId, fechaProgramada: { $gte: desde, $lte: hasta } } },
  { $group: {
      _id: { $dateTrunc: { date: '$fechaProgramada', unit: 'week', startOfWeek: 'monday', timezone: 'America/Santiago' } },
      total: { $sum: 1 },
      confirmados: { $sum: { $cond: [{ $eq: ['$estado', 'confirmado'] }, 1, 0] } }
  } },
  { $project: { _id: 0, semana: '$_id', total: 1, confirmados: 1,
      porcentaje: { $round: [{ $multiply: [{ $divide: ['$confirmados', '$total'] }, 100] }, 1] } } },
  { $sort: { semana: 1 } }
]
```

**Cómo se interpreta:** cada fila es una semana (de lunes a domingo, en hora de Chile) con la cantidad de avisos, cuántos se confirmaron y el porcentaje. Una caída de un porcentaje de una semana a la siguiente indica que el paciente está dejando de atender sus avisos y que conviene revisar su rutina o su medicación.

## Agregación 2: avisos no atendidos por franja horaria

**Pregunta que responde:** ¿a qué hora del día se le olvidan más avisos al paciente?

**Ruta:** `GET /api/pacientes/:id/franjas?dias=28` (de 1 a 90 días, 28 por defecto).

```javascript
[
  { $match: { pacienteId, fechaProgramada: { $gte: desde } } },
  { $addFields: { hora: { $hour: { date: '$fechaProgramada', timezone: 'America/Santiago' } } } },
  { $addFields: { franja: { $switch: {
      branches: [
        { case: { $lt: ['$hora', 12] }, then: 'manana' },
        { case: { $lt: ['$hora', 19] }, then: 'tarde' }
      ],
      default: 'noche'
  } } } },
  { $group: { _id: '$franja', total: { $sum: 1 },
      noAtendidos: { $sum: { $cond: [{ $eq: ['$estado', 'no_atendido'] }, 1, 0] } } } },
  { $project: { _id: 0, franja: '$_id', total: 1, noAtendidos: 1,
      porcentajeNoAtendidos: { $round: [{ $multiply: [{ $divide: ['$noAtendidos', '$total'] }, 100] }, 1] } } },
  { $sort: { noAtendidos: -1, franja: 1 } }
]
```

**Cómo se interpreta:** la primera fila es la franja con más avisos sin atender. La pantalla lo resume en una frase (por ejemplo, "la franja con más avisos sin atender es la noche") y muestra el porcentaje de cada franja. Sirve para decidir en qué momento del día reforzar el apoyo del cuidador.

## Relación con los índices

El `$match` inicial de ambas agregaciones filtra por `pacienteId` y `fechaProgramada`, que son las dos claves del índice `idx_registros_paciente_fecha`. Así, MongoDB solo lee los registros del paciente consultado y no recorre toda la colección. La comprobación con `explain` se ejecuta con `npm run explain-agregaciones` y su resultado se documenta en el análisis de rendimiento.

## Control de acceso y validación

- Solo el cuidador y el doctor pueden consultar los reportes, y únicamente de los pacientes que tienen a su cargo (`403` en caso contrario).
- Los parámetros `semanas` y `dias` se validan como enteros dentro de un rango (`400` si no cumplen).
- El identificador del paciente se valida antes de consultar la base de datos.
