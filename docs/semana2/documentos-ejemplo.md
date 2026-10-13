# Documentos JSON de ejemplo

## Colección `recordatorios`

```json
{
  "_id": "665f1a2b3c4d5e6f7a8b9c01",
  "pacienteId": "665f1a2b3c4d5e6f7a8b9a01",
  "creadoPor": "665f1a2b3c4d5e6f7a8b9a02",
  "tipo": "medicamento",
  "mensaje": "Es hora de tomar tu pastilla con un vaso de agua",
  "detalle": {
    "nombre": "Donepezilo",
    "dosis": "5 mg"
  },
  "horarios": ["08:00", "20:00"],
  "repeticion": "diaria",
  "activo": true,
  "creadoEn": "2026-10-13T10:00:00Z"
}
```

## Colección `registros`

```json
{
  "_id": "665f1a2b3c4d5e6f7a8b9d01",
  "recordatorioId": "665f1a2b3c4d5e6f7a8b9c01",
  "pacienteId": "665f1a2b3c4d5e6f7a8b9a01",
  "fechaProgramada": "2026-10-14T08:00:00Z",
  "estado": "confirmado",
  "confirmadoEn": "2026-10-14T08:03:00Z"
}
```

## Notas
- `estado` puede ser: `confirmado`, `no_atendido` o `pendiente`.
- Un recordatorio de tipo `cita` tendría en `detalle` campos distintos (por ejemplo `lugar` y `profesional`). Eso es lo que justifica usar MongoDB.
