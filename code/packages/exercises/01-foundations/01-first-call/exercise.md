# Exercise 01 — Your first Claude call

## Concept

Antes de agents, tool use, o RAG: **una llamada al modelo es solo HTTP con formato específico**. Tres cosas no negociables:

1. **Client** — una instancia autenticada del SDK. Lee `ANTHROPIC_API_KEY` del entorno automáticamente.
2. **Model** — qué variante de Claude usás. Cada modelo tiene tradeoffs de costo/velocidad/capacidad. Para aprender: usá **Haiku** (barato y rápido).
3. **Messages** — un array de turns `{ role, content }`. El primer turn suele ser `user`.

El SDK responde con un objeto `Message` que contiene `content` (array de bloques, usualmente uno de tipo `text`), `usage` (tokens in/out), `model`, y `stop_reason`.

## Tu tarea

Abrí `starter.ts`. Hay una función `run` que debe:

1. Crear un cliente de Anthropic
2. Llamar a `messages.create` con:
   - Un modelo de la familia Haiku
   - `max_tokens` razonable (≤ 200 alcanza)
   - Un mensaje del `user` pidiendo un saludo corto en español
3. Retornar la respuesta

No hace falta parsear nada — el harness captura la llamada y la respuesta.

## Cómo verificar

```bash
# Desde code/
ANTHROPIC_API_KEY=sk-... bun test packages/exercises/01-foundations/01-first-call/tests.ts
```

Los tests validan:
- Hiciste exactamente una llamada al API
- Usaste un modelo Claude (preferentemente Haiku)
- Pasaste `max_tokens` razonable
- El mensaje del user tiene contenido
- La respuesta llegó con al menos un bloque de texto

## Concepto extra (opcional)

Mirá el objeto `usage` que devuelve el SDK: `input_tokens` y `output_tokens`. Eso es lo que PAGÁS. Cada modelo tiene tarifas distintas por millón de tokens. Entender esto es la base para optimizar costo.
