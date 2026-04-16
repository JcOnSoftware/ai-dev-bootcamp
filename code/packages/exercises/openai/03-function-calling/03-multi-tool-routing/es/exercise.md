# Exercise 03 — Múltiples tools y routing automático

## Concepto

En el ejercicio anterior definiste una sola tool. En aplicaciones reales vas a tener docenas. El modelo actúa como un **router**: lee las descripciones de todas las tools disponibles y decide cuál (o cuáles) llamar según lo que el usuario preguntó. No hace falta que le digas cuál usar — el modelo lo infiere solo.

La clave está en las `description` de cada tool y de cada parámetro. Son el "contrato" entre vos y el modelo. Si la descripción es vaga o ambigua, el modelo puede elegir mal. Si es precisa, el modelo routea perfectamente incluso con decenas de tools.

```typescript
// Con 3 tools definidas y el mensaje "What time is it in Tokyo and what's 15 * 7?"
// el modelo puede responder con 2 tool_calls en una sola respuesta:
// → get_time({ timezone: "Asia/Tokyo" })
// → calculate({ expression: "15 * 7" })
```

Eso se llama **parallel tool calling** y es el comportamiento por defecto en OpenAI. Lo profundizás en el ejercicio 04.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — guía oficial con routing y múltiples tools
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del parámetro `tools`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI.
3. Definí **3 tools**:
   - `get_weather(location: string)` — clima actual para una ubicación
   - `get_time(timezone: string)` — hora actual en una zona horaria (IANA)
   - `calculate(expression: string)` — evalúa una expresión matemática
   Cada parámetro debe tener un `description` claro.
4. Empezá los mensajes con: `"What time is it in Tokyo and what's 15 * 7?"`
5. Hacé la **primera llamada** con `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`.
6. Para cada `tool_call` en la respuesta, despachá a la función fake correspondiente y agregá el resultado como mensaje `role: "tool"`.
7. Hacé la **segunda llamada** con los mensajes actualizados.
8. Retorná la respuesta final.

## Cómo verificar

```bash
aidev verify 03-multi-tool-routing
```

Los tests verifican:
- Se hacen al menos 2 llamadas a la API
- La primera llamada tiene al menos 3 tools definidas
- La primera llamada responde con `finish_reason: "tool_calls"`
- La primera respuesta tiene al menos 2 tool_calls (el modelo llama varias)
- La segunda llamada tiene al menos 1 mensaje `role: "tool"`
- La respuesta final tiene texto y `finish_reason: "stop"`

## Concepto extra (opcional)

El routing automático tiene límites. Si tenés 50 tools con nombres y descripciones similares, el modelo puede confundirse o elegir mal. Algunas estrategias para escalar: (1) categorizar tools y pre-filtrar antes de mandar al modelo, (2) usar embeddings para recuperar solo las tools relevantes para la query (RAG de tools), (3) dividir en sub-agentes especializados. Todo esto es arquitectura de agentes — lo ves en el track avanzado.
