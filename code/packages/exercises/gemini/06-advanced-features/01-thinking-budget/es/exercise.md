# Exercise 01 — Thinking tokens and thinkingBudget

## Concepto

Los modelos Gemini 2.5 pueden generar **tokens de razonamiento** internos antes de emitir la respuesta visible. Pensalo como scratch-paper que el modelo hace pero no muestra. Mejora la calidad en tareas multi-step de matemática, lógica y generación de código — al costo de output tokens extra (invisibles).

La superficie de control es `config.thinkingConfig.thinkingBudget`:

| Valor | Significado |
|---|---|
| `0` | Thinking OFF — más rápido, más barato, pero puede fallar en problemas difíciles |
| `-1` | Dynamic — el modelo decide cuánto pensar por request |
| `1..24576` | Budget fijo (default 2.5-flash: 8192) |

Cuando thinking está on, `response.usageMetadata.thoughtsTokenCount` reporta cuántos tokens se "gastaron" internamente. **Los tokens de thinking se facturan al rate de output** — incluílos en tus estimaciones de costo.

En este ejercicio resolvés un problema verbal multi-step donde thinking ayuda de verdad, e inspeccionás el breakdown de usage para ver thinking vs output visible.

## Docs & referencias

1. [Guía de thinking](https://ai.google.dev/gemini-api/docs/thinking) — cuándo thinking ayuda, semántica del budget, matemática de costo
2. [`ThinkingConfig`](https://ai.google.dev/api/generate-content#ThinkingConfig) — referencia de campos
3. [`UsageMetadata.thoughtsTokenCount`](https://ai.google.dev/api/generate-content#UsageMetadata) — dónde leer el usage de thinking

## Tu tarea

1. Llamá a `generateContent` con:
   - `model`: `"gemini-2.5-flash"` (thinking está soportado en 2.5+)
   - `contents`: un word problem multi-step que se beneficie de razonamiento (el starter incluye uno sobre trenes cruzándose)
   - `config.thinkingConfig.thinkingBudget`: `1024`
   - `config.maxOutputTokens`: `400`
2. Leé `response.usageMetadata`. Extraé:
   - `thoughtsTokenCount`
   - `candidatesTokenCount`
3. Retorná `{ thoughtsTokenCount, candidatesTokenCount, answer: response.text }`.

## Cómo verificar

```bash
aidev verify 01-thinking-budget
```

Los tests verifican:
- Exactamente 1 llamada a `generateContent`
- Request `config.thinkingConfig.thinkingBudget` es un número positivo
- Modelo es `gemini-2.5-*`
- Retorno tiene los tres campos con los tipos correctos
- **`thoughtsTokenCount > 0`** — thinking se usó de verdad
- `candidatesTokenCount > 0` y `answer` no vacío

## Concepto extra (opcional)

Una trampa: la gente ve que `candidatesTokenCount + promptTokenCount < totalTokenCount` y asume que le están duplicando la factura. No es así — el gap es `thoughtsTokenCount`. Tu modelo de costo tiene que contemplar thinking o te va a sub-contar silenciosamente.

¿Cuándo vale la pena thinking? Regla aproximada:
- **Sí**: razonamiento matemático, código multi-step, generación de hipótesis, decisiones basadas en reglas.
- **No**: summarization simple, keyword extraction, clasificación, tareas de formato.

Arrancá con `thinkingBudget: -1` (dynamic) en desarrollo e inspeccioná `thoughtsTokenCount`. Si consistentemente es alto para tareas donde no lo necesitás, explícitamente capalo o deshabilitá thinking para esos prompts.

En agent loops, thinking en el step del planner (ej. ejercicio 03 del track 05) muchas veces vale la pena; en turns de leaf tool-call usualmente es desperdicio.
