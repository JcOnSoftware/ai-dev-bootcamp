# Exploration: add-tool-use-track

**Change**: `add-tool-use-track`
**Date**: 2026-04-14
**Phase**: explore

---

## Summary

Track `03-tool-use` enseña a devs senior cómo integrar function calling de Claude end-to-end: desde definir un tool schema hasta ejecutar loops multi-turn y llamadas paralelas. Dominio: `get_weather` + `calculate` (ejemplos canónicos de la docs, cero fricción cognitiva). Cinco ejercicios progresivos, todos en Haiku 4.5, bilingual es+en.

---

## API Research Findings

Fuente principal: `https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/` (define-tools, handle-tool-calls, parallel-tool-use, overview)

### Request shape

```json
{
  "tools": [{
    "name": "get_weather",           // required — regex ^[a-zA-Z0-9_-]{1,64}$
    "description": "...",            // required — impacta fuertemente la selección del tool
    "input_schema": {                // required — JSON Schema object
      "type": "object",
      "properties": { "location": { "type": "string" } },
      "required": ["location"]
    }
  }]
}
```

- `input_schema.type` DEBE ser `"object"`. `properties` y `required` son los campos clave.
- Campo opcional `strict: true` para garantizar schema conformance (no usar en bootcamp — YAGNI).
- Campo opcional `input_examples` (array de objetos válidos según schema) — útil para tools complejos.
- No se requieren beta headers para client tools. Server tools (web_search) sí los requieren, pero este track no los usa.

### Response shape — stop_reason: "tool_use"

```json
{
  "stop_reason": "tool_use",
  "content": [
    { "type": "text", "text": "I'll check the weather..." },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": { "location": "San Francisco, CA" }
    }
  ]
}
```

- Puede haber un bloque `text` antes del `tool_use` (Claude explica qué va a hacer).
- `id` es un string único por bloque — se usa para correlacionar `tool_result`.

