# Exercise 03 — Streaming responses

## Concepto

Hasta ahora llamaste al modelo, esperaste a que terminara, y recibiste la respuesta completa. Eso se llama **modo blocking**. Tiene un problema: mientras el modelo genera 500 tokens, tu UI está congelada. El usuario ve una ruedita y no sabe si pasó algo.

**Streaming** resuelve esto. En vez de esperar al mensaje completo, recibís un stream de **eventos** mientras el modelo genera:

- `message_start` — el modelo arrancó, acá tenés el ID, modelo, etc.
- `content_block_start` — va a empezar un bloque de texto o de tool_use.
- `content_block_delta` — un fragmento de texto (típicamente algunas palabras).
- `content_block_stop` — terminó el bloque.
- `message_delta` — updates en el top-level (usage final, stop_reason).
- `message_stop` — el mensaje terminó.

Para la mayoría de los casos (texto normal), te importan los `content_block_delta` con `delta.type === "text_delta"`. Los vas acumulando en un string mientras los recibís, y eso es lo que le mostrás al usuario en tiempo real.

**¿Por qué te importa?**

1. **UX**. Un chat que imprime token a token se siente rápido. El mismo chat esperando 4 segundos a la respuesta completa se siente roto.
2. **Respuestas largas**. Si estás generando 4000 tokens, el usuario ve progreso desde el primer segundo.
3. **Interrupción**. Podés cortar el stream si el usuario se arrepiente — ahorra tokens, ahorra plata.

El SDK te ofrece dos maneras equivalentes:

```ts
// Forma 1: stream() helper (recomendada)
const stream = client.messages.stream({ ... });

// Forma 2: create con stream: true
const stream = await client.messages.create({ stream: true, ... });
```

Las dos devuelven un objeto iterable con `.finalMessage()` — el método que te da el mensaje acumulado cuando el stream termina, sin que tengas que reconstruirlo vos.

## Docs & references

1. **Streaming messages** — guía oficial con eventos, ejemplos, patrones:
   → https://docs.claude.com/en/docs/build-with-claude/streaming
2. **SDK README (TypeScript)** — sección "Streaming responses":
   → https://github.com/anthropics/anthropic-sdk-typescript
3. **Messages API reference** — `stream: true` parameter:
   → https://docs.claude.com/en/api/messages

> Tip: el iterable del stream implementa `AsyncIterable<MessageStreamEvent>`. Podés usar `for await (const event of stream)` directamente.

## Tu tarea

Abrí `starter.ts`. Hay una función `run` que debe:

1. Crear un cliente Anthropic.
2. Iniciar un **stream** contra Haiku pidiendo algo breve (ej: "Contá en 3 oraciones una anécdota graciosa sobre programación"). Usar `max_tokens` ≤ 300.
3. Iterar los eventos del stream y acumular el texto de los `content_block_delta` cuyo `delta.type === "text_delta"` en un string.
4. Al final, obtener el mensaje final con `await stream.finalMessage()`.
5. Retornar `{ accumulatedText, finalMessage }`.

El harness captura el `finalMessage` automáticamente cuando detecta el stream — vos solo tenés que escribir código de streaming real.

## Cómo verificar

```bash
# Desde code/:
aidev verify 03-streaming
```

Los tests validan:
- Hiciste exactamente UNA llamada al API con `stream: true`.
- La llamada fue capturada como `streamed: true` por el harness.
- Usaste un modelo Haiku.
- `accumulatedText` que retornaste es un string no vacío.
- `accumulatedText` coincide (o es equivalente) con el texto del `finalMessage`.
- El `finalMessage` capturado tiene al menos un bloque de texto.
- `max_tokens` razonable (1..500).

## Concepto extra (opcional)

Mirá el `finalMessage.usage`. Los `output_tokens` son los que pagaste. El streaming **no cambia el costo** — pagás lo mismo que en modo blocking. El valor del streaming es **percibido**: el usuario ve texto aparecer, no pierde paciencia. Es la diferencia entre un chat que se siente vivo y uno que se siente trabado.

Bonus: si tu UI lo permite, imprimí cada delta en consola con `process.stdout.write(delta.text)` mientras itera el stream. Vas a ver el texto aparecer palabra a palabra en tu terminal — eso es lo que un usuario final VE.
