# Comparación: modelo relacional vs. documental

## Cómo se vería el dato en cada modelo

**Relacional (SQL):** tablas 'usuarios', 'recordatorios' y 'registros'. cada recordatorios guarda sus horarios y su detalle dentro del mismo documento.

## Diferencias para este proyecto

| Aspecto | Relaciona | Documental (MongoDB) |
|---|---|---|
| Tipos de recordatorios | Una tabla con muchas columnas vacías, o una tabla por tipo | Una colección; cada documento tiene solo los campos que necesita |
| Horarios múltiples | Tabla aparte con JOIN | Arreglo dentro del documento |
| Agregar un tipo nuevo | Modificar el esquema (ALTER TABLE) | Guardar el nuevo documento |
| Leer un recordatorio completo | Varios JOINS | Una sola lectura |
| Relación paciente-cuidador | Clave foránea con integridad automática | Referencia que la aplicación debe validar |


## Conclusión

MongoDB conviene por la variedad de tipos de recordatorio y por los datos anidados. Su desventaja es que las relaciones entre colecciones y su consistencia dependen más mi código y de las reglas de validación.
