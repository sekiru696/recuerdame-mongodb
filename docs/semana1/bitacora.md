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


## Semana 3
**Fecha:** 15-10-2026

**Decisiones:**
- Modelo versión 2 documentado en `docs/semana3/modelo-v2.md`, con diccionario de campos y reglas de validación.
- Conexión a MongoDB Atlas (plan gratuito, región São Paulo) con la cadena de conexión guardada en `.env`, fuera del repositorio.
- Contraseñas de usuarios guardadas cifradas con bcrypt.
- Validación de documentos en la base de datos (`$jsonSchema`) e índice único sobre `usuarios.correo`.

**Problemas:**
- Error de DNS (`querySrv ECONNREFUSED`) al conectar. Se resolvió forzando los servidores DNS de Google desde `src/db.js`.
- Conflicto de credenciales de GitHub entre varias cuentas en el mismo computador. Se resolvió autenticando este repositorio con su cuenta propietaria.

**Evidencia:** carpeta `docs/semana3/evidencia/` (capturas de Atlas y de los casos límite).

**Tareas para la semana 4:**
- Completar las operaciones básicas del primer flujo de negocio (crear, listar, editar y desactivar recordatorios).
- Construir una interfaz mínima utilizable.
- Preparar la demostración de 10 a 12 minutos y el plan para las semanas 5 a 8.