# Exercise 03 — Router: model picks between multiple tools

## Concepto

Los sistemas reales exponen más de una tool. El modelo tiene que **rutear** — leer la pregunta del user, leer el name + description de cada tool, y elegir el mejor fit. Así es como un bot de chat-ops decide "call `create_ticket`" vs "call `search_kb`" vs "responder directo".

Vas a declarar DOS tools:
- `get_weather(location)` — la conocida
- `get_news_headlines(topic, max?)` — retorna headlines recientes sobre un tema

Con el prompt `"Give me three recent headlines about AI research."`, el modelo debe elegir `get_news_headlines` con `topic = "AI research"`. NO `get_weather` — aunque ambas tools existen en el mismo array, la de weather no tiene nada que ver con la pregunta.

La calidad del routing depende casi enteramente de **los campos description**. "Returns weather" puede colisionar con "get news" si ambas descriptions son vagas. Buenas descriptions especifican inputs, outputs, y cuándo llamar.

## Docs & referencias

1. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — overview completo
2. [Schema de FunctionDeclaration](https://ai.google.dev/api/caching#FunctionDeclaration) — cada declaration necesita `name`, `description`, `parameters`
3. [Prompting para tool routing](https://ai.google.dev/gemini-api/docs/function-calling#best-practices) — tips de Google

## Tu tarea

1. Declará DOS funciones en el MISMO array `functionDeclarations`:
   - `get_weather` con un parámetro string required `location`
   - `get_news_headlines` con:
     - `topic` (string, required)
     - `max` (integer, opcional)
2. Llamá `generateContent` con:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"Give me three recent headlines about AI research."`
   - `config.tools`: `[{ functionDeclarations: [weather, news] }]`
   - `config.maxOutputTokens`: `256`
3. Leé `response.functionCalls[0]`.
4. Retorná `{ chosenFunction: call.name, chosenArgs: call.args }`.

## Cómo verificar

```bash
aidev verify 03-multiple-tools
```

Los tests verifican:
- Exactamente 1 llamada a la API
- El array de function declarations del request tiene AL MENOS 2 entries
- Un name matchea `news|headline`, otro matchea `weather`
- Retorno tiene `chosenFunction: string` + `chosenArgs: object`
- **El modelo ruteó a news** (el nombre de la chosen function incluye `news` o `headline`)
- `chosenArgs.topic` es un string no vacío

## Concepto extra (opcional)

Cuando una tool nunca se elige a través de tus tests, generalmente es problema de description — no de prompt. Escribí descriptions que arranquen con el verbo e incluyan triggers típicos: `"Searches the internal knowledge base by keyword. Use when the user asks about company policies, product specs, or past decisions."` es radicalmente distinto de `"Searches docs."`.

Si el routing es crítico, considerá agregar un hint chico en el prompt (en la system instruction) tipo "prefer calling `send_email` over `create_draft` when the user asks to send immediately." El routing interno del modelo es bueno, pero guidance explícita le gana a implícita siempre.
