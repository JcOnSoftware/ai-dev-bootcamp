# Exercise 03 — Reading token usage and estimating cost

## Concepto

Cada respuesta de Gemini incluye un `usageMetadata` para que trackees los tokens consumidos. A diferencia de OpenAI (`prompt_tokens` / `completion_tokens` — snake_case) o Anthropic (`input_tokens` / `output_tokens`), Gemini usa camelCase:

- `promptTokenCount` — tokens de input (tu prompt + system instructions + cached content + archivos)
- `candidatesTokenCount` — tokens de output sumando todos los candidates
- `totalTokenCount` — el total del provider, usualmente `prompt + candidates`
- `cachedContentTokenCount` — porción del input servida del cache (gratis en implicit, descontada en explicit)
- `thoughtsTokenCount` — tokens de "thinking" para `gemini-2.5-pro` (se facturan como output)

Cost discipline significa que trackeás esto POR CALL, no como sorpresa mensual en la factura. En este ejercicio leés esos campos y computás un estimado usando las tarifas actuales de `gemini-2.5-flash-lite`.

## Docs & referencias

1. [`UsageMetadata` en la referencia de generate-content](https://ai.google.dev/api/generate-content#UsageMetadata) — todos los campos y su significado
2. [Pricing de Gemini API](https://ai.google.dev/pricing) — tarifas actuales por 1M tokens por modelo
3. [SDK `@google/genai` (README)](https://github.com/googleapis/js-genai) — uso del cliente

## Tu tarea

1. Hacé una llamada a `generateContent` con `model: "gemini-2.5-flash-lite"` y un prompt lo suficientemente largo para generar token counts visibles (ej. `"Summarize the plot of Romeo and Juliet in 3 sentences."`). Poné `config.maxOutputTokens: 256`.
2. Leé `response.usageMetadata`. Extraé:
   - `inputTokens` desde `promptTokenCount`
   - `outputTokens` desde `candidatesTokenCount`
   - `totalTokens` desde `totalTokenCount`
3. Computá `estimatedCostUSD` con las tarifas de flash-lite:
   - input:  `$0.10` por 1M tokens
   - output: `$0.40` por 1M tokens
4. Retorná `{ inputTokens, outputTokens, totalTokens, estimatedCostUSD }`.

## Cómo verificar

```bash
aidev verify 03-token-usage
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- El objeto de retorno tiene los 4 campos numéricos
- `inputTokens` y `outputTokens` son positivos
- `totalTokens` ≈ `inputTokens + outputTokens` (con margen por thinking tokens)
- `estimatedCostUSD` es un número positivo pequeño (< $0.01)
- `estimatedCostUSD` matchea exacto con la fórmula de flash-lite

## Concepto extra (opcional)

El módulo `cost.ts` de este repo ya conoce el pricing de Gemini y expone `normalizeGeminiUsage()` + `estimateCost()`. En una CLI real que loguea costo por corrida llamarías a esas funciones en vez de derivar precios a mano. Este ejercicio lo hace manual para que entiendas de dónde sale el número — black-boxear cost estimation es como equipos terminan sorprendidos por una factura de $3k a fin de mes.

Cuando usás `gemini-2.5-pro` con thinking habilitado, aparece `thoughtsTokenCount` en `usageMetadata`. Esos tokens **se facturan como output**, así que "precio de output × candidatesTokenCount" solo va a sub-contar. Usá `totalTokenCount - promptTokenCount` (o sumá `candidates + thoughts`) para un output accurate en ese modelo.
