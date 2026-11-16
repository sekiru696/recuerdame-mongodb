# Bitácora de la semana 8

**Fecha:** 16-11-2026

## Qué se hizo
- Se ensayó la instalación desde cero clonando el repositorio desde GitHub (`docs/semana8/instalacion-desde-cero.md`).
- Todos los pasos salieron bien salvo `npm test`, que falló en la instalación limpia.

## Problema encontrado
`npm test` suponía que el servidor ya estaba encendido en el puerto 3000. En el ensayo el servidor corría en el puerto 3001, y en cualquier instalación nueva nadie lo enciende antes de probar. Resultado: `ECONNREFUSED 127.0.0.1:3000` y las 45 pruebas canceladas.

## Decisión
Las pruebas encienden su propio servidor en un puerto libre:
- `src/app.js` solo abre el puerto cuando se ejecuta directamente (`npm start`) y exporta la aplicación.
- `tests/flujos.test.js` importa la aplicación, la enciende en el puerto 0 (el sistema elige uno libre) y la apaga al terminar.
- Si se define `BASE_URL`, las pruebas se dirigen a ese servidor en lugar de encender uno propio.

Así `npm test` funciona igual en cualquier computador, sin pasos previos aparte de `setup` y `seed`.

## Otros ajustes
- README: sección de pruebas y scripts de apoyo (`probar-conexion.js`, `casos-limite.js`).
- Se eliminaron los `.txt` duplicados de la semana 7 (quedan los `.md`).
- Nuevos documentos: guion de la defensa y defectos conocidos y límites.

## Pendiente antes de la defensa
- [ ] Repetir el ensayo de instalación desde cero y actualizar `instalacion-desde-cero.md` con el resultado real de las pruebas.
- [ ] Etiquetar la versión final (`v1.0.0`) y subir la etiqueta a GitHub.
- [ ] Autorizar en Atlas la IP de la red donde se hará la demostración.
- [ ] Ensayar el guion completo con cronómetro (15 a 20 minutos).
