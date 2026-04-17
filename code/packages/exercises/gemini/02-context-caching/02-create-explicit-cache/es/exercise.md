# Exercise 02 — Creating an explicit context cache

## Concepto

El ejercicio 01 cubrió caching **implicit** — automático, gratis, basado en prefixes compartidos. Tiene dos límites:

1. **Lifetime del cache que no controlás** — Google puede evictar tu prefix cuando quiera.
2. **Solo funciona para el MISMO usuario / MISMO project / MISMO modelo** — no podés broadcast una knowledge base compartida a muchos clientes.

Para cualquiera de los dos problemas, vas a **explicit caching**: le pedís a Gemini que guarde contenido específico bajo un handle con nombre. Recibís un `cachedContents/<id>`. Desde ahí, cualquier `generateContent` que referencie ese nombre vía `config.cachedContent` va a usar el contenido guardado sin reprocesarlo.

Pagás dos cosas por explicit caching:

- **Una tarifa reducida por token** en reads del cache (mucho más barato que el input estándar).
- **Un fee de storage por token, por hora** por el tiempo que el cache vive (así que seteá un `ttl` sensato y borrá cuando termines).

Explicit caching requiere una **key de Gemini con billing habilitado** — el free tier tiene `TotalCachedContentStorageTokensPerModelFreeTier: limit=0` y va a tirar 429.

Este ejercicio se enfoca SOLO en **crear** un cache y leer su metadata. El ejercicio 03 cubre usar el cache para generación.

## Docs & referencias

1. [Guía de explicit caching](https://ai.google.dev/gemini-api/docs/caching#explicit-caching) — shape y lifecycle de `ai.caches.create`
2. [Recurso `CachedContent`](https://ai.google.dev/api/caching#CachedContent) — campos retornados (`name`, `displayName`, `expireTime`, `usageMetadata`)
3. [Método `caches.create`](https://ai.google.dev/api/caching#method:-cachedcontents.create) — parámetros y defaults

## Tu tarea

1. Instanciá `GoogleGenAI` con tu API key.
2. Llamá a `ai.caches.create({ ... })` con:
   - `model: "gemini-2.5-flash"`
   - `config.contents`: un único mensaje user con la constante `longDoc` de `starter.ts`
   - `config.systemInstruction`: `"You answer based only on the provided document."`
   - `config.ttl`: `"300s"` (5 minutos)
   - `config.displayName`: `"amazon-doc-cache"` — un tag legible
3. Después de crear, capturá:
   - `cache.name` — el resource name (se ve como `cachedContents/abc123...`)
   - `cache.model` — el nombre fully-qualified del modelo
   - `cache.displayName` — tu tag
   - `cache.expireTime` — como boolean `hasExpireTime` (`true` si está presente y no vacío)
   - `cache.usageMetadata.totalTokenCount` — cuántos tokens se guardaron
4. **Borrá el cache inmediatamente** con `ai.caches.delete({ name: cache.name })`. Los caches cuestan storage-por-hora, y este ejercicio no necesita que viva.
5. Retorná `{ name, model, displayName, hasExpireTime, tokensCached }`.

## Cómo verificar

```bash
aidev verify 02-create-explicit-cache
```

Los tests verifican:
- No se hicieron llamadas a `generateContent` (este ejercicio es solo sobre caches)
- `name` matchea `^cachedContents/...`
- `model` contiene `gemini-`
- `displayName === "amazon-doc-cache"`
- `hasExpireTime === true`
- `tokensCached > 1000` (el doc guardado es suficientemente grande para ser útil)

## Concepto extra (opcional)

En una aplicación real el cache usualmente se crea **una vez en deploy time** (ej. un script de warm-up al startup del servicio que cachea el doc de policy o el índice del codebase) y se referencia en cada request durante la ventana del TTL. Cuando el TTL está por expirar, un job de background llama a `ai.caches.update({ name, ttl: "..." })` para extenderlo — es más barato que crear un cache nuevo desde cero porque el contenido ya está del lado de Google.

Podés listar caches activos con `ai.caches.list()` e inspeccionarlos con `ai.caches.get({ name })`. Buena disciplina: agregá un `displayName` para que tu dashboard muestre labels que entiendas en vez de IDs opacos.