### Feedback shape — tool_result

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
      "content": "15 degrees"
    }
  ]
}
```

- CRÍTICO: `tool_result` blocks deben ir PRIMERO en el content array del user message. Texto después, no antes.
- `is_error: true` opcional para señalar errores de ejecución.

### tool_choice options

| Valor | Comportamiento |
|---|---|
| `{ "type": "auto" }` | Default. Claude decide si usa tool o responde directo. |
| `{ "type": "any" }` | Claude DEBE usar alguno de los tools provistos. |
| `{ "type": "tool", "name": "get_weather" }` | Claude DEBE usar exactamente ese tool. |
| `{ "type": "none" }` | Claude no puede usar ningún tool. Default cuando no hay tools. |

- Con `any` o `tool`: la API prefilllea el assistant message para forzar el tool_use. Claude no emite texto natural antes del bloque.
- No se requieren beta headers para ninguna opción de `tool_choice`.

### Parallel tool use

- **Nativo por defecto** — Claude 4+ lo hace automáticamente cuando una query requiere múltiples tools independientes.
- Flag `disable_parallel_tool_use: true` en `tool_choice` para limitar: con `auto` → máximo 1 tool; con `any`/`tool` → exactamente 1.
- Para enviar múltiples resultados: todos los `tool_result` blocks en UN SOLO user message. Mensajes separados por resultado rompen el patrón paralelo.
- Claude Haiku 4.5: soportado completamente. Tabla de pricing de docs confirma `Claude Haiku 4.5` con tool use system prompt de 346 tokens (`auto`/`none`) y 313 tokens (`any`/`tool`).

### Token overhead por tool use

- System prompt automático que agrega Claude: ~346 tokens (Haiku 4.5, `auto`/`none`).
- Tokens del tool definition (name + description + schema): ~50-150 tokens por tool.
- `tool_use` + `tool_result` blocks en el historial: ~30-80 tokens por round-trip.

### Max tools per request

- Documentación no especifica un hard limit numérico explícito para user-defined tools. Límite práctico: contexto disponible y razonabilidad del design. Para este track: máximo 2 tools en cualquier ejercicio — sin riesgo.

---

## Harness Compatibility Check

**Resultado: sin gaps. No se requieren cambios al harness.**

Análisis de `code/packages/runner/src/harness.ts`:

1. **`tool_use` blocks en response.content**: el harness captura `response` completa via `isMessage()` que verifica `Array.isArray(value.content)`. Los bloques `tool_use` dentro de `content` pasan tal cual — no hay filtro por tipo de bloque.

2. **Back-to-back `messages.create` calls (tool loop)**: cada llamada a `messages.create` es interceptada independientemente por `patchedCreate`. Cada una produce su propio entry en `calls[]`. Tests pueden hacer `calls[0]` (primera call) y `calls[1]` (segunda call con tool_result).

3. **`calls` array indexado**: `lastCall` = última llamada. Para el tool loop, tests pueden assert en `calls.length === 2`, `calls[0].response.stop_reason === "tool_use"`, `calls[1].response.stop_reason === "end_turn"`.

4. **Ningún path de stream**: tool use exercises usan `messages.create` (no streaming) — el patch de `stream` no aplica.

---

## Cost.ts Compatibility Check

**Resultado: compatible. No se requieren cambios.**

`code/packages/cli/src/cost.ts`:
- `estimateCost(model, usage)` usa `usage.input_tokens` (regular) + cache fields opcionales.
- Tool definitions se cuentan como tokens de input regulares por la API — el SDK los reporta en `usage.input_tokens` directamente. La función ya los maneja correctamente.
- Precios Haiku: `input: 1.0, output: 5.0` (USD/M tokens) — correcto para Haiku 4.5.

---

## Fixture Needs

**Resultado: no se necesita directorio `fixtures/`.**

- Tool schemas son pequeños (< 150 tokens) — se inline en cada ejercicio directamente.
- No hay prompts largos tipo system prompt de caching que justifiquen fixtures compartidos.
- Pattern: cada `solution.ts` define sus tools inline como constantes locales al archivo.
- Contraste con `02-caching/fixtures/` que tiene un corpus de 3000+ palabras — aquí no aplica.

---

## Proposed 5 Exercises

### `01-basic-tool`
- **Concept**: Define un tool schema (`get_weather`), hacer una sola `messages.create`, observar `stop_reason: "tool_use"` y el bloque `tool_use` en la respuesta.
- **Estimated minutes**: 20
- **Cost hint**: ~$0.0008/run (1 Haiku call, ~400 input tokens con tool def + 50 output)

### `02-tool-loop`
- **Concept**: Extender 01 con ejecución real: parsear el `tool_use` block, ejecutar la función localmente, enviar `tool_result` en segundo turn, recibir respuesta final `end_turn`.
- **Estimated minutes**: 25
- **Cost hint**: ~$0.0015/run (2 Haiku calls, ~600 + ~400 input tokens)

### `03-multiple-tools`
- **Concept**: Definir `get_weather` + `calculate` como tools. Claude elige cuál llamar según el prompt (router pattern). Observar que selección depende de la query y descriptions.
- **Estimated minutes**: 20
- **Cost hint**: ~$0.0015/run (2 calls para loop completo, 2 tools en schema)

### `04-tool-choice`
- **Concept**: Explorar las 4 opciones de `tool_choice`: `auto`, `any`, `{ type: "tool", name }`, `none`. Observar cómo cambia `stop_reason` y si hay texto antes del `tool_use` block.
- **Estimated minutes**: 25
- **Cost hint**: ~$0.0020/run (4 calls, una por mode)

### `05-parallel-tools`
- **Concept**: Query que requiere clima en 2 ciudades simultáneamente. Observar múltiples `tool_use` blocks en una sola respuesta. Ejecutar ambos, enviar ambos `tool_result` en un solo user message.
- **Estimated minutes**: 30
- **Cost hint**: ~$0.0020/run (2 Haiku calls: 1 con 2 tool_use blocks + 1 final)

---

## Cost Estimate

| Exercise | Runs típicos del learner | Costo/run | Subtotal |
|---|---|---|---|
| 01-basic-tool | 5 | ~$0.0008 | ~$0.004 |
| 02-tool-loop | 5 | ~$0.0015 | ~$0.008 |
| 03-multiple-tools | 5 | ~$0.0015 | ~$0.008 |
| 04-tool-choice | 5 | ~$0.0020 | ~$0.010 |
| 05-parallel-tools | 5 | ~$0.0020 | ~$0.010 |
| **Total track** | | | **~$0.040** |

Bien por debajo del target de $0.05 para el track. El acumulado del bootcamp sigue siendo manejable.

*Nota: token overhead del system prompt automático de tool use (~346 tokens por call) está incluido en las estimaciones.*

---

## Open Questions

1. **Modelo final**: ¿Confirmamos `claude-haiku-4-5` como model ID en solution.ts? La tabla de docs usa ese nombre pero conviene verificar contra `models/overview` antes de hardcodearlo en ejercicios.

2. **`calculate` tool design**: ¿El tool debe aceptar una expresión string (`"2 + 2"`) o campos separados (`operand_a`, `operator`, `operand_b`)? La versión con campos separados es más idiomática para JSON Schema y evita problemas de evaluación de expresiones.

3. **Ejercicio 04 scope**: ¿El ejercicio muestra las 4 opciones en 4 llamadas separadas dentro de una sola función `run()`, o cada opción es un ejercicio independiente? La propuesta actual es una función que hace 4 calls — confirmar que el learner no va a gastar más de lo esperado.

4. **`disable_parallel_tool_use`**: ¿Lo incluimos en 05 como concepto adicional (mostrar cómo deshabilitar) o lo dejamos out-of-scope para no complicar el ejercicio principal?

---

*skill_resolution: injected*
