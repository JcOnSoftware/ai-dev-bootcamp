# 05-caching-with-tools — Caché con tool use

## Concepto

El prompt caching funciona especialmente bien con tool use porque la combinación de `system prompt + tool definitions` puede ser larga (miles de tokens) y se repite en cada vuelta de la conversación. Al cachear ambos juntos, cada llamada posterior a la primera paga solo el 0.1× de lectura para todo ese contexto.

El patrón es:
- **Breakpoint 1**: system block (LONG_SYSTEM_PROMPT)
- **Breakpoint 2**: última tool en el array (cachea sistema + tools como prefijo único)

En una conversación multi-turn con tools, el flujo típico es:
1. Turn 1: user → Claude usa tool → `tool_use` block en la respuesta
2. Turn 2: user envía `tool_result` + siguiente mensaje → Claude responde con cache_read > 0

El historial de mensajes crece con cada vuelta, pero el sistema y las tools siguen siendo el mismo prefijo cacheado.

## Docs y referencias

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use
- Multi-turn con tool results: https://docs.claude.com/en/docs/build-with-claude/tool-use#handling-tool-use-and-tool-results

## Tu tarea

1. Definí al menos 1 tool. Añadí `cache_control: { type: "ephemeral" }` a la **última** tool del array (breakpoint 2).
2. Usá `LONG_SYSTEM_PROMPT` como bloque de sistema cacheado (breakpoint 1).
3. **Turn 1**: mandá un mensaje de usuario que invite a usar el tool. Claude responde con un bloque `tool_use`.
4. Extraé el tool use block de la respuesta 1.
5. **Turn 2**: mandá `tool_result` (con el `tool_use_id` del paso anterior) + un mensaje de seguimiento. Claude debería leer del caché.
6. Retorná ambas respuestas.

Tip: si querés forzar que Claude use el tool en el turn 1, usá `tool_choice: { type: "any" }`.

## Cómo verificar

```bash
aidev verify 05-caching-with-tools --solution
aidev verify 05-caching-with-tools
aidev run 05-caching-with-tools --solution --full
```

Los tests verifican:
- `result.calls` tiene 2 elementos.
- Call 1 tiene system con `cache_control.type === "ephemeral"`.
- Call 1 tiene tools con la última tool con `cache_control`.
- Call 1 response contiene al menos un bloque `tool_use`.
- Call 2 tiene tools con `cache_control` en la última tool.
- Call 2 tiene `cache_read_input_tokens > 0`.
- Ambas requests usan modelo Haiku.

## Concepto extra

**¿Por qué cachear las tool definitions?**

Las tools se expresan como JSON schemas que pueden ocupar varios cientos de tokens. En un agente con 10-15 tools, las definiciones solas pueden ser 2,000-3,000 tokens. Si corres 1,000 conversaciones por día, cachear las tools puede representar un ahorro del 80-90% en los tokens de entrada de cada vuelta.

El patrón de caching con tools es uno de los más impactantes en producción porque:
1. Las tool definitions casi nunca cambian (a diferencia del historial de mensajes)
2. Se repiten en CADA vuelta de la conversación
3. Se acumulan con el system prompt para formar un prefijo largo y estable

Esto hace que la combinación system + tools sea el candidato perfecto para un breakpoint de caché agresivo.
