# Exercise 01 — Evaluación de prompts con LLM-as-judge

## Concepto

Antes de mandar un prompt a producción, necesitás saber si produce salidas de buena calidad. El problema: ¿cómo medís "buena calidad" de forma automatizada? Una técnica muy usada es **LLM-as-judge**: usás un segundo modelo para evaluar la salida del primero.

La idea es simple pero poderosa. El primer LLM responde tu pregunta real. El segundo actúa como juez imparcial: lee la respuesta y la puntúa según criterios que vos definís (claridad, precisión, tono, etc.). Ese puntaje se puede guardar, graficar, y comparar entre versiones del prompt.

Esta es la base de los sistemas de evaluación en producción. Empresas como Anthropic, OpenAI y Google usan variantes de este patrón internamente. Cuando un equipo dice "mejoramos el modelo en un 8% en nuestro benchmark interno", están usando exactamente esto.

Lo importante es que el juez también es un LLM, así que sus salidas son no deterministas. Por eso conviene pedirle JSON estructurado: te da una puntuación numérica que podés comparar, no solo texto libre.

## Docs & referencias

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa del endpoint que vas a usar para ambas llamadas.
2. [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) — cómo forzar al modelo a devolver JSON válido usando `response_format: { type: "json_schema" }`.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — README del SDK, instalación y ejemplos básicos.

## Tu tarea

Implementá la función `run()` en `starter.ts` siguiendo estos pasos:

1. Creá un cliente OpenAI con `new OpenAI()`.
2. **Llamada 1 — el sujeto**: pedile al modelo que explique la recursión a un nene de 5 años.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `300`
   - Guardá el texto de la respuesta: `response.choices[0].message.content`
3. **Llamada 2 — el juez**: pedile al mismo modelo que evalúe la respuesta anterior.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `256`
   - System message: `"Rate the following explanation on a scale of 1-5 for clarity and simplicity. Respond with JSON: {\"score\": <number 1-5>, \"reasoning\": <string>}"`
   - User message: el texto de la llamada 1
   - Usá `response_format: { type: "json_schema" }` con un schema que tenga `score` (number) y `reasoning` (string), ambos requeridos, `strict: true`.
4. Parseá el JSON de la llamada 2 con `JSON.parse(...)`.
5. Retorná `{ output, score, reasoning }`.

## Cómo verificar

```bash
aidev verify 01-prompt-evaluation
```

Los tests verifican que:

- Se hicieron exactamente **2 llamadas** a la API.
- La segunda llamada usa `response_format` con `type: "json_schema"`.
- El retorno tiene `output` (string no vacío).
- El retorno tiene `score` (número entre 1 y 5 inclusive).
- El retorno tiene `reasoning` (string no vacío).

## Concepto extra (opcional)

¿Qué pasa si el juez tiene un sesgo? Por ejemplo, los LLMs tienden a dar puntajes altos. Una técnica para contrarrestar esto es **calibration**: corrés el juez sobre un conjunto de ejemplos con puntaje conocido y ajustás la escala. Otra alternativa es usar múltiples jueces y promediar, similar a un tribunal de árbitros. Esto se llama **ensemble judging**.
