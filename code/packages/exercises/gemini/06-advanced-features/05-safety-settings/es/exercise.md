# Exercise 05 — Configure safety thresholds per request

## Concepto

Cada response de Gemini se evalúa contra un set fijo de categorías de daño. Si el riesgo detectado en cualquier categoría supera el threshold configurado, el modelo **bloquea** la respuesta — recibís un `candidate` vacío con `finishReason: "SAFETY"` y una lista de `safetyRatings` triggereados.

Las **4 HarmCategories core**:

- `HARM_CATEGORY_HARASSMENT`
- `HARM_CATEGORY_HATE_SPEECH`
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`
- `HARM_CATEGORY_DANGEROUS_CONTENT`

El enum de threshold (`HarmBlockThreshold`):

| Valor | Bloquea cuando el riesgo es... |
|---|---|
| `BLOCK_LOW_AND_ABOVE` | low / medium / high — el más agresivo |
| `BLOCK_MEDIUM_AND_ABOVE` | medium / high — default de producción |
| `BLOCK_ONLY_HIGH` | solo high — permisivo |
| `BLOCK_NONE` | nunca — te hacés cargo del 100% |

Pasás los settings por request:

```ts
config.safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ...
]
```

Este ejercicio usa un prompt benigno, así que nada efectivamente tripa el filter — pero el SHAPE de la configuración es lo que importa. Haselo bien acá y podés endurecer (o aflojar) safety en cualquier lado de tu app.

## Docs & referencias

1. [Guía de safety settings](https://ai.google.dev/gemini-api/docs/safety-settings) — categorías, thresholds, ejemplos
2. [Enum `HarmCategory`](https://ai.google.dev/api/generate-content#HarmCategory) — lista completa (más allá de los 4 default)
3. [Enum `HarmBlockThreshold`](https://ai.google.dev/api/generate-content#HarmBlockThreshold) — todos los valores de threshold

## Tu tarea

1. Importá `HarmCategory` y `HarmBlockThreshold` de `@google/genai` junto con `GoogleGenAI`.
2. Armá un array `safetySettings` de 4 entries cubriendo HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT — todos con threshold `BLOCK_MEDIUM_AND_ABOVE`.
3. Llamá `generateContent` con:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"Tell me a harmless one-sentence joke about programmers."`
   - `config.safetySettings`: el array de 4 entries
   - `config.maxOutputTokens`: `128`
4. Retorná `{ answer, finishReason, configuredCategories }` donde `configuredCategories` es un array de los strings de category que configuraste.

## Cómo verificar

```bash
aidev verify 05-safety-settings
```

Los tests verifican:
- Exactamente 1 llamada a `generateContent`
- Request `config.safetySettings` tiene ≥4 entries
- Cada entry tiene `category` y `threshold` como strings
- Las 4 categorías core están todas cubiertas
- Retorno tiene los tres campos esperados
- El prompt benigno produjo un `answer` no vacío Y `finishReason !== "SAFETY"`
- `configuredCategories` retorna ≥4 categorías

## Concepto extra (opcional)

Los sistemas de producción usualmente lockean safety en `BLOCK_MEDIUM_AND_ABOVE` (el default) para contenido de audiencia general y consideran `BLOCK_LOW_AND_ABOVE` para contextos kid-focused o altamente regulados. `BLOCK_NONE` raramente es la respuesta correcta en prod — significa que aceptás responsabilidad por cada output, lo que la mayoría de orgs no pueden justificar.

Cuando safety dispara, `response.candidates[0]` puede faltar enteramente — chequeá `response.promptFeedback?.blockReason` para entender POR QUÉ (el prompt fue bloqueado vs. el output fue bloqueado). Para UX, decile al user que su prompt no fue permitido; no expongas los nombres internos de category (eso es una hoja de ruta para red teams).

Más allá de las 4 categorías principales, Gemini también tiene `HARM_CATEGORY_CIVIC_INTEGRITY` (político) y categorías adicionales en algunos modelos. Si estás construyendo para elecciones o contextos de salud pública, configuralos explícitamente — los defaults muchas veces los dejan en un seteo permisivo.
