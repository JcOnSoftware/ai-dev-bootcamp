# 03-multi-breakpoint — Múltiples breakpoints de caché

## Concepto

Claude soporta hasta **4 breakpoints de caché** por request. Cada `cache_control: { type: "ephemeral" }` que colocás le dice a la API: "cachá todo el prefijo hasta aquí". Los tres lugares donde podés colocar breakpoints son:

1. **Bloque de sistema** (`system[]`) — cachá el system prompt
2. **Última tool en el array** (`tools[]`) — cachá sistema + todas las tools hasta la marcada
3. **Bloque de contenido en mensajes previos** (`messages[].content[]`) — cachá el historial de conversación

Usar los tres en paralelo maximiza el ahorro en conversaciones multi-turn donde el contexto crece con cada vuelta.

**Límite duro**: nunca superés los 4 breakpoints. El 5° se ignora en silencio (Anthropic descarta el más antiguo). Siempre documentá el conteo en tu código.

## Docs y referencias

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Cache breakpoints y límites: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#cache-limitations-and-considerations
- Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use

## Tu tarea

1. Definí al menos 2 tools; añadí `cache_control: { type: "ephemeral" }` a la **última** tool del array (breakpoint 2).
2. Usá `LONG_SYSTEM_PROMPT` como bloque de sistema cacheado (breakpoint 1).
3. Hacé la **llamada 1** (warmup) — sin historial de assistant todavía.
4. Tomá el contenido de la respuesta 1 y añadile `cache_control` al **último bloque** de contenido del assistant (breakpoint 3).
5. Si la respuesta 1 incluye blocks `tool_use`, debés incluir los `tool_result` correspondientes en la vuelta 2 antes de continuar la conversación.
6. Hacé la **llamada 2** con el historial cacheado.
7. Retorná ambas respuestas.

## Cómo verificar

```bash
aidev verify 03-multi-breakpoint --solution
aidev verify 03-multi-breakpoint
aidev run 03-multi-breakpoint --solution --full
```

Los tests verifican:
- `result.calls` tiene 2 elementos.
- Call 1 tiene al menos un bloque de sistema con `cache_control.type === "ephemeral"`.
- Call 2 tiene un array `tools` donde la última tool tiene `cache_control`.
- El total de bloques `cache_control` en call 2 está entre 2 y 4 (nunca > 4).
- Call 2 tiene `cache_read_input_tokens > 0`.
- Ambas requests usan modelo Haiku.

## Concepto extra

**Orden de invalidación del caché**

El caché funciona como prefijos de un árbol. Si modificás un bloque anterior en la secuencia, todos los breakpoints posteriores se invalidan:

```
[system BP1] → [tools BP2] → [messages BP3]
     ↓               ↓              ↓
Cambiar BP1    invalida BP2    invalida BP3
Cambiar BP2    (BP1 intacto)   invalida BP3
Cambiar BP3    (BP1+BP2 intactos)
```

Por eso siempre colocás el contenido que cambia menos al principio (system), y el que cambia más al final (historial de mensajes). Esta regla aplica tanto a prompt caching de Anthropic como a los KV caches de la mayoría de los LLMs.
