# Recuérdame: recordatorios por voz para personas con alzhéimer 
# Problema:** Las personas con alzhéimer olvidan medicamentos, citas y fechas importantes y los cuidadores no siempre pueden estar presentes. Una alarma común no indica qué hay que hacer.
# Usuarios:** Pacientes que estan en temprana etapa podran utilizar este proyecto personal en el cual consiste en (recibe el aviso por voz y confirma) y cuidador/cuidadora/familiar (crea recordatorios y revisa el cumplimiento).
# Objetivo:** Que el paciente reciba recordatorios claros y hablados, y que el cuidador pueda verificar si cumplieron.

**Tres funciones prioritarias:**
1. Crear y programar recordatorios.
2. Reproducirlos en voz alta a la hora indicada.
3. Confirmar y consultar el historial de cumplimiento.

**Datos principales:** usuarios, recordatorios (de distintos tipos) y registros de ejecución.
**Por qué MongoDB:** Los recordatorios son heterogéneos (medicamento, cita, fecha especial) y tiene estructuras anidadas (horarios, detalle). Se pueden agregar tipos nuevos sin migrar el esquema.
**Límites:** Las relaciones paciente-cuidador y la consistencia entre colecciones requieren validación desde la aplicación. No es un dispositivo médico.
**Alcance mínimo viable:** aplicación web con acceso por rol, CRUB de recordatorios, reproducción y confirmación con historial.
