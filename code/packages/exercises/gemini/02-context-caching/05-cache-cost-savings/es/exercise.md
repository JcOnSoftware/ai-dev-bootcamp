# Exercise 05 — Measuring cache cost savings

## Concepto

Venís construyendo hacia esto: el punto entero de explicit caching es **costo a escala**. Viste cómo crear un cache (02), usarlo (03), y mantenerlo vivo (04). Ahora cuantificás lo que realmente está ahorrando.

Para `gemini-2.5-flash` (tier pago, 2026-04):

| Tipo de token | Tarifa (por 1M tokens) |
|---|---|
| Input estándar | **$0.30** |
| Cache read | **$0.075** (25% del input — 75% de descuento) |
| Output | $2.50 |

Para una sola call la fórmula es:

- **Sin cache**: `(cachedTokens + freshInputTokens) × $0.30/M + outputTokens × $2.50/M`
- **Con cache**: `cachedTokens × $0.075/M + freshInputTokens × $0.30/M + outputTokens × $2.50/M`

Los ahorros per-call son chicos — usualmente fracciones de centavo — porque un cache del tamaño del bootcamp es solo ~5k tokens. Pero si multiplicás por 100k calls por día (un chatbot de support con tráfico real, un pipeline de indexing, un agente de analytics), los ahorros se vuelven plata de verdad. Eso es lo que vas a medir acá.

## Docs & referencias

1. [Página de pricing de Gemini](https://ai.google.dev/pricing) — tarifas input / cache-read / output al día por modelo
2. [Guía de explicit caching](https://ai.google.dev/gemini-api/docs/caching#explicit-caching) — cuándo el caching vale el costo de storage
3. [`UsageMetadata`](https://ai.google.dev/api/generate-content#UsageMetadata) — `cachedContentTokenCount`, `promptTokenCount`, `candidatesTokenCount`

## Tu tarea

1. Creá un cache para `longDoc` con `ttl: "120s"`, mismo shape que el ejercicio 03.
2. Corré TRES preguntas distintas contra ese cache:
   - `"Summarize the document in one sentence."`
   - `"Pick one section number the document mentions."`
   - `"What animal is the document about?"`
   Usá `config.maxOutputTokens: 80` cada vez.
3. Para cada response, extraé de `usageMetadata`:
   - `cachedTokens = cachedContentTokenCount`
   - `freshInputTokens = promptTokenCount - cachedContentTokenCount`
   - `outputTokens = candidatesTokenCount`
4. Computá per-call `costWithCacheUSD` y `costWithoutCacheUSD` usando las tarifas de arriba.
5. Sumá totales a través de las 3 calls, computá `savingsUSD` y `savingsPercent`.
6. Borrá el cache en un bloque `finally`.
7. Retorná el `SavingsReport` completo.

## Cómo verificar

```bash
aidev verify 05-cache-cost-savings
```

Los tests verifican:
- Exactamente 3 llamadas a `generateContent`, todas referenciando `config.cachedContent`
- El retorno tiene 3 breakdowns per-call
- Cada call tiene `cachedTokens > 0` — el cache se usó de verdad
- Cada call tiene `costWithCacheUSD < costWithoutCacheUSD`
- `totalWithCacheUSD` y `totalWithoutCacheUSD` igualan las sumas per-call (con margen de float)
- `savingsUSD === totalWithoutCacheUSD - totalWithCacheUSD` y es positivo
- `savingsPercent` es un número positivo bajo 100

## Concepto extra (opcional)

Un número de ahorro per-call engañoso sin contexto — la forma correcta de evaluar caching es **análisis de break-even**. El storage del cache también tiene costo (actualmente ~$1.00 por 1M tokens guardados por hora en tier pago). Si tu cache vive una hora y solo recibe 5 hits sobre un doc de 5k tokens, el costo de storage puede superar el ahorro en reads — te hubiera convenido NO cachear.

La regla: el cache paga si `(reads-por-hora × ahorro-por-read) > costo-storage-por-hora`. Trackealo en dashboards de prod. Cuando el tráfico baja, muchas veces lo correcto es acortar TTLs o borrar caches. Cachear a ciegas es como perdés plata creyendo que la estás ahorrando.
