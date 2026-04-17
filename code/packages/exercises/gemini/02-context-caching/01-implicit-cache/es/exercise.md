# Exercise 01 — Implicit context caching

## Concepto

Un patrón común en producción: mandás un **prefix largo y estable** (una system instruction, un set de docs de referencia, un resumen de codebase) más una **pregunta corta variable** en cada request. El prefix es el mismo a través de muchos usuarios o muchos turns; solo cambia la pregunta.

El **implicit caching** de Gemini lo detecta automáticamente. Cuando dos requests comparten un prefix idéntico y suficientemente largo, el segundo lee el prefix del cache en vez de reprocesarlo — y Google reporta cuántos tokens vinieron del cache en `usageMetadata.cachedContentTokenCount`. Pagás una **tarifa reducida** sobre esos tokens y ahorrás latencia.

Dos reglas para que funcione:

1. **El prefix tiene que ser suficientemente largo** (~1024+ tokens para `gemini-2.5-flash`; las páginas de pricing tienen el mínimo por modelo).
2. **El prefix tiene que ser BYTE-IDÉNTICO** entre requests. Cambiar un carácter al inicio invalida todo el cache. Variable al final, estable al inicio.

No hay API de cache, no hay cleanup, no hay costo para activarlo. Solo... estructurás los prompts bien.

## Docs & referencias

1. [Overview de context caching](https://ai.google.dev/gemini-api/docs/caching) — implicit vs explicit, cuándo aplica cada uno
2. [Notas de implicit caching](https://ai.google.dev/gemini-api/docs/caching#implicit-caching) — reglas de prefix, tamaños mínimos, tarifas de descuento
3. [`UsageMetadata.cachedContentTokenCount`](https://ai.google.dev/api/generate-content#UsageMetadata) — dónde aparece el cache hit

## Tu tarea

1. La constante `longDoc` en `starter.ts` es un prefix de ~4000 caracteres (suficiente para pasar el mínimo de tokens). Reusala tal cual.
2. Escribí un helper que haga una llamada a `generateContent` con:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `` `${longDoc}\n\nQuestion: ${question}` `` (prefix primero, pregunta al final)
   - `config.maxOutputTokens`: `64`
3. Llamá al helper DOS veces con preguntas distintas — por ejemplo:
   - `"How many countries does the Amazon span?"`
   - `"Name one challenge facing the Amazon region."`
4. Extraé `response.usageMetadata` de cada llamada.
5. Retorná `{ firstUsage, secondUsage }` para que vos (y los tests) puedan ver la diferencia.

## Cómo verificar

```bash
aidev verify 01-implicit-cache
```

Los tests verifican:
- Se hacen exactamente 2 llamadas a la API
- Ambas comparten el mismo prefix byte-idéntico (la parte antes de `Question:`)
- Ambas reciben candidates válidos
- Ambos `usageMetadata` tienen `promptTokenCount` > 1000
- **El `cachedContentTokenCount` de la segunda llamada es > 0** — implicit caching se activó

## Concepto extra (opcional)

Implicit caching es un assumption arquitectónico latente que los buenos usuarios de APIs aprenden temprano: **ordená el contenido de estable → variable**. Si tu sistema real tiene un system prompt de 3000 tokens, un doc de policy de 2000 tokens y una pregunta de 50 tokens del user, pasalos EN ESE ORDEN. Invertí el orden y pagás el precio completo en cada turn más desperdiciás unos cientos de ms por call.

Los siguientes ejercicios cubren caching **explicit** — donde creás un cache con nombre usando `ai.caches.create()`, obtenés una referencia, y apuntás llamadas futuras explícitamente ahí. Explicit caching te da más control (TTLs largos, sharing cross-project, descuentos mayores) a costo de manejar vos el lifetime del cache.
