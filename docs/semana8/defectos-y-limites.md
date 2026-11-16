# Defectos conocidos y límites del producto

## Defecto corregido en la semana 8
| Defecto | Causa | Corrección |
|---|---|---|
| `npm test` fallaba en una instalación limpia (`ECONNREFUSED`, 45 pruebas canceladas) | Las pruebas suponían el servidor ya encendido en el puerto 3000 | Las pruebas encienden su propio servidor en un puerto libre |

## Límites del modelo
- Los recordatorios de una sola vez no tienen fecha, por lo que al paciente le aparecen hasta que los confirma. La mejora natural es agregar un campo `fecha`.
- MongoDB no tiene claves foráneas: que `pacienteId` exista en `usuarios` lo garantiza la aplicación.
- Las agregaciones usan la zona horaria `America/Santiago` fija en el código.
- Los avisos de los registros se cargan como datos de ejemplo. La aplicación no genera registros `no_atendido` por sí sola cuando pasa la hora.

## Fuera del alcance
- Notificaciones push o alarmas con la aplicación cerrada: el aviso por voz suena solo mientras la página está abierta.
- Escalación de alertas al personal de un hospital.
- Reconocimiento de voz.

## Seguridad y reproducibilidad
- La base de datos está en MongoDB Atlas y solo acepta conexiones desde las IP autorizadas. Quien instale el proyecto necesita su propio clúster y su propio `.env`.
- Las cuentas de ejemplo comparten una contraseña de prueba (`clave-de-prueba`). Es adecuada para la demostración, no para uso real.
- La última prueba automática bloquea una cuenta de ejemplo por 15 minutos y luego la desbloquea.
