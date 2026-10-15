# Modelo  versión 2

## Cambios respecto a la versión 1

| N° | Cambios | Motivo |
|---|---|---|
| 1 | `repetición` pasa a ser un valor fijo (`única`, `diaria`, `semanal`) y se agrega `diasSemana` para los semanales | Permite programar avisos semanales sin inventar texto libre |
| 2 | `registros` guarda una copia de `tipo` y `mensaje` del recordatorio | Si el cuidador edita el recordatorio, el historial conserva lo que se dijo en ese momento (duplicación consciente) |
| 3 | Índice único sobre `usuarios.correo` | Evitar dos cuentas con el mismo correo |
| 4 | Reglas de validación en `recordatorios` y `registros` | Rechazar documentos inválidos desde la base de datos |

## Diccionario de campos

### Usuarios
| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| _id | ObjectId | Sí | Identificador |
| nombre | string | Sí | Nombre de la persona |
| correo | string | Sí | Correo único, se usa para iniciar sesión |
| passwordHash | string | Sí | Contraseña cifrada, nunca en texto plano | 
| rol | string | Sí | `paciente` o `cuidador` |
| pacientesIds | array de ObjectId | No | Pacientes que atiende un cuidador |

### recordatorios 
| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| _id | ObjectId | Sí | Identificador |
| pacienteId | ObjectId | Sí | Referencia al paciente |
| creadoPor | ObjectId | Sí | Referencia al cuidador que lo creó |
| tipo | string | Sí | `medicamento`, `cita` o `fecha_especial` |
| mensaje | string | Sí | Texto que se dice en voz alta |
| detalle | object | No | Datos propios del tipo (incrustado) |
| horarios | array de string | Sí | Horas en formato `HH:MM` (incrustado) |
| repeticion | string | Sí | `unica`, `diaria` o `semanal` |
| diasSemana | array de int | No | Días 0 a 6, solo si es semanal |
| activo | boolean | Sí | `false` = baja lógica |
| creadoEn | date | Sí | Fecha de creación |

### registros
| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| _id | ObjectId | Sí | Identificador |
| recordatorioId | ObjectId | Sí | Referencia al recordatorio |
| pacienteId | ObjectId | Sí | Referencia al paciente |
| tipo | string | Sí | Copia del tipo (duplicación consciente) |
| mensaje | string | Sí | Copia del mensaje (duplicación consciente) |
| fechaProgramada | date | Sí | Cuándo debía sonar |
| estado | string | Sí | `pendiente`, `confirmado` o `no_atendido` |
| confirmadoEn | date | No | Cuándo confirmó el paciente |

## Reglas de validación (recordatorios)

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["pacienteId", "creadoPor", "tipo", "mensaje", "horarios", "repeticion", "activo", "creadoEn"],
    "properties": {
      "tipo": { "enum": ["medicamento", "cita", "fecha_especial"] },
      "mensaje": { "bsonType": "string", "minLength": 5 },
      "horarios": {
        "bsonType": "array",
        "minItems": 1,
        "items": { "bsonType": "string", "pattern": "^([01][0-9]|2[0-3]):[0-5][0-9]$" }
      },
      "repeticion": { "enum": ["unica", "diaria", "semanal"] },
      "activo": { "bsonType": "bool" }
    }
  }
}
```

## Casos límite

**Caso 1: recordatorio sin horarios o con hora inválida.**
Si el cuidador envía `horarios: []` o una hora como `25:99`, la aplicación y la base de datos lo rechazan con un mensaje claro. Así nunca existe un recordatorio que no pueda sonar.

**Caso 2: el cuidador edita un recordatorio que ya tiene historial.**
Los registros anteriores conservan la copia original de `tipo` y `mensaje`. Así el historial muestra lo que realmente se le dijo al paciente en ese momento, aunque el recordatorio haya cambiado después.