# Análisis de rendimiento (Semana 7)

## Cómo se midió

1. `npm run carga-masiva` agregó registros de pacientes ficticios a la colección `registros`. Junto con los datos de ejemplo quedaron **20.071 registros** (20.000 de carga masiva y 71 de ejemplo). La colección `recordatorios` tiene 11 documentos.
2. `npm run explain` y `npm run explain-agregaciones` ejecutaron cada consulta dos veces: forzando la lectura completa de la colección (`hint({ $natural: 1 })`) y dejando que MongoDB elija el plan.
3. `npm run carga-masiva -- --limpiar` eliminó los 20.000 registros de prueba.

La salida completa está en `docs/semana7/analisis-rendimiento.txt`.

## Consulta analizada en detalle: historial de la última semana de un paciente

Es la consulta de la pantalla Historial. Filtra `registros` por `pacienteId` y `fechaProgramada`, y ordena de la fecha más reciente a la más antigua.

| Plan | Etapas | Claves revisadas | Documentos revisados | Devueltos | Tiempo |
|---|---|---|---|---|---|
| Sin índice (forzado) | SORT > COLLSCAN | 0 | 20.071 | 20 | 13 ms |
| Con `idx_registros_paciente_fecha` | FETCH > IXSCAN | 20 | 20 | 20 | 0 ms |

- Sin índice, MongoDB lee los 20.071 documentos y luego los ordena en memoria para devolver 20.
- Con el índice lee solo 20 claves y 20 documentos, que son exactamente los del paciente. La etapa `SORT` desaparece, porque el índice `{ pacienteId: 1, fechaProgramada: -1 }` ya entrega los registros en el orden pedido.
- Se revisa el 99,9 % menos de documentos (20.071 contra 20).

## Consulta 1: recordatorios activos de un paciente

| Plan | Etapas | Claves revisadas | Documentos revisados | Devueltos | Tiempo |
|---|---|---|---|---|---|
| Sin índice (forzado) | SORT > COLLSCAN | 0 | 11 | 5 | 0 ms |
| Con `idx_recordatorios_paciente_activo_fecha` | FETCH > IXSCAN | 5 | 5 | 5 | 0 ms |

La colección `recordatorios` es pequeña (11 documentos), así que la diferencia aparece solo en documentos revisados y no en el tiempo. El plan sigue siendo mejor: lee solo los documentos del paciente y no necesita ordenar.

## Agregaciones

| Agregación | Plan | Etapas | Claves revisadas | Documentos revisados |
|---|---|---|---|---|
| Cumplimiento semanal (4 semanas) | Sin índice | GROUP > COLLSCAN | 0 | 20.071 |
| Cumplimiento semanal (4 semanas) | Con índice | GROUP > FETCH > IXSCAN | 43 | 43 |
| No atendidos por franja (28 días) | Sin índice | PROJECTION_SIMPLE > COLLSCAN | 0 | 20.071 |
| No atendidos por franja (28 días) | Con índice | PROJECTION_SIMPLE > FETCH > IXSCAN | 43 | 43 |

El `$match` inicial de ambas agregaciones usa las dos claves del índice `idx_registros_paciente_fecha`. Con el índice se procesan 43 documentos en lugar de 20.071 (el 99,8 % menos), y solo esos 43 llegan a las etapas de agrupación.

## Costo del índice

Cada inserción o modificación en `registros` debe actualizar también su índice, lo que agrega trabajo en las escrituras y ocupa espacio. Se justifica porque se escribe poco (un registro por aviso confirmado) y se lee mucho (historial, avisos de hoy y los dos reportes).

## Limitaciones de la medición

- Los tiempos son de un clúster gratuito compartido y varían entre ejecuciones. La medida confiable es la cantidad de documentos revisados.
- Los datos de carga masiva se generaron al azar, con fechas repartidas en un año, y no reflejan una distribución real de uso.
- Con 20.071 registros el escaneo completo sigue siendo rápido (13 ms). Lo que muestra el análisis es cómo crece el trabajo: sin índice crece con el tamaño de la colección y con el índice solo con el tamaño de los datos del paciente.
