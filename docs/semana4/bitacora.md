
## Semana 4
**Fecha:** 25/10/2026

**Decisiones:**
- Flujo 1 construido sobre API con Express: sesión con JWT, crear, listar, filtrar, editar y desactivar recordatorios.
- Control de acceso: el cuidador solo opera sobre pacientes a su cargo.
- Baja lógica en lugar de borrado, para conservar el historial.
- Datos de ejemplo reproducibles con `npm run seed`.
- Interfaz con colores cálidos y apagados, pensada para un público de adultos mayores y sus cuidadores.

**Problemas:**
- La IP cambió entre sesiones y Atlas rechazó la conexión (error `SSL alert number 80`). Se resolvió autorizando la IP nueva.
- Un cambio sin guardar hizo que el servidor siguiera con el código anterior.

**Tareas para la semana 5:**
- Crear dos índices a partir de consultas reales y mostrar `explain`.
- Agregar orden y paginación a la lista.
- Empezar la vista del paciente (flujo 2).