# Exercise 05 — Error handling: retry con exponential backoff

## Concepto

En desarrollo local las llamadas a Claude andan siempre. En producción **fallan seguido**, y si no manejás los errores, tu app es frágil. Los modos de falla típicos:

| Status | Error (SDK class)           | ¿Retryable? | Qué hacer |
|--------|-----------------------------|-------------|-----------|
| 400    | `BadRequestError`           | No          | Tu request está mal formado — arreglá el código. |
| 401    | `AuthenticationError`       | No          | API key inválida — arreglá el secret. |
| 403    | `PermissionDeniedError`     | No          | Tu org no tiene permiso para ese modelo. |
| 404    | `NotFoundError`             | No          | Model ID incorrecto. |
| **429**| **`RateLimitError`**        | **SÍ**      | Superaste el rate limit — esperá y reintentá. |
| 500-599| `InternalServerError`       | SÍ          | Problema del lado de Anthropic — reintentá. |
| —      | `APIConnectionError`        | SÍ          | Red rota (DNS, timeout, socket) — reintentá. |
| —      | `APIConnectionTimeoutError` | SÍ          | Request se pasó del timeout — reintentá. |

**La regla**: retryable = el error puede resolverse solo si esperás un rato. Fatal = tu código está roto, reintentar no cambia nada.

**Exponential backoff** — el patrón estándar para reintentar:

```
attempt 0 → error 429 → wait 500ms  → retry
attempt 1 → error 429 → wait 1000ms → retry
attempt 2 → error 429 → wait 2000ms → retry
attempt 3 → error 429 → throw (te diste por vencido)
```

Cada reintento duplica el delay (`baseDelayMs * 2^attempt`). La razón: si el servidor está sobrecargado, esperar MÁS le da más tiempo a recuperarse. Si todos tus clientes reintentan INMEDIATAMENTE después de un 429, empeorás el problema — eso se llama *thundering herd*.

**Jitter** (opcional, bonus) — agregar aleatoriedad al delay para que múltiples clientes no reintenten sincronizados. Implementado como flag opcional en la solución (ver "Concepto extra" al final).

## Docs & references

1. **SDK README — Error handling section** — lista oficial de clases de error y cómo se tiran:
   → https://github.com/anthropics/anthropic-sdk-typescript#handling-errors
2. **Messages API reference — errors** — status codes y mensajes:
   → https://docs.claude.com/en/api/messages
3. **Rate limits** — cuotas por cuenta y cómo evitarlas:
   → https://docs.claude.com/en/api/rate-limits

> Tip: las clases de error del SDK (`RateLimitError`, `AuthenticationError`, etc.) se exportan desde `@anthropic-ai/sdk` y también como campos estáticos de `Anthropic` (ej: `Anthropic.RateLimitError`). Todas heredan de `APIError` que tiene la propiedad `.status` con el código HTTP.

## Tu tarea

Abrí `starter.ts`. Vas a escribir DOS cosas:

### 1) `withRetry<T>(fn, options?)` — helper exportado

Una función genérica que:
- Ejecuta `fn()`.
- Si falla con un error **retryable**, espera `baseDelayMs * 2^attempt` ms y reintenta, hasta `maxAttempts` intentos totales.
- Si falla con un error **fatal**, re-lanza inmediatamente (no reintenta).
- Si se queda sin intentos, re-lanza el último error.

Clasificación de "retryable" (empezá simple):
- `err.status === 429` → retryable
- `typeof err.status === "number" && err.status >= 500 && err.status < 600` → retryable
- `err.name === "APIConnectionError" || err.name === "APIConnectionTimeoutError"` → retryable
- Cualquier otra cosa → **no** retryable

Defaults razonables: `maxAttempts: 3`, `baseDelayMs: 500`.

### 2) `run()` — la llamada real

Usa `withRetry` para envolver una llamada a Haiku (saludo breve como en ejercicio 01). Así, si el ejercicio corre con red flaky o rate limit, se recupera solo.

Retorná el `Message` resultante directamente.

## Cómo verificar

```bash
# Desde code/:
aidev verify 05-error-handling

# Playground:
aidev run 05-error-handling --solution
```

Los tests validan DOS cosas:

**Unit tests de `withRetry`** (sin API, con errores fake):
- Si `fn` no tira, `withRetry` lo llama una sola vez y retorna.
- Si `fn` tira un error con `status: 429` y después funciona, `withRetry` reintenta y retorna el éxito.
- Si `fn` tira un error con `status: 500`, también reintenta.
- Si `fn` tira un error con `status: 401` (auth), `withRetry` NO reintenta — re-lanza al toque.
- Si `fn` tira 429 en TODOS los intentos, `withRetry` re-lanza después de `maxAttempts`.
- El delay entre reintentos crece exponencialmente (chequeo aproximado con tiempo medido).

**Integration test de `run`** (una llamada real al API):
- `run` retorna un `Message` con contenido de texto.
- La captura del harness muestra que se usó Haiku.

## Concepto extra (opcional)

1. **Jitter** — ya disponible en la solución como flag opcional:

   ```ts
   // Firma extendida
   interface RetryOptions {
     maxAttempts?: number;
     baseDelayMs?: number;
     jitter?: boolean; // default false
   }

   // Uso
   await withRetry(() => client.messages.create(...), { jitter: true });
   ```

   Implementación: `delay = baseDelayMs * 2^attempt + Math.random() * baseDelayMs`.

   **Por qué importa**: si 100 clientes se comen un 429 al mismo tiempo y todos usan backoff determinístico, reintentan en el mismo milisegundo — burst sincronizado que vuelve a saturar el servidor (thundering herd). Con jitter, cada cliente espera un tiempo ligeramente distinto y las retries se distribuyen.

   El flag es opcional (default `false`) para mantener backward-compat con los tests deterministicos del ejercicio. En producción real, **siempre prendelo**.
2. **Observabilidad**: loguea cada reintento con attempt count + último error. En producción querés saber CUÁNTAS veces el sistema tuvo que reintentar — es una métrica de health.
3. **Deadline global**: además de `maxAttempts`, un `maxTotalDelayMs` que corta si el tiempo acumulado supera X. Para UX: un usuario esperando 30 segundos en un chat ya se fue.

Estos patrones los vas a reconocer en librerías como `p-retry`, `async-retry`, o el retry de AWS SDK. Conocés la receta — ahora sabés las variables.
