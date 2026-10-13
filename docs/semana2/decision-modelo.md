# Decisión: incrustar vs. referenciar

**Incrustamos** `detalle` y `horarios` dentro de `recordatorios`, porque siempre se leen junto con el recordatorio, son pocos datos y no se consultan por separado.

**Referenciamos** `registros` en una colección aparte, porque crecen cada día (uno por cada aviso). Si estuvieran dentro del recordatorio, el documento crecería sin límite y sería más difícil consultar el historial y calcular el cumplimiento.

**Pregunta abierta:** si un paciente puede tener más de un cuidador, `creadoPor` y `pacientesIds` necesitarán revisión en la semana 3.
