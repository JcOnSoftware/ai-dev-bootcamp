# Exercise 05 — Prompt caching and cached token monitoring

## Concepto

OpenAI tiene **caché automática de prompts**: cuando un prefix de prompt supera los 1024 tokens y lo reutilizás en múltiples requests, los tokens cacheados se cobran a la mitad de precio (o gratis en algunos modelos). Esto es especialmente útil cuando tenés un system prompt largo que se repite en cada request.

La clave es que el **prefix exacto tiene que ser idéntico** — si cambiás el system prompt aunque sea un carácter, la caché no aplica. El campo `usage.prompt_tokens_details.cached_tokens` te dice cuántos tokens vinieron del caché en esa request:

```typescript
// Acceder al campo (puede necesitar cast porque no está en los tipos oficiales aún)
const cachedTokens =
  (response.usage as any)?.prompt_tokens_details?.cached_tokens ?? 0;
```

En el primer request, `cached_tokens` suele ser 0 (la caché se está "calentando"). En el segundo request con el mismo prefix largo, podés ver `cached_tokens > 0`.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — campo `usage.prompt_tokens_details`
3. [Prompt Caching guide](https://platform.openai.com/docs/guides/prompt-caching) — cómo funciona el auto-caching en OpenAI

## Tu tarea

1. Abrí `starter.ts`. Ya tiene definido `LONG_SYSTEM_PROMPT` — un system prompt de ~1200 tokens. No lo modifiques.
2. Creá un cliente OpenAI.
3. **Primera llamada**: usá `LONG_SYSTEM_PROMPT` como system message con `{ role: "user", content: "What is your primary role?" }`.
4. **Segunda llamada**: usá el MISMO `LONG_SYSTEM_PROMPT` como system message con `{ role: "user", content: "Summarize your expertise in one sentence." }`.
5. Para cada respuesta, leé `cached_tokens`:
   ```typescript
   (response.usage as any)?.prompt_tokens_details?.cached_tokens ?? 0
   ```
6. Retorná `{ call1CachedTokens, call2CachedTokens, cacheImproved: call2CachedTokens > call1CachedTokens }`.

Usá `model: "gpt-4.1-nano"` y `max_completion_tokens: 32` en ambas llamadas.

## Cómo verificar

```bash
aidev verify 05-cached-tokens-monitoring
```

Los tests verifican:
- Exactamente 2 llamadas a la API
- Ambas usan `gpt-4.1-nano`
- Ambas usan el mismo system prompt (prefix idéntico)
- `call1CachedTokens` es un número >= 0
- `call2CachedTokens` es un número >= 0
- `cacheImproved` es un booleano

Los tests **NO** verifican que `cacheImproved === true` — el caching es automático y puede no dispararse siempre en entornos de test.

## Concepto extra (opcional)

Para maximizar los ahorros por caché en producción:

1. **Poné el contenido estático primero**: el system prompt y cualquier texto fijo debe ir al principio del array de mensajes. El contenido dinámico (la pregunta del usuario) va al final.
2. **Usá el mismo objeto/constante**: si el string viene de la misma variable inmutable, el prefix es garantizadamente idéntico.
3. **Monitoréalo en producción**: logeá `cached_tokens` para saber tu hit rate real. En sistemas con llamadas frecuentes al mismo system prompt, podés ver 50-80% de reducción en costo de input tokens.

La caché de OpenAI expira después de ~5-10 minutos de inactividad. Para workloads en batch o de baja frecuencia, el beneficio es menor. Para chatbots con muchos usuarios concurrentes, el impacto es muy significativo.
