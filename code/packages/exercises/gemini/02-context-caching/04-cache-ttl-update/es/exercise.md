# Exercise 04 — Updating a cache's TTL

## Concepto

Un cache explicit vive durante su TTL (time-to-live) y después expira. Si estás construyendo un servicio que referencia un cache a través de muchos requests, un cache único de 5 minutos no sirve — lo vas a estar recreando constantemente.

El patrón idiomático: **creás el cache una vez, extendés el TTL periódicamente**. Extender es más barato que re-crear porque el contenido queda del lado de Google; solo se mueve el reloj de expiración.

La API para eso es `ai.caches.update()`:

```ts
const updated = await ai.caches.update({
  name: cache.name,
  config: { ttl: "600s" },
});
// updated.expireTime ahora es ~10 minutos desde "ahora"
```

El string `ttl` es **relativo al momento del update call**, no acumulativo. Mandar `ttl: "600s"` significa "expirar 600 segundos desde ahora", pisando lo que había planeado antes.

En producción típicamente corrés un background job que vigila `expireTime` y llama `update` cuando quedan ~30s de expiración. Mantiene el cache "siempre caliente" mientras es útil, sin pagar storage por el tail.

## Docs & referencias

1. [Referencia de `caches.update`](https://ai.google.dev/api/caching#method:-cachedcontents.patch) — campos aceptados y semántica
2. [Lifecycle de explicit caching](https://ai.google.dev/gemini-api/docs/caching#explicit-caching) — create / update / get / delete
3. [`CachedContent.expireTime`](https://ai.google.dev/api/caching#CachedContent) — formato (ISO-8601 string de Google)

## Tu tarea

1. Creá un cache con el mismo shape que el ejercicio 02, pero `ttl: "60s"` — lifetime inicial corto.
2. Guardá `cache.expireTime` como `initialExpireTime`.
3. Llamá a `ai.caches.update({ name: cache.name, config: { ttl: "600s" } })`. Guardá `updated.expireTime` como `updatedExpireTime`.
4. Computá `extendedBySeconds` parseando ambos ISO strings con `new Date()` y restando:
   ```ts
   Math.round(
     (new Date(updatedExpireTime).getTime() - new Date(initialExpireTime).getTime()) / 1000
   )
   ```
5. Borrá el cache en un bloque `finally`.
6. Retorná `{ cacheName, initialExpireTime, updatedExpireTime, extendedBySeconds }`.

## Cómo verificar

```bash
aidev verify 04-cache-ttl-update
```

Los tests verifican:
- Ninguna llamada a `generateContent` (esto es puramente sobre lifecycle del cache)
- `cacheName` matchea `^cachedContents/...`
- Ambos strings de expire-time parsean con `new Date()`
- `updatedExpireTime > initialExpireTime`
- `extendedBySeconds` está entre 400 y 700 (aprox el delta de 540s entre 600s y 60s, con margen por skew de clock + RTT)

## Concepto extra (opcional)

`caches.update` acepta **solo `ttl` y `expireTime`** — no podés cambiar el contenido del cache. Si tus datos cambiaron, la única forma de reflejarlo es crear un cache nuevo y swapear la referencia `cacheName` en tu app.

Si necesitás updates continuos al contenido, considerá usar implicit caching en su lugar (ejercicio 01): tu prompt cambia, pero mientras el PREFIX quede estable, seguís recibiendo beneficios de cache sin manejar un handle.

Para servicios multi-tenant, `displayName` es el campo en el que apoyarse — usá una convención tipo `<tenant-id>:<doc-hash>` para filtrar resultados de `ai.caches.list()` y expirar caches por-tenant cuando el tenant actualiza su doc fuente.
