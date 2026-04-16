# Exercise 04 — Evaluación batch con dataset

## Concepto

En producción, la evaluación no se hace caso por caso — se hace en **batch** sobre un dataset completo. Un dataset de evaluación es una colección de pares `(input, expected_output)` que representa los casos que tu sistema tiene que manejar correctamente.

La métrica clave es la **accuracy**: qué porcentaje de los casos del dataset el modelo responde correctamente. Si tenés 100 casos y el modelo falla 20, tu accuracy es 0.8. Cuando deployás una nueva versión, corrés el dataset otra vez y comparás. Si la accuracy baja, el cambio introdujo una regresión.

Esta es la forma en que los equipos de ML miden mejoras reales. No alcanza con "parece que funciona mejor" — necesitás números. Una accuracy de 0.85 vs 0.82 es una mejora medible del 3.6%, independientemente de la intuición.

Para este ejercicio, el dataset contiene preguntas factuales simples (capitales de países). En un sistema real, el dataset sería curado por expertos del dominio y tendría cientos o miles de casos. Lo importante es entender el patrón: iterar sobre el dataset, evaluar cada caso, calcular métricas agregadas.

## Docs & referencias

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del endpoint para las 5 llamadas del loop.
2. [Model IDs](https://platform.openai.com/docs/models) — lista de modelos disponibles.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — README del SDK, instalación y ejemplos.

## Tu tarea

Implementá la función `run()` en `starter.ts`:

1. Creá un cliente OpenAI con `new OpenAI()`.
2. Definí el dataset inline — un array de 5 objetos `{ prompt, expectedContains: string[] }`:
   - `{ prompt: "What is the capital of France?", expectedContains: ["Paris"] }`
   - `{ prompt: "What is the capital of Germany?", expectedContains: ["Berlin"] }`
   - `{ prompt: "What is the capital of Japan?", expectedContains: ["Tokyo"] }`
   - `{ prompt: "What is the capital of Australia?", expectedContains: ["Canberra"] }`
   - `{ prompt: "What is the capital of Brazil?", expectedContains: ["Brasilia", "Brasília"] }`
3. Iterá el dataset con `for...of`. Para cada entrada, llamá a la API:
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `100`
   - `messages`: `[{ role: "user", content: entry.prompt }]`
4. Extraé el output: `response.choices[0].message.content ?? ""`
5. Verificá si al menos uno de los `expectedContains` está incluido en el output (case-insensitive): `entry.expectedContains.some(e => output.toLowerCase().includes(e.toLowerCase()))`.
6. Calculá métricas agregadas:
   - `totalTests`: 5
   - `passed`: cantidad de resultados con `passed === true`
   - `failed`: cantidad de resultados con `passed === false`
   - `accuracy`: `passed / totalTests`
7. Retorná `{ totalTests, passed, failed, accuracy }`.

## Cómo verificar

```bash
aidev verify 04-dataset-testing
```

Los tests verifican que:

- Se hicieron exactamente **5 llamadas** a la API.
- `totalTests` es `5`.
- `passed + failed === 5`.
- `accuracy` es un número entre 0 y 1.
- Al menos 3 tests pasan (las preguntas factoriales son simples).
- La última llamada usa `model: "gpt-4.1-nano"`.

## Concepto extra (opcional)

¿Cómo construís un buen dataset de evaluación? Primero, recolectás casos reales de producción (logs de usuarios) y los anotas con la respuesta correcta. Después, agregás **edge cases**: casos límite que sospechás que el modelo puede fallar. Un buen dataset tiene distribución balanceada de casos fáciles, medios y difíciles. Esto se llama **golden dataset** o **eval set**.
