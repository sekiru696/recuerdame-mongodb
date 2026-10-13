# Bitácora del proyecto

## Semana 1 
**Fecha:** 02-10-2026

**Decisiones:**
- Tema elegido: recordatorios por voz para personas con alzhéimer.
- Se usará MongoDB por la variedad de tipos de recordatorio y los datos anidados.
- Alcance mínimo: aplicación web con acceso por rol, CRUD de recordatorios, voz y confirmación.

**Tareas para la semana 2:**
- Escribir historias de usuarios.
- Bosquejar colecciones y documentos JSON.
- Dibujar el primer diagrama del modelo.
- Listar al menos 5 operaciones de lecturas y escrituras.

## Semana 2
**Fecha:** 13-10-2026

**Decisiones:**
- Modelo con tres colecciones: usuarios, recordatorios y registros.
- Se incrustan 'detalle' y 'horarios' dentro del recordatorios.
- Se referencian los 'registros' en una colección aparte, porque crecen cada día.
- Los recordatorios se desactivan (baja lógica) en lugar de eliminarse, para conservar el historial.

**Tareas para la semana3:*
- Revisar el modelo con casos reales (crecimiento de arreglos, duplicación, actualizaciones).
- Ajustar campos obligatorios y reglas de variación.
- Configurar la conexión segura con MongoDB (credenciales fuera del repositorio).
- Programar la creación y lectura de recordatorios.
- Preparar datos de ejemplo.
