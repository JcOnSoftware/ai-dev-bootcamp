# Exercise 02 — Ground answers with Google Search

## Concepto

Por default, el conocimiento de un modelo está congelado al training time. Preguntá "¿quién ganó el Oscar a Mejor Película en 2024?" y un modelo entrenado en 2023 o se niega o aluciona.

Gemini trae una **built-in tool** (distinta de las custom functions que declaraste hasta ahora) que deja al modelo llamar Google Search durante la generación. La habilitás con una línea:

```ts
config.tools = [{ googleSearch: {} }]
```

Objeto de config vacío — Google provee la tool, vos solo optás por usarla. El modelo decide por request si la invoca. Cuando lo hace, el response incluye `candidates[0].groundingMetadata` con `groundingChunks` — cada uno un `{ web: { uri, title } }` apuntando a una URL que el modelo consultó.

Tres restricciones importantes:

1. **Mutuamente exclusiva con custom tools** en la API actual: podés pasar `googleSearch` O tus `functionDeclarations`, no ambos en un mismo request.
2. **Facturada aparte**: los requests con grounding tienen un fee adicional encima de la generación (ver [pricing](https://ai.google.dev/pricing)).
3. **Sources no deterministas**: la misma query puede retornar grounding chunks distintos entre runs. Tu código no debería asumir un set fijo de sources.

## Docs & referencias

1. [Grounding con Google Search](https://ai.google.dev/gemini-api/docs/grounding) — overview + notas de pricing
2. [Built-in tools en function calling](https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools) — googleSearch, codeExecution, urlContext
3. [`GroundingMetadata`](https://ai.google.dev/api/generate-content#GroundingMetadata) — shape de `groundingChunks`

## Tu tarea

1. Llamá `generateContent` con:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `"Who won the Best Picture Oscar in 2024?"`
   - `config.tools`: `[{ googleSearch: {} }]`
   - `config.maxOutputTokens`: `400`
2. Leé `response.text` → la respuesta natural.
3. Chequeá `response.candidates[0].groundingMetadata`:
   - `hasGroundingMetadata = !!groundingMetadata`
   - `sourceCount = groundingMetadata?.groundingChunks?.length ?? 0`
4. Retorná `{ answer, hasGroundingMetadata, sourceCount }`.

## Cómo verificar

```bash
aidev verify 02-google-search-grounding
```

Los tests verifican:
- Exactamente 1 llamada a `generateContent`
- Request `config.tools` incluye `{ googleSearch: {} }`
- `answer` no vacío
- `hasGroundingMetadata === true` (search corrió)
- `sourceCount > 0`
- La respuesta menciona el ganador real (Oppenheimer) o claramente describe el evento Oscar

## Concepto extra (opcional)

Para tópicos regulados o controversiales muchas veces querés **grounding estricto** — la respuesta debería SOLO aseverar cosas respaldadas por sources retrievadas. Gemini no lo fuerza automáticamente; combiná grounding con un instrucción del prompt tipo "only answer using facts from the search results; otherwise say you don't have that information."

La atribución de sources es otro win de producción: recorrés `groundingMetadata.groundingChunks` y mostrás cada `web.uri + web.title` al user. Eso les da un paper trail que pueden verificar. Para apps legales o médicas esto es muchas veces mandatorio.

`googleSearch` es una de tres built-in tools. El ejercicio 03 cubre `codeExecution` y el 04 cubre `urlContext` — cada uno sigue el mismo patrón "objeto de config vacío, Google provee la tool".
