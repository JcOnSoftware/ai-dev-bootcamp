# 05 — Parallel Tools

## Objetivo

Manejar correctamente el caso en que Claude llama a la misma herramienta varias veces
en paralelo (en un solo turno), proveyendo todos los `tool_result` en un único mensaje
de vuelta.

---

## Contexto

Claude puede emitir múltiples bloques `tool_use` en una sola respuesta cuando el prompt
pide información de varios recursos simultáneamente. Por ejemplo, si preguntás el clima
en 3 ciudades, Claude puede emitir 3 bloques `tool_use` en `response1.content`.

Si respondés solo al primero e ignorás los demás, la API devuelve un error de validación.
**Todos** los `tool_use_id` del turno 1 deben tener su `tool_result` correspondiente en el
mensaje del turno 2.

```
call 1 response.content:
  [text?, tool_use{id:"A", location:"London"}, tool_use{id:"B", location:"Tokyo"}]

call 2 user message content:
  [tool_result{id:"A", ...}, tool_result{id:"B", ...}]
```

El comportamiento real es no determinista — Haiku puede decidir llamar la herramienta
1, 2, o más veces según el modelo y la versión. Los tests aceptan `>= 1` tool_use.

---

## Tu tarea

1. Implementá `executeGetWeather(input)` — retorna JSON con temperatura y descripción.
2. Implementá `run()`:
   - **Turno 1**: Llamá con un prompt que pida el clima en múltiples ciudades explícitamente.
     Usá `tool_choice: { type: "any" }` para forzar el uso de la herramienta.
   - **Recolectá TODOS** los bloques `tool_use` de `response1.content` con `.filter()`.
   - Para cada bloque `tool_use`, creá un `{ type: "tool_result", tool_use_id, content }`.
   - **Turno 2**: Enviá todos los `tool_result` en un único mensaje `user`.
3. Retorná `response2`.

---

## Pistas

- Usá `.filter(b => b.type === "tool_use")` — no `.find()` — para capturar todos.
- El `content` del mensaje `user` del turno 2 es un array de `tool_result` blocks.
- Si Claude llama la herramienta solo una vez, tu código debe funcionar igual.
- Los tests verifican que `toolResultBlocks.length === toolUseBlocks.length`.

---

## Criterios de éxito

- `calls.length === 2`.
- `calls[0].response.content.filter(b => b.type === "tool_use").length >= 1`.
- El último mensaje `user` en `calls[1]` contiene exactamente tantos `tool_result` como
  `tool_use` blocks emitió Claude en el turno 1.
- Todos los `tool_use_id` del turno 1 están presentes en los `tool_result` del turno 2.
- `calls[1].response.stop_reason === "end_turn"`.
- Modelo es haiku.

---

## Estrategia de prompt: cómo elicitar tool use paralelo en Haiku 4.5

**Observación empírica** (validada durante el desarrollo de este ejercicio): Haiku 4.5 **no paraleliza de forma confiable** sin una instrucción explícita en el prompt. Un prompt natural como:

> "What's the weather in Buenos Aires and Tokyo?"

muchas veces genera **una sola** `tool_use` block (con `location: "Buenos Aires"` primero, luego el loop se ejecuta dos veces secuencialmente en vez de paralelo). El modelo "entiende" la pregunta pero optimiza por parsimonia.

El prompt que **sí** elicita paralelismo de forma consistente:

```
"I need the weather in Buenos Aires AND Tokyo, both in celsius.
Please call the tool twice, once per city, in parallel."
```

Las palabras clave que movés la aguja:
- **"twice"** o **"two calls"** — cuenta explícita.
- **"in parallel"** — le dice al modelo que SÍ puede emitir múltiples `tool_use` blocks en un mismo turn.

### ¿Por qué los tests aceptan `>= 1` bloques?

A pesar de un prompt cuidadoso, Haiku puede elegir serializar. Los tests aceptan `>= 1` `tool_use` blocks para **no ser flake-prone por no-determinismo del modelo**. El concepto (tool loop que maneja N results) queda ejercitado igual, ya sea N=1 o N=2.

En producción real: siempre diseñá tu código asumiendo que el response puede tener 1, 2 o N `tool_use` blocks. Nunca codees asumiendo paralelismo obligatorio.

### `disable_parallel_tool_use` — el camino inverso

Para el caso opuesto (forzar serialización), podés setear `tool_choice: { type: "auto", disable_parallel_tool_use: true }`. Útil cuando tu sistema de ejecución de tools tiene efectos secundarios que se rompen si corren en paralelo (ej: escribir a la misma DB row).

---

## Recursos

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementación](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
