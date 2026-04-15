# Exploration: add-prompt-caching-track

**Change:** `add-prompt-caching-track`
**Phase:** explore
**Date:** 2026-04-14

---

## Summary

El track `02-caching` enseña cómo el prompt caching de Anthropic reduce costos y latencia en producción. El learner va desde poner el primer `cache_control` en un system prompt hasta combinar multi-breakpoints, TTL extendido y tool use en un loop conversacional — exactamente cómo se usa en apps reales.

---

## API Research Findings

Fuente: https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching

### Parámetro `cache_control`

- Shape: `{ "cache_control": { "type": "ephemeral", "ttl"?: "5m" | "1h" } }`
- `type: "ephemeral"` es el único valor soportado actualmente
- `ttl` es opcional; default `"5m"`. TTL `"1h"` cuesta 2× el precio base de input
- Se puede poner en: tool definitions, system blocks, message content blocks (text, images, documents, tool use/results)
- **NO se puede poner en:** thinking blocks, sub-content blocks como citations, empty text blocks

### Breakpoints

- **Límite: 4 breakpoints explícitos por request**
- Si ya hay 4 explícitos y el sistema intenta automatic caching → error 400
- Lookback window: 20 bloques hacia atrás desde el breakpoint
- Exact prefix matching requerido (hash de todo lo previo al breakpoint)

### Usage fields en el response

```json
{
  "cache_creation_input_tokens": 0,
  "cache_read_input_tokens": 0,
  "input_tokens": 50,
  "output_tokens": 503
}
```

- `total_input = cache_read_input_tokens + cache_creation_input_tokens + input_tokens`
- Estos campos ya existen en el SDK `@anthropic-ai/sdk ^0.40`; el harness los captura en `response` (que es un `Message` SDK completo)
- **No se necesitan beta headers** — feature GA en Claude API

### TTL options

| TTL | Costo write | Caso de uso |
|-----|-------------|-------------|
| `"5m"` | 1.25× base input | Prompts usados cada pocos minutos |
| `"1h"` | 2.0× base input | Prompts usados cada 10-60 min; evitar re-escritura frecuente |

Regla al mezclar TTLs en un request: los bloques de 1h deben aparecer ANTES que los de 5m.

### Model compatibility y min token thresholds

| Modelo | Min tokens para cachear |
|--------|------------------------|
| Claude Haiku 3 | 4,096 |
| Claude Haiku 3.5 (deprecated) | 2,048 |
| **Claude Haiku 4.5** | **4,096** |
| Claude Sonnet 3.7 | 1,024 |
| Claude Sonnet 4 / 4.5 | 1,024 |
| Claude Sonnet 4.6 | 2,048 |
| Claude Opus 4 / 4.1 / 4.5 / 4.6 | 4,096 |

**Implicación crítica:** Haiku 4.5 requiere 4,096 tokens mínimos para que el cache funcione. Si el system prompt es más corto → silenciosamente no cachea, `cache_creation_input_tokens = 0`. Los ejercicios DEBEN incluir un fixture de system prompt grande (~1,500–2,000 palabras) para garantizar superar el threshold.

### Pricing multipliers (sobre precio base de input)

- Cache write 5m: **1.25×**
- Cache write 1h: **2.0×**
- Cache read (hit): **0.1×** — 90% de descuento
- Output tokens: precio estándar, sin descuento

Haiku 4.5 pricing base: ~$0.80/MTok input, $4.00/MTok output (verificar pricing page para exactitud).

---

## Harness Gaps

### 1. `usage` → cache fields YA están disponibles (no gap)

El harness captura el `Message` SDK completo en `response`. El tipo `Message` del SDK incluye `usage.cache_creation_input_tokens` y `usage.cache_read_input_tokens`. **Los tests pueden assertar sobre estos campos directamente** sin cambios en el harness.

Único gotcha: el tipo `Usage` en `harness.ts` no está explícitamente tipado como un tipo propio — se accede como `call.response.usage` que es el tipo `Usage` del SDK. Al escribir los tests, usar `call.response.usage` y no el tipo `Usage` de `cost.ts`.

### 2. `cost.ts` — GAP REAL, necesita update antes del ejercicio 02

El `Usage` interface en `cost.ts` solo declara `input_tokens` y `output_tokens`:

```typescript
// ACTUAL — no incluye campos de caching
export interface Usage {
  input_tokens: number;
  output_tokens: number;
}
```

Y `estimateCost()` tampoco cuenta `cache_creation_input_tokens` (1.25×) ni `cache_read_input_tokens` (0.1×).

**Impacto:** El comando `aidev run` muestra costos incorrectos para ejercicios de caching. No bloquea los tests (los tests no usan `cost.ts`) pero sí la experiencia de `aidev run`.

**Tarea de dependencia:** Actualizar `cost.ts` + `render.ts` + `SdkMessage.usage` en `render.ts` para incluir campos de cache pricing. Esto es un **prerequisito para el ejercicio 02** (que enseña a leer y calcular ahorros).

### 3. Fixture de system prompt largo — necesario como asset

Haiku 4.5 requiere ≥4,096 tokens. Necesitamos un archivo fixture de texto largo (~1,500 palabras / ~2,000 tokens) que los ejercicios 01-04 puedan importar como system prompt. Opciones:

