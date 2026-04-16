# Exercise 01 — Context window limits and truncation

## Concepto

Los LLMs tienen un **límite de contexto** — un número máximo de tokens que pueden procesar en una sola llamada, combinando tanto el input (mensajes) como el output (respuesta). Cuando el modelo llega al límite de tokens de salida, simplemente se detiene a mitad de frase. No hay error — el campo `finish_reason` te dice qué pasó.

Los valores posibles de `finish_reason` son:
- `"stop"` — el modelo terminó naturalmente (lo más común)
- `"length"` — se cortó porque alcanzó `max_completion_tokens`
- `"content_filter"` — filtrado por seguridad
- `"tool_calls"` — el modelo quiere llamar una función

Con `max_completion_tokens: 50`, cualquier respuesta larga queda truncada. Podés usar esto para:
1. **Controlar costos**: limitá la respuesta máxima para no pagar tokens de más
2. **Detectar truncación**: si `finish_reason === "length"`, sabés que la respuesta está incompleta

```typescript
const finishReason = response.choices[0].finish_reason;
// → "length" si fue truncada, "stop" si terminó naturalmente
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — parámetros `max_completion_tokens` y `finish_reason`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y llamá a `client.chat.completions.create` con:
   - `model: "gpt-4.1-nano"`
   - `max_completion_tokens: 50` — intencionalmente pequeño para forzar truncación
   - Un mensaje de usuario: `"Write a detailed essay about the history of computing."`
3. Leé `response.choices[0].finish_reason`.
4. Calculá `wasTruncated = (finishReason === "length")`.
5. Retorná `{ response, finishReason, wasTruncated }`.

## Cómo verificar

```bash
aidev verify 01-context-window-limits
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- El request usa `gpt-4.1-nano`
- `max_completion_tokens` es `50`
- `finishReason` es `"length"`
- `wasTruncated` es `true`
- `completion_tokens` es menor o igual a `50`

## Concepto extra (opcional)

En aplicaciones reales, cuando detectás `finish_reason === "length"`, tenés algunas opciones:

1. **Reintentar con más tokens**: aumentá `max_completion_tokens` y pedí que continúe desde donde dejó
2. **Pedir un resumen más corto**: reformulá el prompt para pedir una respuesta más concisa
3. **Procesar en partes**: dividí la tarea en fragmentos más pequeños

También podés usar `max_completion_tokens` como una **guardia de seguridad** en producción — incluso si el prompt pide una respuesta corta, siempre poné un límite alto razonable para evitar respuestas runaway y costos inesperados.
