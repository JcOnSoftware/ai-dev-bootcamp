# 01 — Tool use básico

## Objetivo

Aprender a definir una herramienta (tool) y pedirle a Claude que la use, observando el
mecanismo fundamental: Claude responde con `stop_reason === "tool_use"` y un bloque
`tool_use` en el contenido — no con texto final.

---

## Contexto

Las herramientas (tools) son la forma en que Claude interactúa con el mundo externo.
En lugar de inventar datos, Claude declara que necesita invocar una función y te devuelve
exactamente qué parámetros usar.

El flujo de un solo turno es:

```
vos → messages.create(tools, user_message)
Claude → { stop_reason: "tool_use", content: [{ type: "tool_use", name, input }] }
```

En este ejercicio solo hacés **la primera mitad**: definís la herramienta y mandás el mensaje.
El procesamiento de la respuesta de la herramienta (el "loop") viene en el próximo ejercicio.

---

## Tu tarea

1. Definí la herramienta `get_weather` con el esquema JSON que ya está en `starter.ts`.
2. Creá un cliente de Anthropic y llamá a `messages.create` con:
   - model: `claude-haiku-4-5-20251001`
   - tools: `[GET_WEATHER_TOOL]`
   - un mensaje de usuario que pregunte por el clima de alguna ciudad
3. Retorná la respuesta directamente (sin procesar los tool results todavía).

La función `executeGetWeather` ya está exportada en el starter — usala cuando quieras
explorar, pero no es necesaria para que los tests pasen en este ejercicio.

---

## Pistas

- El `input_schema` sigue el estándar JSON Schema: `type`, `properties`, `required`.
- Cuando Claude decide usar una herramienta, `response.stop_reason === "tool_use"`.
- El bloque `tool_use` en `response.content` tiene: `type`, `id`, `name`, `input`.
- No necesitás `tool_choice` aquí — con `auto` (default) Claude decide solo.

---

## Criterios de éxito

Los tests verifican:

- `calls.length === 1` — exactamente una llamada a la API.
- `calls[0].request.tools` tiene exactamente 1 herramienta llamada `"get_weather"`.
- `calls[0].response.stop_reason === "tool_use"`.
- `response.content` contiene un bloque `{ type: "tool_use", name: "get_weather", input: { location: ... } }`.
- El modelo usado contiene `"haiku"`.

---

## Recursos

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementación](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
