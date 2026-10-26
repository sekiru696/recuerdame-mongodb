# Plan priorizado de las semanas 5 a 8

## Estado actual (semana 4)
- Flujo 1 completo: el cuidador inicia sesión, crea, lista, filtra por tipo, edita y desactiva recordatorios.
- Modelo con tres colecciones (usuarios, recordatorios, registros), validación en la base de datos e índice único del correo.
- Datos de ejemplo reproducibles (`npm run seed`) y README con instrucciones.

## Prioridades

**Imprescindible**
1. Segundo flujo de negocio: el paciente ve los recordatorios de hoy, escucha el aviso a su hora y confirma con un botón grande.
2. Dos índices justificados con consultas reales, con evidencia de uso (`explain`).
3. Dos agregaciones con resultados interpretables.
4. Pruebas de los flujos y de casos límite.

**Importante**
5. Permisos para el rol paciente (solo ve y confirma sus propios avisos).
6. Paginación y orden en la lista de recordatorios.
7. Análisis de una consulta antes y después del índice.

**Si alcanza el tiempo**
8. Edición de recordatorios semanales por día de la semana.
9. Mejoras de accesibilidad de la vista del paciente.

**Fuera del alcance** (se declara como límite del proyecto)
- Notificaciones push o alarmas con la aplicación cerrada.
- Escalación de alertas al personal de un hospital.
- Reconocimiento de voz.

## Cronograma

| Semana | Entrega |
|---|---|
| 5 | Dos índices con `explain`, lista con orden y paginación, inicio de la vista del paciente |
| 6 | Flujo 2 completo (aviso por voz y confirmación), dos agregaciones, permisos del paciente, un caso inválido controlado |
| 7 | Pruebas automáticas, análisis de una consulta, README final, ensayo de instalación desde cero |
| 8 | Versión final etiquetada, defensa de 15 a 20 minutos |

## Riesgos
- Cambio de IP en la red: se autoriza en Atlas antes de cada demostración.
- Alcance: si el flujo 2 se atrasa, se recortan los puntos 8 y 9.