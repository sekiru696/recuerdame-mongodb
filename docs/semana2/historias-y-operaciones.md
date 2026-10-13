# Historias de usuarios y operaciones

## Historias de usuarios

**Cuidador**
- Como cuidador, quiero crear un recordatorio con mensaje, tipo, horarios y repetición, para que el paciente reciba el aviso por voz.
- Como cuidador, quiero editar o desactivar un recordatorio, para mantenerlo actualizado.
- Como cuidador, quiero ver los recordatorios de un paciente, para saber qué tiene programado.
- Como cuidador, quiero ver ver el historial de cumplimiento, para saber si el paciente atendió lo avisos.

**Paciente**
- Como paciente, quiero escuchar el recordatorio en voz alta a la hora indicada, para saber qué debo hacer.
- Como paciente, quiero confirmar con un botón grande "Ya lo hice", para que quede registrado. 
- Como paciente, quiero ver los recordatorios de hoy, para saber qué me falta.

**Ambos**
- Como usuario, quiero iniciar sesión, para acceder solo a mis datos.

## Operaciones esperadas

| N° | Operaciones | Tipo | Colección | Operación en MongoDB |
|---|---|---|---|---|
|1| Registrar usuarios | Escritura | usuario | insertOne |
|2| Iniciar sesión (buscar por correo) | Lectura | usuarios | findOne |
|3| Crear recordatorio | Escritura | recordatorios | insertOne |
|4| Listar recordatorios activos de un paciente | Lectura | recordatorios | find | 
|5| Editar recordatorio | Escritura | recordatorios | updateOne |
|6| Desactivar recordatorio (baja lógica) | Escritura | recordatorios | updateOne (activo: false) |
|7| Registrar confirmación o aviso no atendido | Escritura | registros | insertOne | 
|8| Consultar historial de un paciente | Lectura | registros | find con orden por fecha | 
|9| Calcular porcentaje de cumplimiento | Lectura | registros | aggregate (semana 6) | 

## Preguntas abiertas
- ¿Un paciente puede tener más de un cuidador?
- ¿Qué pasa si el paciente no confirma en cierto tiempo?
