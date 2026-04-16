# Exercise 01 — Your first Claude call

## Concept

Antes de agents, tool use, o RAG: **una llamada al modelo es solo HTTP con formato específico**. Tres cosas no negociables:

1. **Client** — una instancia autenticada del SDK. Lee `ANTHROPIC_API_KEY` del entorno automáticamente.
2. **Model** — qué variante de Claude usás. Cada modelo tiene tradeoffs de costo/velocidad/capacidad. Para aprender: usá **Haiku** (barato y rápido).
3. **Messages** — un array de turns `{ role, content }`. El primer turn suele ser `user`.

El SDK responde con un objeto `Message` que contiene `content` (array de bloques, usualmente uno de tipo `text`), `usage` (tokens in/out), `model`, y `stop_reason`.

## Docs & references

Lee estos en orden — son oficiales, están siempre actualizados:

1. **SDK README (TypeScript)** — cómo instanciar el cliente (`new Anthropic()`) y el primer ejemplo funcional:
   → https://github.com/anthropics/anthropic-sdk-typescript
2. **Messages API reference** — todos los parámetros de `client.messages.create` (`model`, `max_tokens`, `messages`, `system`, etc.):
   → https://docs.claude.com/en/api/messages
3. **Models overview** — tabla de IDs de modelos (Opus 4.6, Sonnet 4.6, Haiku 4.5), precios y tradeoffs:
   → https://docs.claude.com/en/docs/about-claude/models/overview

> Tip: el SDK también trae tipos TS. En tu editor, hacé hover sobre `messages.create` para ver la firma completa sin salir de VS Code.

## Tu tarea

Abrí `starter.ts`. Hay una función `run` que debe:

1. Crear un cliente de Anthropic
2. Llamar a `messages.create` con:
   - Un modelo de la familia Haiku (ver Models overview arriba para el ID exacto)
   - `max_tokens` razonable (≤ 200 alcanza)
   - Un mensaje del `user` pidiendo un saludo corto en español
3. Retornar la respuesta

No hace falta parsear nada — el harness captura la llamada y la respuesta.

## Cómo verificar

```bash
# Desde code/, con ANTHROPIC_API_KEY configurada (via `aidev init` o .env):
aidev verify 01-first-call
```

Los tests validan:
- Hiciste exactamente una llamada al API
- Usaste un modelo Claude (preferentemente Haiku)
- Pasaste `max_tokens` razonable
- El mensaje del user tiene contenido
- La respuesta llegó con al menos un bloque de texto
- El response trae `usage` con `input_tokens` > 0 y `output_tokens` > 0

## Concepto extra (opcional)

Mirá el objeto `usage` que devuelve el SDK: `input_tokens` y `output_tokens`. Eso es lo que PAGÁS. Cada modelo tiene tarifas distintas por millón de tokens — ver Models overview arriba. Entender esto es la base para optimizar costo.
