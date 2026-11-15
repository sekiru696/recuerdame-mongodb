# Bitácora de la semana 7

**Fecha:** 15-11-2026

## Decisiones
- Batería de 45 pruebas automáticas con el ejecutor de pruebas de Node.js (`npm test`), que cubre permisos, los dos flujos, paginación, agregaciones, validación en la base de datos y seguridad. Resultados en `docs/semana7/resultados-pruebas.md`.
- Análisis de rendimiento con `explain` y carga masiva, con las consultas de lista e historial y las dos agregaciones. Resultados en `docs/semana7/analisis-rendimiento.md`.
- Modelo final documentado con diagrama, diccionario de campos y decisiones en `docs/semana7/modelo-final.md`.
- README actualizado con los tres tipos de usuario, los reportes, la seguridad y los scripts.

## Problemas
- La primera corrida de pruebas se canceló completa porque el servidor no estaba encendido: se ejecutó desde la carpeta de otro proyecto. Se corrigió ejecutando desde la carpeta del proyecto.
- La salida de las pruebas mostraba las tildes con caracteres extraños en PowerShell. Se resolvió fijando la codificación de salida en UTF-8.
- La carga masiva encontró 20.000 registros de una ejecución anterior, por lo que el análisis se hizo con ese volumen (20.071 registros en total).

## Pendiente
- Ensayar la instalación desde cero siguiendo el README.
- Versión final etiquetada y guion de la defensa.
- Fecha para los recordatorios de una sola vez (limitación declarada).

## Tareas para la semana 8
- Probar la instalación en una carpeta limpia.
- Etiquetar la versión final.
- Preparar la defensa de 15 a 20 minutos.
