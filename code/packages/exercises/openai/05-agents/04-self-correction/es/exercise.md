# Exercise 04 — El agente detecta y maneja errores de herramientas

## Concepto

Las tools no siempre funcionan. En producción: las APIs fallan, los datos son inválidos, las operaciones no son posibles (dividir por cero, buscar algo que no existe, etc.). Un agente robusto no explota cuando una tool falla — le informa al modelo del error y el modelo decide qué hacer.

La clave es entender cómo fluye el error: **tu código ejecuta la tool, obtiene un error, y se lo devuelve al modelo como resultado de la tool**. El modelo ve el error en el historial y puede: (1) explicarle al usuario lo que pasó, (2) intentar un approach alternativo, o (3) pedir otra tool para resolver el problema diferente. Esto es **auto-corrección** — el modelo razona sobre sus propios errores.

Lo que NO debés hacer es `throw` desde el executor de tools. Si lanzás una excepción, el loop se rompe y el modelo nunca se entera de que la tool falló. Siempre retorná el error como un resultado estructurado: `{ error: "mensaje de error" }`.

```typescript
// MAL — la excepción rompe el loop, el modelo no se entera
if (b === 0) throw new Error("division by zero");

// BIEN — el error es un resultado estructurado que el modelo puede leer
if (b === 0) return { error: "Error: division by zero" };
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente OpenAI
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — manejo de errores en tool execution y best practices
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — estructura de mensajes `role: "tool"` con resultados de error

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y un array `messages` con: `{ role: "user", content: "Calculate 100/5 and then 100/0, handle any errors gracefully." }`.
3. Definí la tool `divide(a: number, b: number)`.
4. Implementá el agent loop.
5. Cuando ejecutés la tool:
   - Llamá a `fakeDivide(a, b)`.
   - Si `result.error` está definido, ponés `hadError = true`.
   - Siempre retornás el resultado al modelo (incluyendo los errores).
   - Agregás el resultado a un array `results`.
6. Retorná `{ results, hadError }`.

## Cómo verificar

```bash
aidev verify 04-self-correction
```

Los tests verifican:
- Se hacen al menos 2 llamadas a la API
- `hadError` es `true`
- `results` está definido como array
- La respuesta final menciona "error", "zero", "cannot", "undefined" o "division" (el modelo reconoció el error)
- La última llamada tiene `finish_reason: "stop"`

## Concepto extra (opcional)

Algunos agentes implementan **estrategias de retry automático**: si una tool falla, el executor la reintenta con parámetros ligeramente diferentes antes de devolver el error al modelo. Esto es útil para errores transitorios (timeouts de red, rate limits). Pero hay que tener cuidado con los **side effects**: si la tool creó un recurso parcialmente antes de fallar, el retry puede duplicarlo. El patrón idempotente — diseñar tools que sean seguras de reintentar — es fundamental en arquitecturas de agentes robustas.
