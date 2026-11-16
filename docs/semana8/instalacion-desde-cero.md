# Ensayo de instalación desde cero

**Fecha:** 16-11-2026
**Versión probada:** commit b01eacc de la rama principal en GitHub
**Node.js:** v24.15.0

Se clonó el repositorio desde GitHub en una carpeta nueva y vacía, y se siguieron los pasos del README: instalar dependencias, configurar el archivo `.env`, crear colecciones e índices, cargar los datos de ejemplo y ejecutar las pruebas. La carpeta temporal se eliminó al terminar.

| Paso | Resultado | Detalle |
|---|---|---|
| `git clone` del repositorio desde GitHub | Correcto | |
| El repositorio no incluye el archivo `.env` | Correcto | Las credenciales no se suben a GitHub. Se copió el `.env` propio a la carpeta nueva |
| `npm install` | Correcto | 96 paquetes agregados, 0 vulnerabilidades |
| `npm run setup` | Correcto | Colecciones, validaciones e índices |
| `npm run seed` | Correcto | 6 usuarios, 9 recordatorios y 70 registros de ejemplo |
| `npm test` | Correcto | 45 de 45 pruebas aprobadas |

No fue necesario ejecutar `npm start` antes de las pruebas: desde la semana 8 las pruebas encienden su propio servidor en un puerto libre.

## Resultado de las pruebas en la instalación limpia

| Total | Aprobadas | Fallidas | Canceladas | Duración |
|---|---|---|---|---|
| 45 | 45 | 0 | 0 | 23,4 s |

## Qué corrigió este ensayo

La primera versión de este ensayo falló en `npm test` (45 pruebas canceladas por `ECONNREFUSED`), porque las pruebas suponían un servidor ya encendido en el puerto 3000. Se corrigió en el commit "Semana 8: las pruebas encienden su propio servidor" y se repitió el ensayo completo con el resultado de la tabla anterior.
