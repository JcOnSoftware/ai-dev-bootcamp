# Exercise 04 — Streaming responses with generateContentStream

## Concepto

Las llamadas no-streaming bloquean hasta que el modelo termina toda la respuesta. Para UIs de chat, asistentes de código o cualquier cosa interactiva, querés que los tokens aparezcan a medida que llegan — eso es **streaming**.

El método de streaming de Gemini es `ai.models.generateContentStream({ ... })`. Retorna `Promise<AsyncGenerator<GenerateContentResponse>>` — a diferencia del stream de OpenAI (una Promise que resuelve a un objeto `Stream` con `[Symbol.asyncIterator]`), el valor de retorno de Gemini YA ES el async iterable una vez que lo awaiteás.

Iterando con `for await` te da un chunk por step con forma `GenerateContentResponse`. Cada chunk tiene un getter `.text` de conveniencia con el texto incremental — acumulalos en tu string final. La cantidad de chunks depende del modelo y del largo de la respuesta; a veces Gemini batchea toda la respuesta en un solo chunk, a veces la parte en varios.

## Docs & referencias

1. [Streaming de generación de texto](https://ai.google.dev/gemini-api/docs/text-generation#generate-a-text-stream) — cómo funciona + samples
2. [Referencia de la API `generateContent`](https://ai.google.dev/api/generate-content) — streaming comparte el mismo shape de request
3. [SDK `@google/genai` (README)](https://github.com/googleapis/js-genai) — uso del cliente

## Tu tarea

1. Llamá a `ai.models.generateContentStream()` con:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"List three unusual hobbies, each on its own line."`
   - `config`: `{ maxOutputTokens: 128 }`
2. Iterá el async iterable con `for await`.
3. Acumulá el texto a través de los chunks (usá `chunk.text` — puede ser empty string en algunos chunks, está bien).
4. Contá cuántos chunks llegaron.
5. Retorná `{ text, chunkCount }`.

## Cómo verificar

```bash
aidev verify 04-streaming
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- Se usa el método streaming (`generateContentStream`, `streamed: true`)
- El valor de retorno tiene un `text` string no vacío
- `chunkCount` es al menos 1
- La respuesta ensamblada por el harness tiene candidates (prueba que el round-trip de streaming completó)

## Concepto extra (opcional)

Streaming cambia tu error handling: si el modelo empieza a generar y después falla a mitad (rate limit, safety block, drop de red), vas a tener texto PARCIAL. Código defensivo acumula en un buffer y solo commitea cuando la iteración completa OK.

Para una demo en vivo, corré:

```bash
aidev run 04-streaming --solution --stream-live
```

Ese flag imprime el texto de cada chunk a medida que llega — podés ver el pacing que usa Google. El harness captura los chunks para el test independientemente de si los consumís en vivo o no.
