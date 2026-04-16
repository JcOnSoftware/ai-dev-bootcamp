# Exercise 02 — Regression testing para consistencia de prompts

## Concepto

Cuando modificás un prompt en producción, ¿cómo sabés que no rompiste nada? La respuesta es tener una suite de **regression tests**: un conjunto de entradas con patrones de salida esperados que corrés antes y después de cada cambio.

La idea viene del testing de software tradicional. Un test de regresión verifica que algo que funcionaba antes siga funcionando después de una modificación. En el mundo de los LLMs, no podés comparar texto exacto (la salida es no determinista), pero sí podés verificar **patrones**: si le preguntás la capital de Francia, la respuesta tiene que contener "Paris".

Este patrón es especialmente valioso cuando actualizás el modelo (por ejemplo, de `gpt-4.1-nano` a una versión más nueva) o cuando ajustás el system prompt. Corrés los tests antes y después, y si el `passRate` baja significativamente, sabés que el cambio rompió algo.

La clave está en definir buenos `expectedPattern`. Son demasiado estrictos si esperan texto exacto; son demasiado laxos si aceptan cualquier cosa. El objetivo es capturar la semántica de la respuesta correcta con una regex que tenga pocos falsos negativos.

## Docs & referencias

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del endpoint para las 3 llamadas en el loop.
2. [Model IDs](https://platform.openai.com/docs/models) — lista de modelos disponibles y sus capacidades.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — README del SDK, instalación y ejemplos.

## Tu tarea

Implementá la función `run()` en `starter.ts`:

1. Creá un cliente OpenAI con `new OpenAI()`.
2. Definí un array de 3 test cases con `{ input: string, expectedPattern: RegExp }`:
   - `{ input: "What is the capital of France?", expectedPattern: /paris/i }`
   - `{ input: "What is 2 + 2?", expectedPattern: /4|four/i }`
   - `{ input: "Name one primary color.", expectedPattern: /red|blue|yellow/i }`
3. Iterá sobre los test cases con un `for...of`. Para cada uno, llamá a `client.chat.completions.create`:
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `100`
   - `messages`: `[{ role: "user", content: testCase.input }]`
4. Extraé el texto: `response.choices[0].message.content ?? ""`
5. Verificá si el texto matchea el patrón: `testCase.expectedPattern.test(output)` → `passed` (boolean).
6. Acumulá en `results`: `[{ input, output, passed }]`.
7. Calculá `passRate` como `(cantidad de passed) / results.length`.
8. Retorná `{ results, passRate }`.

## Cómo verificar

```bash
aidev verify 02-regression-testing
```

Los tests verifican que:

- Se hicieron exactamente **3 llamadas** a la API (una por test case).
- El retorno tiene `results` (array de 3 elementos).
- Cada resultado tiene `input` (string), `output` (string), `passed` (boolean).
- `passRate` es un número entre 0 y 1.
- La última llamada usa `model: "gpt-4.1-nano"`.

## Concepto extra (opcional)

En producción, los test cases no se hardcodean — se cargan desde un archivo JSON o una base de datos. Esto permite que el equipo de QA actualice los tests sin tocar el código. También podés versionar el dataset junto con el prompt para tener un historial de regresiones.
