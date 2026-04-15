# 04 · Planificación multi-paso

## Concepto

Un agente que recibe una pregunta compleja puede intentar responderla con una sola búsqueda — o puede **planificar** y dividirla en sub-preguntas más simples. La diferencia está completamente en el `system` prompt.

El `system` prompt es el palanca de arquitectura más importante para los agentes: define cómo piensa el modelo antes de actuar.

Sin instrucción de planificación:
- Claude puede hacer 1 búsqueda genérica y sintetizar con lo que encuentra.

Con instrucción de planificación:
- Claude divide la pregunta en sub-preguntas.
- Busca cada una por separado.
- Sintetiza todas las respuestas al final.

El resultado es mucho más preciso y confiable.

## Objetivo

Implementar `runMultiStepAgent(query, maxIterations)` con un `system` prompt que instruya explícitamente a Claude a planificar sus pasos.

## Pasos

1. Definir un `system` prompt que contenga instrucciones como:
   - "Divide la pregunta en sub-preguntas antes de buscar."
   - "Busca cada sub-pregunta por separado."
   - "Sintetiza todos los hallazgos al final."
2. Implementar el agent loop igual que en ejercicio 01 — la diferencia es solo el `system` prompt.
3. Pasar `system` al `client.messages.create`.

## Concepto extra

El engineering del system prompt es ingeniería de verdad. Cambiar "responde la pregunta" por "planifica tus pasos antes de buscar" cambia fundamentalmente el comportamiento del agente. Medir el efecto (número de búsquedas, calidad de la respuesta) es parte del oficio.

## Tests

Los tests verifican:
- Al menos 2 llamadas a la API.
- El `system` prompt contiene una instrucción de planificación ("plan", "step", "break", "sub-question").
- Al menos 2 queries distintos de `search_docs` a lo largo de la ejecución.
- La respuesta final menciona el costo de cache write (25% más caro) y cache read (10% del costo base).

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/04-multi-step-plan
AIDEV_TARGET=solution bun test packages/exercises/05-agents/04-multi-step-plan
```

## Recursos

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
