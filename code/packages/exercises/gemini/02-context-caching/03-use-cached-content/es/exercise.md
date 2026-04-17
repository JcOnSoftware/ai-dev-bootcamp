# Exercise 03 — Using an explicit cache with generateContent

## Concepto

En el ejercicio 02 creaste un cache y capturaste su nombre. Ahora lo vas a **usar** en una llamada a `generateContent`.

El mecanismo es solo un campo en `config`:

```ts
await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "tu pregunta corta",
  config: { cachedContent: cache.name },
});
```

Cuando el server ve `cachedContent`, busca el contenido guardado, lo trata como si estuviera prepended a tu `contents`, y genera una respuesta. Te devuelve un `GenerateContentResponse` normal — la única diferencia observable está en `usageMetadata`:

- `promptTokenCount` — sigue reportando el tamaño COMPLETO del prompt (cached + fresh)
- `cachedContentTokenCount` — reporta cuántos vinieron del cache
- Los tokens cached se **facturan a la tarifa de cache-read**, no al input estándar

**Fresh input tokens** (lo que realmente pagaste al precio completo) = `promptTokenCount - cachedContentTokenCount`.

El movimiento arquitectónico que esto habilita: mantené tu knowledge base de 50k tokens detrás de un cache, referencialo por nombre, y solo pagás full rate por la pregunta corta variable en cada request. Así es como Gemini se vuelve cost-effective a escala para workloads tipo RAG.

## Docs & referencias

1. [Guía de explicit caching — usando un cache](https://ai.google.dev/gemini-api/docs/caching#generate-content) — el patrón `cachedContent`
2. [`GenerationConfig.cachedContent`](https://ai.google.dev/api/generate-content#generationconfig) — referencia del campo
3. [`CachedContent`](https://ai.google.dev/api/caching#CachedContent) — el recurso que pasás por nombre

## Tu tarea

1. Creá un cache para `longDoc` (mismo shape que el ejercicio 02) — usá `ttl: "120s"`.
2. Llamá a `generateContent` con:
   - `model: "gemini-2.5-flash"` (TIENE que matchear el modelo del cache)
   - `contents: "Write one clear sentence about the topic of the cached document."`
   - `config: { cachedContent: cache.name, maxOutputTokens: 80 }`
3. Leé `response.text` y `response.usageMetadata`.
4. Siempre cleanup — `ai.caches.delete({ name: cache.name })` en un bloque `finally`.
5. Retorná:
   ```ts
   {
     cacheName: cache.name,
     answer: response.text,
     cachedTokens: usageMetadata.cachedContentTokenCount,
     freshInputTokens: usageMetadata.promptTokenCount - usageMetadata.cachedContentTokenCount,
   }
   ```

## Cómo verificar

```bash
aidev verify 03-use-cached-content
```

Los tests verifican:
- Se hace exactamente 1 llamada a `generateContent`
- Request `config.cachedContent` matchea `^cachedContents/...`
- `answer` no vacío
- **`cachedTokens > 0`** — el cache se usó de verdad (esto es el punto)
- `cachedTokens > 1000` — el doc guardado era suficientemente grande para importar
- `freshInputTokens < cachedTokens` — el fresh input es chico, el cache valió la pena
- El `cacheName` retornado matchea el `cachedContent` del request

## Concepto extra (opcional)

El modelo en tu llamada a `generateContent` **tiene que ser el mismo modelo con el que se creó el cache**. Un cache creado para `gemini-2.5-flash` no se puede usar en `gemini-2.5-pro`. Los caches tampoco se pueden compartir entre proyectos de Google Cloud — viven con la API key que los creó.

¿Qué hay del `systemInstruction`? Si lo seteaste al crear el cache, **no lo setees de nuevo** en el call de generateContent — el cached está en efecto. Overridearlo es usualmente error: o te rechaza por mismatch o la nueva instruction gana y el cache se desperdicia.
