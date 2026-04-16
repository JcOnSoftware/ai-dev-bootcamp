# Exercise 02 — Model selection and comparison

## Concepto

OpenAI ofrece varios modelos con distintos balances entre **capacidad, velocidad y costo**. No todos los problemas necesitan el modelo más caro — elegir bien el modelo es una habilidad crucial en producción.

Los dos modelos que vas a comparar hoy:

| Modelo | Costo (entrada/salida por 1M tokens) | Cuándo usarlo |
|--------|--------------------------------------|---------------|
| `gpt-4.1-nano` | $0.10 / $0.40 | Tareas simples, alto volumen, prototipos |
| `gpt-4o-mini`  | $0.15 / $0.60 | Razonamiento moderado, mejor coherencia |

Para el mismo prompt vas a obtener respuestas similares, pero `gpt-4o-mini` tiende a ser más preciso en razonamiento y seguir instrucciones más complejas. `gpt-4.1-nano` es 33% más barato y más rápido para tareas simples.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa del endpoint
3. [Models](https://platform.openai.com/docs/models) — lista de modelos con capacidades y precios

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI.
3. Usá el prompt `"Explain what an API is in one sentence."` para hacer **dos llamadas separadas**:
   - Primera llamada: modelo `"gpt-4.1-nano"`
   - Segunda llamada: modelo `"gpt-4o-mini"`
4. Retorná ambas respuestas como `{ nano: ChatCompletion, mini: ChatCompletion }`.

Tip: hacé las llamadas en secuencia (una después de la otra) con `await`. Las respuestas son independientes.

## Cómo verificar

```bash
aidev verify 02-model-selection
```

Los tests verifican:
- Se hacen exactamente 2 llamadas a la API
- Una usa `gpt-4.1-nano` y la otra `gpt-4o-mini`
- Ambas reciben respuesta con contenido no vacío
- Ambas reportan uso de tokens
- Se retorna un objeto con propiedades `nano` y `mini`

## Concepto extra (opcional)

Podés hacer las dos llamadas **en paralelo** con `Promise.all` para reducir la latencia total:

```typescript
const [nano, mini] = await Promise.all([
  client.chat.completions.create({ model: "gpt-4.1-nano", ... }),
  client.chat.completions.create({ model: "gpt-4o-mini", ... }),
]);
```

Esto es útil cuando las llamadas son independientes entre sí. Si una depende del resultado de la otra, necesitás hacerlas en secuencia.
