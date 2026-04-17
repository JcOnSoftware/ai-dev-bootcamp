# Exercise 02 — Choosing the right Gemini model

## Concepto

No toda tarea necesita el modelo más caro. La familia 2.5 de Gemini cubre tres tiers de costo:

| Modelo | Input $/1M | Output $/1M | Cuándo usarlo |
|---|---|---|---|
| `gemini-2.5-flash-lite` | $0.10 | $0.40 | Alto volumen, tareas simples (clasificación, extracción, respuestas cortas) |
| `gemini-2.5-flash` | $0.30 | $2.50 | Balanceado — default para la mayoría de usos productivos |
| `gemini-2.5-pro` | $1.25 | $10.00 | Razonamiento complejo, long-context, generación de código |

Un buen hábito de ingeniería: **arrancá con el más barato, escalá solo cuando la calidad falla**. La forma de construir ese hábito es correr el mismo prompt contra dos tiers y comparar las salidas vos mismo. No podés calibrar lo que no viste.

En este ejercicio hacés dos llamadas con el mismo prompt exacto, una en `flash-lite` y otra en `flash`, y retornás ambas respuestas lado a lado para inspeccionar.

## Docs & referencias

1. [Lista de modelos Gemini](https://ai.google.dev/gemini-api/docs/models) — todas las variantes 2.5, capacidades, context windows
2. [Pricing de Gemini API](https://ai.google.dev/pricing) — tarifas por 1M de tokens input/output, al día
3. [SDK `@google/genai` (README)](https://github.com/googleapis/js-genai) — uso del cliente

## Tu tarea

1. Instanciá `GoogleGenAI` con la API key.
2. Definí un único prompt — ej. `"Explain what an API is in one sentence."`
3. Hacé DOS llamadas a `generateContent` con `config.maxOutputTokens: 128`:
   - Una con `model: "gemini-2.5-flash-lite"`
   - Otra con `model: "gemini-2.5-flash"`
4. Retorná ambas respuestas como `{ flashLite, flash }`.

## Cómo verificar

```bash
aidev verify 02-model-selection
```

Los tests verifican:
- Se hacen exactamente 2 llamadas a la API
- Aparecen ambos modelos (no el mismo dos veces)
- Ambas llamadas usan el mismo prompt (para comparar manzanas con manzanas)
- Ambas respuestas tienen candidates con text
- Ambas respuestas reportan uso de tokens
- El valor de retorno tiene las propiedades `flashLite` y `flash`

## Concepto extra (opcional)

Después de que `aidev verify` pase, probá:

```bash
aidev run 02-model-selection --solution --full
```

Vas a ver ambas respuestas completas más el total de tokens y el costo. En muchos casos `flash-lite` y `flash` producen respuestas cortas casi idénticas — ahí es cuando DEBERÍAS estar corriendo flash-lite en producción. Cuando el gap de calidad es obvio, ya tenés evidencia para justificar el escalamiento.
