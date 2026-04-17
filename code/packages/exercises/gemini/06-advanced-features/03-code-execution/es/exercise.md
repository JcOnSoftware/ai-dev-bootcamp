# Exercise 03 — Let the model run Python with code execution

## Concepto

Los LLMs son famosamente malos para aritmética. También son malos para sortear, deduplicar y cualquier cosa que se beneficie de correr un programa real. La tool **`codeExecution`** de Gemini esquiva el problema: el modelo escribe Python, Google lo corre en un sandbox, retorna el output, y el modelo incorpora el resultado en su respuesta.

La habilitás igual que `googleSearch`:

```ts
config.tools = [{ codeExecution: {} }]
```

El shape del response es más rico — `candidates[0].content.parts` ahora puede tener TRES tipos distintos de parts:

```ts
{ executableCode: { language: "PYTHON", code: "..." } }
{ codeExecutionResult: { outcome: "OUTCOME_OK", output: "..." } }
{ text: "... wrap-up en lenguaje natural ..." }
```

Tu código recorre el array de parts y los separa. Típicamente recibís UNO `executableCode`, UNO `codeExecutionResult`, y una o más parts `text` (antes/después).

## Docs & referencias

1. [Guía de code execution](https://ai.google.dev/gemini-api/docs/code-execution) — cuándo/por qué ayuda, límites del sandbox
2. [Built-in tools](https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools) — otros built-ins
3. [Shape de Part](https://ai.google.dev/api/caching#Part) — text / executableCode / codeExecutionResult / functionCall

## Tu tarea

1. Llamá `generateContent` con:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `"Compute 17 * 23 and the sum of the first 100 integers. Show the Python you ran."`
   - `config.tools`: `[{ codeExecution: {} }]`
   - `config.maxOutputTokens`: `600`
2. Recorré `response.candidates[0].content.parts`. Para cada part:
   - Si `executableCode.code` es un string, pusheá a `codes[]`.
   - Si `codeExecutionResult.output` es un string, pusheá a `outputs[]`.
   - Si `text` es un string, pusheá a `texts[]`.
3. Joineá cada array (`"\n\n"` para code, `"\n"` para los otros).
4. Retorná `{ generatedCode, sandboxOutput, summary }`.

## Cómo verificar

```bash
aidev verify 03-code-execution
```

Los tests verifican:
- Request `config.tools` incluye `{ codeExecution: {} }`
- Retorno tiene tres campos string
- `generatedCode` contiene markers de Python (`print`, `sum`, `range`, `import`, `def`, `=`)
- **`sandboxOutput` contiene `391`** (= 17 × 23)
- **`sandboxOutput` contiene `5050`** (= suma 1..100)
- `summary` no vacío

## Concepto extra (opcional)

El sandbox tiene estado dentro de una única generación pero está aislado de tu filesystem y red. Viene pre-cargado con libs comunes (numpy, pandas, matplotlib) pero sin acceso a APIs. Usalo para:

- Aritmética y estadística
- Manipulación de strings/data
- Verificación rápida del propio razonamiento del modelo
- Generación de charts (retorna PNGs base64 en parts `inlineData` que podés renderear en UIs)

`codeExecutionResult.outcome` te dice si la ejecución fue OK. Valores posibles: `OUTCOME_OK`, `OUTCOME_FAILED`, `OUTCOME_DEADLINE_EXCEEDED`. En producción, loggeá outcomes non-OK — muchas veces indican que el modelo escribió código que pegó un resource limit o importó una lib no disponible en el sandbox.

Como `googleSearch`, `codeExecution` se factura aparte de la generación. Ver la página de pricing.
