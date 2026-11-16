# Ensayo de instalación desde cero

**Fecha:** 16-11-2026 00:08
**Versión probada:** commit fb2ec91 de la rama principal en GitHub
**Node.js:** v24.15.0

Se clonó el repositorio desde GitHub en una carpeta nueva y vacía, y se siguieron los pasos del README: instalar dependencias, configurar el archivo .env, crear colecciones e índices, cargar los datos de ejemplo, encender el servidor y ejecutar las pruebas. La carpeta temporal se eliminó al terminar.

| Paso | Resultado | Detalle |
|---|---|---|
| git clone del repositorio desde GitHub | Correcto |  |
| El repositorio no incluye el archivo .env | Correcto | Las credenciales no se suben a GitHub |
| Archivos principales presentes | Correcto |  |
| npm install | Correcto |  |
| Configuración del archivo .env | Correcto | Se usó el .env del proyecto con el puerto 3001 |
| npm run setup | Correcto | Colecciones, validaciones e índices |
| npm run seed | Correcto | Datos de ejemplo |
| npm start (servidor encendido) | Correcto | Puerto 3001 |
| npm test | Falló | - de - pruebas aprobadas |

## Resultado de las pruebas en la instalación limpia

| Total | Aprobadas | Fallidas |
|---|---|---|
| - | - | - |