- Un documento técnico sobre "best practices de API design" (neutral, reutilizable)
- Ubicación sugerida: `code/packages/exercises/02-caching/fixtures/long-system-prompt.ts` (string exportada)

---

## Proposed 5 Exercises

### `01-basic-caching`
- **Concepto único:** Primer cache breakpoint — poner `cache_control: { type: "ephemeral" }` en el último bloque estático del system prompt y verificar que `cache_creation_input_tokens > 0` en la primera llamada
- **Dos llamadas:** call 1 → escribe el cache (creation > 0), call 2 con mismo prompt → lee del cache (read > 0)
- **Estimated:** 20 min
- **Costo:** ~$0.003 (2 calls × Haiku 4.5 con 4,096+ tokens write + cheap reads)

### `02-cache-hit-metrics`
- **Concepto único:** Leer y calcular el ahorro real — `cache_read_input_tokens * 0.1× vs input_tokens * 1×`; retornar un objeto `{ savings_pct, effective_cost_usd }` y hacer que los tests asserten sobre los valores calculados
- **Depende de:** `01-basic-caching` (ya saben crear el cache; ahora miden)
- **Estimated:** 20 min
- **Costo:** ~$0.003 (similar al 01, el valor está en los cálculos)

### `03-multi-breakpoint`
- **Concepto único:** Múltiples cache breakpoints — system prompt (breakpoint 1) + large tool definitions (breakpoint 2) + growing conversation history (breakpoint 3); observar cuáles tokens van a qué sección del `usage`
- **Límite:** max 4 breakpoints; el ejercicio usa 3 para dejar margen
- **Estimated:** 25 min
- **Costo:** ~$0.005 (más tokens totales por los tool definitions)

### `04-ttl-extended`
- **Concepto único:** TTL `"1h"` — cuándo conviene pagar 2× el write para amortizar a lo largo de muchas reads; ejercicio requiere hacer el cálculo de break-even (a partir de cuántas reads el 1h TTL es más barato que re-escribir cada 5min)
- **No requiere esperar 1h:** el test verifica que el request se envió con `ttl: "1h"` en `cache_control` y que `cache_creation_input_tokens > 0`; el cálculo de break-even es parte del return value
- **Estimated:** 20 min
- **Costo:** ~$0.004 (write 2× pero solo una llamada con 1h TTL)

### `05-caching-with-tools`
- **Concepto único:** Loop conversacional con tool use + caching — system prompt cacheado (breakpoint 1) + tool definitions cacheados (breakpoint 2) + history de mensajes cacheada (breakpoint 3); 3 turnos de conversación donde el learner observa qué porción crece llamada a llamada y qué permanece en cache
- **El escenario más realista:** así se usa caching en producción con agents
- **Estimated:** 35 min
- **Costo:** ~$0.008 (3 turns + tool overhead)

---

## Cost Estimate

| Ejercicio | Llamadas | Tokens estimados | Costo aprox |
|-----------|----------|-----------------|-------------|
| 01-basic-caching | 2 | ~4,200 in + ~100 out × 2 | ~$0.003 |
| 02-cache-hit-metrics | 2 | ~4,200 in × 2 | ~$0.003 |
| 03-multi-breakpoint | 3 | ~5,000 in × 3 | ~$0.006 |
| 04-ttl-extended | 2 | ~4,200 in × 2 | ~$0.004 |
| 05-caching-with-tools | 6 | ~6,000 in × 3 turns × 2 | ~$0.010 |

**Total estimado por learner:** ~$0.026 (verify + playground run)

Esto es ~2.6× el costo del track 01-foundations (~$0.01). Razonable y dentro del presupuesto de ~$2 end-to-end del bootcamp. El costo más alto es inevitable porque el caching requiere enviar prompts grandes para superar el threshold.

**Nota sobre `--solution` runs:** incluidos en el estimado. El multiplier de pricing 1.25× en cache writes está incorporado.

---

## Open Questions

1. **Modelo para el track:** Las soluciones de Foundations usan Haiku por disciplina de costos. Para caching, Haiku 4.5 tiene threshold de 4,096 tokens — el más alto de todos los Haiku. ¿Confirmamos Haiku 4.5 como modelo default del track (coherente con policy pero requiere fixture más largo) o usamos Sonnet 4.5 (threshold 1,024, más fácil pero más caro)?

2. **Fixture de system prompt:** ¿Dónde vive el fixture largo? Opciones:
   - `code/packages/exercises/02-caching/fixtures/long-system-prompt.ts` (compartido entre los 5 ejercicios del track)
   - Cada ejercicio tiene su propio texto largo inline en `solution.ts`
   La opción compartida es más limpia pero agrega una convención nueva al exercise contract. ¿Aprobado?

3. **`cost.ts` update scope:** ¿El update de `cost.ts` es una tarea explícita en el task breakdown (con su propio test en `cost.test.ts`) o se hace inline durante `sdd-apply`? Recomendamos tarea explícita porque afecta el `render.ts` y el tipo `SdkMessage`.

4. **`en/exercise.md` para todos desde el inicio:** El track 01-foundations los tiene. ¿Generamos `en/exercise.md` junto con `es/exercise.md` para todos los 5 ejercicios del caching track desde el inicio, o `es` primero y `en` después?

---

## skill_resolution: injected
