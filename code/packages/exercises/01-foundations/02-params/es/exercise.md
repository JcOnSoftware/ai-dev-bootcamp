# Exercise 02 — Parameters: deterministic vs creative

## Concepto

Los parámetros de `messages.create` no son cosméticos — **cambian el comportamiento del modelo** de una forma que vos tenés que controlar según el caso de uso.

Los tres que importan desde el día uno:

1. **`temperature`** (0.0 a 1.0) — controla la aleatoriedad del muestreo de tokens.
   - `0` → **determinista**. Mismo input, misma (o casi misma) salida. Lo que querés para extracción estructurada, parsing, clasificación, o cualquier tarea donde la respuesta es "correcta o incorrecta".
   - `0.7 - 1.0` → **creativo**. La salida varía entre runs. Lo que querés para brainstorming, copys de marketing, variaciones de contenido.
   - `0.3 - 0.6` → zona gris. Evitala hasta que sepas POR QUÉ.

2. **`top_p`** (0.0 a 1.0) — sampling alternativo (nucleus sampling). **Usá UNO de los dos**: temperature O top_p, no ambos. La convención en v1 es usar `temperature` — es más intuitivo.

3. **`max_tokens`** — límite duro de tokens de salida. Ya lo usaste en el ejercicio 01, pero acá lo tratás como **defensa contra costos runaway**. Un loop con bug puede hacer que el modelo genere miles de tokens; `max_tokens` te cubre.

**El punto importante**: no existe un "valor correcto" universal. Existe el valor correcto PARA TU CASO. El mismo modelo con temp=0 es una máquina de extracción; con temp=0.9 es un brainstorm partner. Mismo código, distinto producto.

## Docs & references

1. **Messages API reference** — todos los params (`temperature`, `top_p`, `top_k`, `stop_sequences`, `system`, etc.):
   → https://platform.claude.com/docs/en/api/messages
2. **SDK README (TypeScript)** — cómo pasar múltiples params al call:
   → https://github.com/anthropics/anthropic-sdk-typescript
3. **Models overview** — cada modelo tiene un `max_tokens` distinto como techo:
   → https://platform.claude.com/docs/en/docs/about-claude/models/overview

> Tip: el SDK trae tipos TS. Hacé hover sobre el objeto que pasás a `messages.create` — vas a ver todos los params opcionales con sus tipos.

## Tu tarea

Abrí `starter.ts`. Hay una función `run` que debe hacer **DOS llamadas** a Claude Haiku:

1. **Llamada determinista**: `temperature: 0`. Mensaje: pedile al modelo que extraiga información estructurada (por ejemplo: "extraé el nombre y email del siguiente texto: 'Me llamo Juan y mi email es juan@ejemplo.com'").

2. **Llamada creativa**: `temperature >= 0.7`. Mensaje: pedile al modelo algo que requiera creatividad (por ejemplo: "Escribí 3 títulos creativos para un artículo sobre inteligencia artificial").

Ambas llamadas deben:
- Usar un modelo Haiku (ver "Model IDs" en docs).
- Pasar `max_tokens` razonable (≤ 300).

Retorná un objeto `{ deterministic, creative }` con ambas respuestas.

## Cómo verificar

```bash
# Desde code/, con ANTHROPIC_API_KEY configurada:
aidev verify 02-params
```

Los tests validan:
- Hiciste exactamente DOS llamadas al API.
- Al menos una llamada tiene `temperature === 0` (determinista).
- Al menos una llamada tiene `temperature >= 0.7` (creativa).
- Ambas usaron un modelo Claude Haiku.
- Ambas pasaron `max_tokens` entre 1 y 500.
- Cada llamada tiene un mensaje de `user` con contenido no vacío.
- Ambas respuestas llegaron con al menos un bloque de texto.

## Concepto extra (opcional)

Una vez que los tests pasen, probá correr el ejercicio **dos veces seguidas** y compará las respuestas:

- La `deterministic` debería ser igual o casi idéntica en ambas corridas.
- La `creative` debería variar.

Eso es `temperature` en acción. No es magia — es que el modelo está literalmente muestreando distinto de la distribución de probabilidad.

Bonus: mirá el objeto `usage` de cada call. ¿Cuál costó más? ¿Por qué? (Pista: no es la temperatura.)
