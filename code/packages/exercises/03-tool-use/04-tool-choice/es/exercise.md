# 04 — Tool Choice

## Objetivo

Entender cómo controlar si Claude usa herramientas y cuáles, mediante el parámetro
`tool_choice`. Observar las cuatro opciones disponibles y cuándo usar cada una.

---

## Contexto

Por defecto, Claude elige libremente si usa una herramienta (`tool_choice: auto`).
Pero podés forzar su comportamiento con cuatro modos:

| Valor | Comportamiento |
|-------|----------------|
| `{ type: "auto" }` | Claude decide (default). Puede usar herramienta o responder en texto. |
| `{ type: "any" }` | Claude DEBE usar al menos una herramienta. |
| `{ type: "tool", name: "X" }` | Claude DEBE usar exactamente la herramienta `X`. |
| `{ type: "none" }` | Claude NO PUEDE usar ninguna herramienta — responde en texto. |

Este ejercicio hace 4 llamadas secuenciales con el mismo prompt pero diferente
`tool_choice`, para que puedas ver el comportamiento de cada modo lado a lado.

---

## Tu tarea

Implementá `run()` que haga 4 llamadas **secuenciales** (no en paralelo) con el
mismo prompt `"What is 12 times 15?"` y las dos herramientas, variando `tool_choice`:

1. Sin `tool_choice` (o `{ type: "auto" }`) → resultado en `auto`
2. `{ type: "any" }` → resultado en `any`
3. `{ type: "tool", name: "calculate" }` → resultado en `named`
4. `{ type: "none" }` → resultado en `none`

Retorná `{ auto, any, named, none }`.

Importante: hacé las llamadas de forma **secuencial** (no `Promise.all`) para que
el harness las capture en orden correcto.

---

## Pistas

- `tool_choice` se pasa al mismo nivel que `tools` en `messages.create`.
- Con `type: "none"`, `response.content` no tendrá bloques `tool_use`.
- Con `type: "tool"`, `response.stop_reason === "tool_use"` garantizado.
- El tipo de retorno puede ser `Promise<{ auto: Message, any: Message, named: Message, none: Message }>`.

---

## Criterios de éxito

- `calls.length === 4`.
- `calls[0].request.tool_choice` es `undefined` o `{ type: "auto" }`.
- `calls[1].request.tool_choice` es `{ type: "any" }`.
- `calls[2].request.tool_choice` es `{ type: "tool", name: "calculate" }`.
- `calls[2].response.content` contiene un bloque `tool_use` con `name === "calculate"`.
- `calls[3].request.tool_choice` es `{ type: "none" }`.
- `calls[3].response.content` NO contiene ningún bloque `tool_use`.
- Modelo es haiku.

---

## Por qué estos tests assertan sobre el request

Los tests de este ejercicio **no** assertan sobre `response.stop_reason`. En cambio, chequean:

1. **`calls[i].request.tool_choice` (la forma enviada al API)** — así validamos que tu código pasó la configuración correcta, independiente de cómo responda el modelo. Es un chequeo de **corrección de código**, no de **comportamiento del modelo**.
2. **Ausencia de bloques `tool_use` en `response.content` para el caso `none`** — en vez de assertar `stop_reason === "end_turn"`.

### ¿Por qué no usar `stop_reason`?

`stop_reason` bajo `tool_choice: none` **debería** ser `"end_turn"`, pero en la práctica el modelo a veces responde con `"stop_sequence"`, `"max_tokens"`, o incluso `"tool_use"` por glitches transitorios. Assertear sobre ese campo es **flake-prone** — los tests romperían en días con alta carga del modelo sin que el código del learner tenga bugs.

En cambio, **"no hay bloques `tool_use` en el response"** es el criterio semántico real de `tool_choice: none`, y se puede verificar de forma robusta mirando `response.content.filter(b => b.type === "tool_use").length === 0`.

> **Regla general para tests de API de LLMs**: assertá sobre lo que TU código hace (el request shape) o sobre propiedades estructurales del response (presencia/ausencia de tipos de bloques), NUNCA sobre campos de metadata no-determinísticos como `stop_reason`.

---

## Recursos

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementación](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
