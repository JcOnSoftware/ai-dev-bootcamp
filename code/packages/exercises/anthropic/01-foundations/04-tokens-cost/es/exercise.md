# Exercise 04 — Tokens y costo: leer usage, calcular USD

## Concepto

Venís de APIs donde pagás **por request**. Con LLMs no. Pagás **por token** — y los tokens de entrada y de salida tienen tarifas distintas.

Cada respuesta del SDK trae un objeto `usage`:

```ts
response.usage = {
  input_tokens: 42,       // lo que le mandaste (prompt + system)
  output_tokens: 128,     // lo que generó el modelo
  cache_creation_input_tokens: 0,   // aparece con prompt caching
  cache_read_input_tokens: 0,       // idem
}
```

Por ahora nos enfocamos en los dos primeros. `cache_*` es un tema propio (lo verás en un ejercicio futuro).

**La fórmula** es aritmética directa, pero es la base de TODO lo que venga después (optimización, budget alerts, billing):

```
costUsd = (input_tokens  / 1_000_000) * pricePerMillionIn
        + (output_tokens / 1_000_000) * pricePerMillionOut
```

Notá el `1_000_000`. Los precios siempre se expresan **por millón de tokens** — una convención universal de la industria. Es la misma unidad que usás cuando googleás "claude haiku pricing".

**Tarifas de Claude Haiku 4.5** (las que vas a usar en este ejercicio):
- Input:  **$1 por millón** de tokens
- Output: **$5 por millón** de tokens

Eso es **5x más caro generar que leer**. No es anecdótico — cambia decisiones de diseño. Un prompt largo con respuesta corta es MUCHO más barato que el inverso.

**¿Por qué te importa?**

- **Budget alerts**: antes de mergear una feature que llama al modelo, calculá lo que va a costar a escala real. Una feature que cuesta $0.001 por request × 100k requests/día = $100/día = $3000/mes. ¿Lo sabías antes de shipear?
- **Modelo correcto**: Haiku cuesta 5-15x menos que Sonnet/Opus. Si tu task no requiere razonamiento complejo, pagar Opus es plata tirada.
- **Prompt engineering tiene precio**: cada palabra extra en tu prompt la pagás. Cada vez. Por eso el prompt caching existe.

## Docs & references

1. **Models overview** — tabla actual de precios por modelo (Opus 4.6, Sonnet 4.6, Haiku 4.5, y legacy):
   → https://docs.claude.com/en/docs/about-claude/models/overview
2. **Messages API reference** — estructura completa del objeto `usage`:
   → https://docs.claude.com/en/api/messages
3. **Pricing page** — detalle completo con batch API discounts y cache rates:
   → https://docs.claude.com/en/docs/about-claude/pricing

> Tip: los precios cambian. Los valores del ejercicio están fijos para que los tests sean estables, pero en producción **nunca hardcodees precios** sin una fecha de revisión — va a envejecer.

## Tu tarea

Abrí `starter.ts`. Hay una función `run` que debe:

1. Crear un cliente Anthropic.
2. Hacer una llamada a **Claude Haiku 4.5** pidiendo algo con cierta longitud (ej: "Explicá en 3 oraciones qué es un Large Language Model"). Usar `max_tokens` ≤ 300.
3. Leer `response.usage.input_tokens` y `response.usage.output_tokens`.
4. Calcular el costo en USD con esta fórmula:
   ```
   costUsd = (input_tokens / 1_000_000) * 1    // $1 por MTok input
           + (output_tokens / 1_000_000) * 5   // $5 por MTok output
   ```
5. Retornar `{ response, costUsd }`.

## Cómo verificar

```bash
# Desde code/:
aidev verify 04-tokens-cost

# Podés también ejecutarlo en modo playground para VER el resultado:
aidev run 04-tokens-cost --solution
```

Los tests validan:
- Hiciste exactamente UNA llamada al API.
- Usaste un modelo Claude Haiku.
- `usage` trae `input_tokens > 0` y `output_tokens > 0`.
- Tu `costUsd` es un `number` positivo.
- Tu `costUsd` coincide (dentro del margen flotante) con el cálculo hecho desde los tokens reales del response y las tarifas de Haiku 4.5 (input $1/MTok, output $5/MTok).

## Concepto extra (opcional)

Después de pasar los tests, probá:

1. Cambiar el modelo a **Sonnet** (`claude-sonnet-4-6`). Las tarifas cambian a $3 input / $15 output. ¿Cuánto más caro sale el mismo prompt?
2. Cambiar el prompt a algo MUCHO más largo (un system prompt de 500 palabras, por ejemplo). Observá cómo crecen los `input_tokens` — y el costo con ellos.
3. Pensar: si tuvieras una app que hace 1M de estas llamadas al mes, ¿qué modelo elegirías? ¿Qué cambiarías del prompt? Esa intuición es lo que separa a un dev que USA la API de uno que la USA BIEN.
