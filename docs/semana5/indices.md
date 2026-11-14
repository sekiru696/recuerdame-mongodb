# Índices de la base de datos (Semana 5)

Los dos índices se crean en `src/setup.js` (`npm run setup`) y se comprueban con `src/explain.js` (`npm run explain`).

## Índices definidos

| Índice | Colección | Consulta real que acelera |
|---|---|---|
| `idx_recordatorios_paciente_activo_fecha` sobre `{ pacienteId: 1, activo: 1, creadoEn: -1 }` | `recordatorios` | Lista de recordatorios activos de un paciente, del más nuevo al más antiguo (pantalla del cuidador y del doctor, y avisos de hoy del paciente) |
| `idx_registros_paciente_fecha` sobre `{ pacienteId: 1, fechaProgramada: -1 }` | `registros` | Historial reciente de un paciente (pantalla Historial) y avisos confirmados de hoy. También sirve de base para las agregaciones de cumplimiento |

Además existe el índice único `correo_1` en `usuarios`, que evita cuentas duplicadas y acelera el inicio de sesión.

## Evidencia con `explain("executionStats")`

Cada consulta se ejecutó dos veces: forzando la lectura completa de la colección (`hint({ $natural: 1 })`) y dejando que MongoDB elija.

**Consulta 1: recordatorios activos de un paciente, ordenados por fecha de creación**

| Plan | Etapas | Claves revisadas | Documentos revisados | Devueltos |
|---|---|---|---|---|
| Sin índice (forzado) | SORT > COLLSCAN | 0 | 9 | 5 |
| Con índice | FETCH > IXSCAN (`idx_recordatorios_paciente_activo_fecha`) | 5 | 5 | 5 |

**Consulta 2: historial de la última semana de un paciente**

| Plan | Etapas | Claves revisadas | Documentos revisados | Devueltos |
|---|---|---|---|---|
| Sin índice (forzado) | SORT > COLLSCAN | 0 | 70 | 18 |
| Con índice | FETCH > IXSCAN (`idx_registros_paciente_fecha`) | 18 | 18 | 18 |

## Qué se observa

- Con índice, MongoDB lee solo los documentos del paciente (5 de 9 y 18 de 70) en lugar de toda la colección.
- Desaparece la etapa `SORT`: el índice ya entrega los resultados en el orden pedido, sin ordenarlos en memoria.

## Costo en escrituras

Cada inserción o modificación en `recordatorios` y `registros` también debe actualizar su índice. Se justifica porque la aplicación lee mucho más de lo que escribe: la lista y el historial se consultan constantemente, mientras que los recordatorios se crean de vez en cuando y los registros se escriben una vez por aviso.

## Limitación honesta

Con 9 recordatorios y 70 registros, la diferencia en milisegundos es nula (0 ms contra 1 ms) y no es significativa. La evidencia válida es la cantidad de documentos revisados, que con el índice depende del paciente y sin él crece con el tamaño de la colección. Para ver la diferencia también en tiempo, se puede repetir la medición con miles de registros de prueba.
