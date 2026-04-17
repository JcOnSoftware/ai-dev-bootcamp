# Exercise 04 — Carry conversation memory across user turns

## Concepto

Cada ejercicio hasta ahora procesó UN mensaje del user. Los asistentes reales manejan **follow-up questions**: "multiplicá 6 y 7" → "ahora sumale 8". El segundo mensaje solo tiene sentido si el modelo recuerda el primero.

Gemini no tiene memoria built-in. **VOS** la cargás, en el array `contents`. La regla es simple:

- Después de que el agente termina de responder el turn 1, APPENDEÁS el mensaje del user nuevo al MISMO array `contents`.
- Corrés el loop de nuevo.
- El modelo ve la historia completa: pregunta original → tool calls del modelo → resultados → respuesta del modelo → pregunta nueva.

Eso es. No hay session handle, no hay API de state. El array `contents` ES la memoria.

Dos consecuencias prácticas:

1. **El contexto crece linealmente** con el largo de la conversación. Eventualmente pegás el context window y tenés que truncar turns viejos (o resumirlos — ver el track 06 `context-management` de OpenAI para patrones).
2. **Registrar el turn final de texto del modelo importa**. Si solo pusheás user messages + tool calls/resultados y saltás la respuesta natural del modelo, un follow-up tipo "explicá eso más" no tiene nada donde anclar.

## Docs & referencias

1. [Guía de multi-turn conversation](https://ai.google.dev/gemini-api/docs/text-generation#multi-turn-conversations) — cómo funciona el history
2. [Function calling multi-turn](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — recap del shape de `contents`
3. [Referencia `Content` + `Part`](https://ai.google.dev/api/caching#Content) — roles (user / model) y tipos de part

## Tu tarea

1. Armá UN `contents: Content[]` compartido para toda la conversación.
2. Pusheá el primer mensaje del user: `"Multiply 6 and 7 using the tool."`
3. Corré el agent loop. Cuando termina, TAMBIÉN pusheá el turn final de texto del modelo a `contents` (así queda en la historia).
4. Pusheá el segundo mensaje del user: `"Now add 8 to that number."`
5. Corré el agent loop de nuevo sobre los mismos `contents`.
6. Retorná `{ firstAnswer, secondAnswer, totalTurns, toolsUsed }`.

## Cómo verificar

```bash
aidev verify 04-agent-memory
```

Los tests verifican:
- Al menos 4 llamadas a `generateContent` (2 preguntas × 2 turns cada una)
- Retorno tiene `{ firstAnswer, secondAnswer, totalTurns, toolsUsed }`
- `firstAnswer` contiene `42` (= 6 × 7)
- **`secondAnswer` contiene `50` (= 42 + 8)** — el check de memoria
- Ambas `multiply` y `add` aparecen en `toolsUsed`
- El `contents` del último `generateContent` incluye AMBOS mensajes de user (la historia se preservó)

## Concepto extra (opcional)

En producción, la memoria no es solo "append-forever". Estrategias:

- **Sliding window**: mantené los últimos N turns, tirá los más viejos.
- **Summarization**: cuando el contexto se alarga, reemplazá turns viejos por un resumen (lossy pero barato).
- **History indexado con vectores**: guardá cada turn en una vector DB; retrievá turns pasados relevantes por similarity semántica a la pregunta actual.

El track 02 de OpenAI del bootcamp cubre algunos de estos. Para Gemini, los mismos patrones aplican — solo swapeás al SDK de Gemini.

Una trampa sutil: cuando APENDEÁS el turn de texto del modelo a `contents`, asegurate de usar `role: "model"` y `parts: [{ text: ... }]`. Usar `role: "user"` para el output del modelo confunde el razonamiento del próximo turn.
