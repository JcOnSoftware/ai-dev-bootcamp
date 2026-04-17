# Exercise 05 — Structured output with responseSchema

## Concepto

Cuando construís una feature real arriba de un LLM, el texto libre es el enemigo. Necesitás que el modelo te devuelva data en una forma que tu código TypeScript pueda confiar — no un string que tenés que parsear con regex y rezar.

Gemini lo llama **structured output**. Pasás dos cosas en `config`:

1. `responseMimeType: "application/json"` — le dice al modelo que emita JSON, no prosa.
2. `responseSchema` — un objeto schema (no JSON Schema — es la forma simplificada de Google usando el enum `Type` de `@google/genai`) que describe campos esperados, tipos y cuáles son required.

Con ambos seteados, el SDK te devuelve `response.text` como un JSON string que **está garantizado de matchear el schema**. Lo parseás, TypeScript narrow del resultado, y seguís.

Los valores del enum `Type` que más vas a usar: `Type.OBJECT`, `Type.STRING`, `Type.NUMBER`, `Type.INTEGER`, `Type.BOOLEAN`, `Type.ARRAY`. Los valores enum van en el campo `enum: [...]` de una propiedad string.

## Docs & referencias

1. [Guía de structured output](https://ai.google.dev/gemini-api/docs/structured-output) — patrones de responseMimeType + responseSchema con ejemplos
2. [Referencia del tipo `Schema`](https://ai.google.dev/api/caching#Schema) — todos los campos (`type`, `properties`, `required`, `enum`, `items`, `description`)
3. [SDK `@google/genai` (README)](https://github.com/googleapis/js-genai) — incluye el import del enum `Type`

## Tu tarea

Analizá este texto:

> `"This new CLI tool is a lifesaver — saved me hours on the demo."`

1. Importá `Type` desde `@google/genai` además de `GoogleGenAI`.
2. Llamá a `generateContent` con `model: "gemini-2.5-flash-lite"`, `maxOutputTokens: 128`, y un `contents` pidiendo al modelo analizar el sentiment.
3. Seteá `config.responseMimeType: "application/json"`.
4. Seteá `config.responseSchema` describiendo un objeto con:
   - `sentiment`: string, uno de `"positive" | "negative" | "neutral"` (usá `enum`)
   - `confidence`: number
   - `required`: ambos campos
5. `JSON.parse(response.text)` y retornalo como `{ sentiment, confidence }`.

## Cómo verificar

```bash
aidev verify 05-structured-output
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- Request `config.responseMimeType === "application/json"`
- Request `config.responseSchema` declara las propiedades `sentiment` y `confidence`
- El valor de retorno tiene `sentiment: string` y `confidence: number`
- `sentiment` es uno de los tres valores del enum
- `confidence` está entre 0 y 1 (inclusive)
- Para esta review claramente positiva, el modelo retorna `sentiment: "positive"`

## Concepto extra (opcional)

Structured output **no reemplaza validación de input**. El schema constrain el formato del output, pero el modelo puede seguir devolviendo `{ sentiment: "positive", confidence: 0.99 }` para un texto que cualquier humano leería como negativo. Corré evals con ground-truth sobre data real antes de confiar en el `confidence` del modelo.

Para shapes complejos anidados (arrays de objetos, uniones, tipos discriminados), el lenguaje de schema de Gemini es expresivo pero más limitado que Zod/JSON Schema Draft 2020. Si tu schema real no entra, considerá: (a) pedir JSON SIN `responseSchema` y validar con Zod de tu lado, o (b) partir la tarea en varias llamadas chicas cada una con un schema simple.
