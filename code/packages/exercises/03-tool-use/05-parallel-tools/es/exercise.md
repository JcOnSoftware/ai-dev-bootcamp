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

## Recursos

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementación](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
