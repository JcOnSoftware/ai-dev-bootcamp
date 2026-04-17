# Exercise 01 — Declare your first tool

## Concepto

Hasta ahora cada response de Gemini fue texto puro (o JSON estructurado). **Function calling** cambia eso: vos describís una o más funciones, el modelo decide si la pregunta del user necesita llamar a alguna, y retorna el nombre de la función + args — NO la respuesta final todavía.

El contrato es:

1. **Vos** declarás qué funciones existen (`config.tools[0].functionDeclarations`).
2. **Gemini** decide si las llama. Si sí, `response.functionCalls[]` tiene `{ name, args }`.
3. **Vos** ejecutás la función y alimentás el resultado de vuelta en un turn siguiente (ejercicio 02).

Este patrón potencia workflows de agentes reales: "check inventory", "send email", "query database" — cualquier cosa que el modelo no debería inventar desde training data.

Una `FunctionDeclaration` usa el mismo enum `Type` que viste en el ejercicio 05 de Foundations. Las descriptions importan — el modelo las lee para decidir si invocar tu función.

## Docs & referencias

1. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — el lifecycle completo (declaración → call del modelo → ejecución → feedback)
2. [Schema de `FunctionDeclaration`](https://ai.google.dev/api/caching#FunctionDeclaration) — campos: `name`, `description`, `parameters`
3. [Referencia del tipo `Schema`](https://ai.google.dev/api/caching#Schema) — recap de `Type.OBJECT`, `Type.STRING`, campos required

## Tu tarea

1. Declará una función:
   - `name`: `"get_current_weather"`
   - `description`: una oración clara sobre qué retorna la función
   - `parameters`: `Type.OBJECT` con:
     - `properties.location`: `{ type: Type.STRING, description: "City and country, e.g. 'Tokyo, Japan'" }`
     - `required`: `["location"]`
2. Llamá a `ai.models.generateContent({ ... })` con:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"What's the weather in Tokyo right now?"`
   - `config.tools`: `[{ functionDeclarations: [yourDecl] }]`
   - `config.maxOutputTokens`: `256`
3. Leé `response.functionCalls[0]` (el getter de conveniencia del SDK que junta todas las `functionCall` parts a través de candidates).
4. Retorná `{ calledFunction: call.name, calledArgs: call.args }`.

## Cómo verificar

```bash
aidev verify 01-first-tool
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- Request `config.tools[0].functionDeclarations` tiene al menos una entry
- El `name` de la declaración contiene `weather` y los parameters incluyen una property `location`
- El retorno tiene `calledFunction: string` y `calledArgs: object`
- El modelo eligió llamar a la función weather (su nombre incluye `weather`)
- `calledArgs.location` es un string no vacío que menciona `tokyo`

## Concepto extra (opcional)

¿Por qué declarar una `description`? El modelo la usa junto con el nombre de la función para rutear requests. Con tres tools (`get_weather`, `send_email`, `book_flight`), el modelo lee cada description y elige el mejor fit. Descriptions débiles causan mal ruteo — "sends stuff" no es lo mismo que "Sends an email to the specified recipient with the given subject and body."

Los argumentos también pueden tener `description` en cada property. Usalos cuando el nombre no es self-explanatory (`{ priority: { ..., description: "'low' | 'normal' | 'high'" } }`).
