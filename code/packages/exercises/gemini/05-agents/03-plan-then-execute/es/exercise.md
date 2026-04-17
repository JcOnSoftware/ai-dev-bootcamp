# Exercise 03 — Plan then execute — force a visible plan before acting

## Concepto

Uno de los patrones de agente más efectivos: **hacer visible el razonamiento antes de la acción**. Cuando el modelo escribe su plan primero, obtenés tres beneficios a la vez:

1. **Debuggability**: cuando el agente hace algo mal, podés leer el plan y ver dónde su comprensión divergió de la tarea.
2. **Auditability**: el plan se vuelve un log natural que le podés mostrar al user ("primero voy a multiplicar, después sumar el resultado a 17").
3. **Calidad**: los modelos razonan mejor cuando son forzados a externalizar el plan — menos misteps silenciosos.

Gemini (como la mayoría de LLMs) puede emitir **contenido mixto** en un solo turn: text parts Y functionCall parts. Controlás este comportamiento con un **system instruction**:

```ts
config.systemInstruction = "Always start your response with a one-sentence plan ..."
```

Los system instructions persisten a través de turns, así que cada response del modelo sigue la regla. Todavía vas a recibir texto en el turn FINAL (cuando no quedan más tool calls).

## Docs & referencias

1. [System instructions](https://ai.google.dev/gemini-api/docs/text-generation#system-instructions) — cuándo y cómo usarlos
2. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — responses mixtos text + tool-call
3. [Referencia de `Part`](https://ai.google.dev/api/caching#Part) — parts text, functionCall, functionResponse

## Tu tarea

1. Reusá el agent loop de los ejercicios 01/02. Incluí ambas `multiply` y `add`.
2. Agregá `config.systemInstruction` en CADA turn:
   ```
   Always start your response with a one-sentence plan describing which tools you will call and in what order. Then immediately call the tools. Do not execute tools before describing the plan.
   ```
3. Capturá `response.text` SOLO en el primer turn — ese es el plan.
4. User prompt: `"Compute (8 * 9) + 17 using the tools provided."`
5. Corré el loop, juntá tool calls, retorná:
   ```ts
   { firstTurnText, toolCalls, answer }
   ```

## Cómo verificar

```bash
aidev verify 03-plan-then-execute
```

Los tests verifican:
- Cada call capturada tiene un `systemInstruction` no trivial en su config
- `firstTurnText` no vacío (el plan fue visible)
- El plan menciona AMBAS `multiply` y `add` por nombre
- Las tools se llamaron en el orden correcto (`multiply` antes que `add`)
- La respuesta final contiene `89` (= 8 × 9 + 17)

## Concepto extra (opcional)

Variantes de este patrón tienen nombres más rimbombantes: **ReAct** (reason + act intercalados por step), **chain-of-thought con tools**, **plan-and-execute**. Son todas variaciones de la misma idea core: externalizar razonamiento.

En workflows high-stakes podés ir más lejos — guardá el PLAN como un artifact separado en tu DB ANTES de que empiece la ejecución. Si el plan se ve mal, un humano puede vetar antes de que pase cualquier side-effect (email mandado, row de DB creado, plata movida). Para workflows no críticos, loggearlo a nivel INFO alcanza.

El riesgo del planning visible: outputs más largos cuestan más tokens y latencia. Balance es clave — forzá un plan para tareas con riesgo o ambigüedad, dejá que el modelo salte directo a la acción para lookups mecánicos.
