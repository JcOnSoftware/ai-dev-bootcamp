# Exercise 01 — Your first Gemini generation

## Concepto

La API de Gemini se organiza alrededor de **`generateContent`** — enviás `contents` (un string o un array estructurado) y recibís una respuesta con `candidates`, `usageMetadata` y `modelVersion`. La forma es distinta a la de OpenAI (`choices`) o Anthropic (`content` blocks): Gemini devuelve candidates cuyo `content.parts[]` tiene un campo `text` cada uno.

El SDK de Node.js (`@google/genai`) es el paquete actual — NO `@google/generative-ai` (deprecado en noviembre 2025). Creás una instancia con `new GoogleGenAI({ apiKey })` y llamás a `ai.models.generateContent({ model, contents, config })`.

El modelo más barato es `gemini-2.5-flash-lite` ($0.10 input / $0.40 output por 1M tokens) — mismo tier que Haiku y gpt-4.1-nano. Cada llamada en este ejercicio cuesta fracciones de centavo.

## Docs & referencias

1. [SDK `@google/genai` (README)](https://github.com/googleapis/js-genai) — instalación y setup del cliente
2. [Referencia de la API `generateContent`](https://ai.google.dev/api/generate-content) — schema completo de request/response
3. [Lista de modelos](https://ai.google.dev/gemini-api/docs/models) — modelos Gemini disponibles y tiers de precio

## Tu tarea

1. Abrí `starter.ts` y creá un cliente `GoogleGenAI`. Pasale `{ apiKey: process.env.GEMINI_API_KEY }`.
2. Llamá a `ai.models.generateContent()` con:
   - `model`: `"gemini-2.5-flash-lite"` (el más barato)
   - `contents`: un prompt corto (ej. `"Say hello briefly in Spanish, one short sentence."`)
   - `config`: `{ maxOutputTokens: 128 }` para mantener la respuesta corta
3. Retorná la respuesta completa (el objeto `GenerateContentResponse`).

## Cómo verificar

```bash
aidev verify 01-first-generate
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- Se usa el método `generateContent` (no streaming)
- Se usa un modelo Gemini
- Se pasa un `contents` no vacío
- La respuesta tiene al menos un candidate con text parts
- `usageMetadata` reporta `promptTokenCount` y `candidatesTokenCount`

## Concepto extra (opcional)

La forma de la respuesta de Gemini tiene algunas sutilezas que vale la pena conocer:

- **`response.text`** es un getter de conveniencia del SDK — concatena los `text` de `candidates[0].content.parts[]`. Útil para prints rápidos, pero la fuente estructural de verdad es `candidates[...].content.parts[...].text`.
- **`finishReason`** en cada candidate te dice por qué paró la generación: `"STOP"`, `"MAX_TOKENS"`, `"SAFETY"`, etc. A diferencia de OpenAI, Gemini usa SCREAMING_CASE.
- Los **modelos con reasoning** (`gemini-2.5-pro`) pueden incluir un `thoughtsTokenCount` en `usageMetadata` — esos tokens se facturan como output.
