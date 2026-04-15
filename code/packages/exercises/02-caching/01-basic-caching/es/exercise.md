# 01-basic-caching — Primera llamada con caché

## Concepto

El **prompt caching** de Claude te permite "fijar" parte del contexto en la API para no transmitirlo ni procesarlo en cada llamada. En lugar de pagar el precio completo de entrada en cada request, la segunda llamada que incluya el mismo bloque cacheado paga solo un **0.1× del precio de entrada** — un ahorro del 90 %.

Para que el caché se active, el bloque de sistema debe superar el umbral mínimo de **4,096 tokens** en Haiku 4.5. Este ejercicio usa un documento técnico de ~4,300 tokens que ya supera ese umbral.

Flujo básico:
- Llamada 1: `cache_creation_input_tokens > 0` (el caché se escribe por primera vez)
- Llamada 2: `cache_read_input_tokens > 0` (el caché se lee — precio 0.1×)

El TTL por defecto del caché es **5 minutos** (modo ephemeral).

## Docs y referencias

- Guía principal: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Referencia de la API Messages: https://docs.claude.com/en/api/messages

## Tu tarea

1. Importá `LONG_SYSTEM_PROMPT` desde `../fixtures/long-system-prompt.ts`.
2. Creá un bloque de sistema con `type: "text"`, `text: LONG_SYSTEM_PROMPT`, y `cache_control: { type: "ephemeral" }`.
3. Hacé **dos llamadas secuenciales** a `client.messages.create` con ese mismo bloque de sistema.
4. Usá el modelo `claude-haiku-4-5-20251001` y `max_tokens: 256`.
5. Retorná ambas respuestas desde `run()`.

## Cómo verificar

```bash
# Correr contra la solución (integración real):
aidev verify 01-basic-caching --solution

# Correr tu implementación:
aidev verify 01-basic-caching

# Ver el output con detalle:
aidev run 01-basic-caching --solution --full
```

Los tests verifican:
- `result.calls` tiene exactamente 2 elementos.
- Ambas requests incluyen `cache_control: { type: "ephemeral" }` en el bloque de sistema.
- La llamada 1 muestra actividad de caché (creación o lectura > 0 tokens).
- La llamada 2 tiene `cache_read_input_tokens > 0`.
- Ambas respuestas contienen al menos un bloque de texto.
- Ambas usan un modelo Haiku.

## Concepto extra

**¿Por qué el caché a veces ya está activo en la primera llamada?**

El caché de Anthropic es **server-side** y persiste durante 5 minutos desde la última lectura. Si corrés el ejercicio varias veces en una sesión, la primera llamada puede encontrar el caché ya caliente y mostrar `cache_read_input_tokens > 0` en lugar de `cache_creation_input_tokens > 0`. Esto es comportamiento correcto — los tests lo contemplan.

En producción, este comportamiento es deseable: múltiples requests de diferentes usuarios que comparten el mismo system prompt se benefician del mismo caché server-side.
