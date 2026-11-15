# Bitácora de la semana 6

**Fecha:** 15-11-2026

## Decisiones
- Primera agregación: cumplimiento semanal por paciente, agrupando con `$dateTrunc` por semana (lunes a domingo, hora de Chile) y calculando el porcentaje con `$round`.
- Segunda agregación: avisos no atendidos por franja horaria, derivando la franja con `$hour` y `$switch` y ordenando de la peor franja a la mejor.
- Las agregaciones se exponen como rutas para el cuidador y el doctor, protegidas por tipo de usuario y por paciente asignado, y se muestran en una pantalla nueva llamada Reportes, con barras y una frase que resume cada resultado.
- El filtro inicial de las dos agregaciones usa las claves del índice `idx_registros_paciente_fecha`.
- Script `npm run explain-agregaciones` para comparar cada agregación con y sin índice.
- Script `npm run carga-masiva` para generar miles de registros de pacientes ficticios y poder medir los índices con datos suficientes. Los registros llevan una marca para eliminarlos con `--limpiar` sin tocar los datos de ejemplo.

## Problemas
- Ninguno nuevo en esta semana.

## Pendiente
- Pruebas de todos los flujos y casos límite, con resultados visibles.
- Análisis de una consulta con muchos datos usando la carga masiva.
- README, diagrama y diccionario finales (el modelo final ya está documentado en `docs/semana7/modelo-final.md`).
- Fecha para los recordatorios de una sola vez, que hoy se declara como limitación.

## Tareas para la semana 7
- Ejecutar todas las pruebas y guardar los resultados.
- Medir los índices con la carga masiva y documentar el análisis.
- Ensayar la instalación desde cero siguiendo el README.
