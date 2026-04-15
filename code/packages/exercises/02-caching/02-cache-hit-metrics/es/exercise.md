# 02-cache-hit-metrics — Métricas de cache hit

## Concepto

Cuando el caché de Anthropic está activo, el objeto `usage` de cada response incluye campos que te permiten calcular exactamente cuánto ahorraste:

- `cache_read_input_tokens` → tokens leídos del caché (precio: **0.1× input**)
- `cache_creation_input_tokens` → tokens escritos al caché (precio: **1.25× input**)
- `input_tokens` → tokens de entrada regulares (precio: **1.0× input**)

Con estos tres valores podés calcular el **porcentaje de ahorro** comparando el costo efectivo contra el hipotético costo sin caché (todos los tokens al precio regular).

Ejemplo con Haiku ($1.00/1M input tokens):
- 5,000 tokens leídos del caché: $0.0005 (0.1×)
- Si fueran regulares: $0.005 (1.0×)
- Ahorro: 90%

## Docs y referencias

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Pricing de caché: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing
- Messages API reference: https://docs.claude.com/en/api/messages

## Tu tarea

1. Implementá la función helper `cacheStats(usage: CacheUsage, model: string): CacheStats` y exportala por nombre. **El `model` es obligatorio** — permite que la función funcione correctamente con cualquier modelo (Haiku, Sonnet, Opus), no solo el default.
2. La función debe retornar un objeto con 5 campos: `cached`, `created`, `regular`, `savings_pct`, `effective_cost_usd`.
3. Usá `estimateCost(model, usage)` de `cost.ts` para calcular el `effective_cost_usd` con la fórmula cache-aware. Pasá el `model` recibido como parámetro — nunca lo hardcodees adentro de `cacheStats`.
4. En `run()`: hacé 2 llamadas con `LONG_SYSTEM_PROMPT` como bloque de sistema cacheado, aplicá `cacheStats(response.usage, MODEL)` al usage de la segunda llamada, y retorná el resultado.

## Cómo verificar

```bash
# Correr contra la solución:
aidev verify 02-cache-hit-metrics --solution

# Tu implementación:
aidev verify 02-cache-hit-metrics

# Ver output completo:
aidev run 02-cache-hit-metrics --solution --full
```

Los tests verifican:
- `cacheStats` está exportada como función nombrada.
- Con mock `{ cache_read_input_tokens: 5000, ... }`: `stats.cached === 5000`.
- `stats.savings_pct` está entre 0 y 100.
- `stats.savings_pct > 50` cuando la mayoría de tokens son cache-read.
- `stats.effective_cost_usd` es positivo y finito.
- `stats.effective_cost_usd` escala con el precio del modelo (mismo usage con Sonnet es más caro que con Haiku).
- En integración: `result.calls` tiene 2 elementos, call 2 tiene `cache_read_input_tokens > 0`.
- El valor retornado por `run()` tiene los 5 campos, con `savings_pct > 50`.

## Concepto extra

**¿Cómo usar estas métricas en producción?**

```
savings_pct > 80% → el sistema prompt está bien dimensionado para el TTL
savings_pct < 20% → el caché no se está aprovechando; revisar:
  - ¿El system prompt supera el umbral de 4,096 tokens?
  - ¿Las llamadas llegan con más de 5 minutos de separación?
  - ¿El orden de los mensajes invalida el prefijo cacheado?
```

Loggear `savings_pct` y `effective_cost_usd` por request permite detectar regresiones de caché antes de que impacten la factura. En un sistema de alto volumen (1M llamadas/día), pasar de 0% a 80% de ahorro en caché puede representar miles de dólares por día.
