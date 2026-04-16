# 03 — Múltiples Herramientas

## Objetivo

Aprender a ofrecer múltiples herramientas en una sola llamada y a rutear la ejecución
según qué herramienta eligió Claude. Claude selecciona la herramienta más apropiada
para el prompt dado.

---

## Contexto

Cuando pasás un array de herramientas, Claude elige cuál usar según el prompt.
Tu código necesita inspeccionar `toolUseBlock.name` y despachar a la función correcta.

Este ejercicio presenta `CALCULATE_TOOL` junto a `GET_WEATHER_TOOL`:

```typescript
// Esquema de la herramienta calculate (enum de operaciones):
{
  name: "calculate",
  input_schema: {
    properties: {
      operation: { enum: ["add", "subtract", "multiply", "divide"] },
      a: { type: "number" },
      b: { type: "number" }
    }
  }
}
```

El uso de un `enum` en el schema le enseña a Claude los valores válidos para `operation`,
evitando strings arbitrarios y facilitando el despacho por `switch`.

---

## Tu tarea

1. Implementá `executeCalculate({ operation, a, b })` — retorna JSON `{ result: number }`.
   Lanzá un error en división por cero.
2. Implementá `executeTool(name, input)` — ruteá a `executeGetWeather` o `executeCalculate`
   según `name`. Lanzá error para nombres desconocidos.
3. Implementá `run()`:
   - Usá el prompt `"What is 2 multiplied by 2627?"` — fuerza el uso de `calculate`.
   - Pasá `tools: [GET_WEATHER_TOOL, CALCULATE_TOOL]`.
   - Loop de 2 turnos con `executeTool(toolUseBlock.name, toolUseBlock.input)`.
   - Retorná `response2`.

---

## Pistas

- El enum en el schema hace que Claude envíe exactamente `"multiply"`, `"add"`, etc.
- `executeCalculate` recibe números reales — no strings — porque el schema declara `"type": "number"`.
- El test verifica que `toolUseBlock.input.operation === "multiply"` y que la respuesta
  final contiene `5254` (2 × 2627).

---

## Criterios de éxito

- `executeCalculate({ operation: "multiply", a: 6, b: 7 })` retorna `'{"result":42}'` (sin API).
- `executeCalculate({ operation: "divide", a: 10, b: 0 })` lanza error (sin API).
- `calls.length === 2`.
- `calls[0].request.tools.length === 2`.
- La herramienta elegida en `calls[0]` es `"calculate"` con `operation === "multiply"`.
- La respuesta final contiene `5254` o `5,254`.
- Modelo es haiku.

---

## Recursos

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementación](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
