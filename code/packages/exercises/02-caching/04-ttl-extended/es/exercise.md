# 04-ttl-extended — TTL extendido de 1 hora

## Concepto

Por defecto, el caché de Claude tiene un TTL (**Time To Live**) de **5 minutos**. Si tu sistema prompt se usa con frecuencia pero el proceso que lo usa dura más de 5 minutos (un servidor de larga vida, un pipeline batch, un agente que corre por horas), pagás el costo de *escritura* de caché en cada nueva request pasada la ventana de 5 minutos.

El **TTL extendido de 1 hora** (`ttl: "1h"`) resuelve esto — pero a un costo mayor en la escritura:

| Operación | Multiplicador |
|-----------|--------------|
| Lectura de caché | 0.1× input |
| Escritura (5 min) | 1.25× input |
| Escritura (1 hora) | **2.0× input** |

Para saber si conviene pagar el 2× de la escritura de 1h, usás `breakEvenCalls`:

```
N > write1h / (write5m - read)
N > 2.0 / (1.25 - 0.1)
N > 2.0 / 1.15 ≈ 1.74  →  Math.ceil = 2
```

Resultado: con **2 lecturas** dentro de la hora, el TTL extendido ya es más barato.

## Docs y referencias

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Extended TTL: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#extended-cache-ttl
- Cache pricing: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing

## Tu tarea

1. Implementá y exportá `breakEvenCalls(cacheTokens: number, pricePerMillion: number): number` usando la fórmula `N > write1h / (write5m - read)` con `Math.ceil`.
2. En `run()`: hacé 2 llamadas usando `cache_control: { type: "ephemeral", ttl: "1h" }` en el bloque de sistema.
3. Retorná ambas respuestas.
4. Usá `console.log` para mostrar el resultado de `breakEvenCalls` (valor educativo).

## Cómo verificar

```bash
aidev verify 04-ttl-extended --solution
aidev verify 04-ttl-extended
aidev run 04-ttl-extended --solution --full
```

Los tests verifican:
- `breakEvenCalls` está exportada como función nombrada.
- `breakEvenCalls(4200, 1.0)` retorna un entero positivo entre 1 y 20.
- El resultado es el mismo para distintos precios (la ratio es invariante al precio).
- `result.calls` tiene 2 elementos.
- Call 1 tiene `cache_control` con `ttl: "1h"` en algún bloque de sistema.
- Call 1 muestra actividad de caché > 0.
- Call 2 tiene `cache_read_input_tokens > 0`.

## Concepto extra

**¿Cuándo usar 1h vs 5m?**

```
Usá 5m (default):
  - Prompts que cambian frecuentemente
  - Pruebas y desarrollo
  - Baja frecuencia de uso del mismo prompt

Usá 1h:
  - Servidores de producción con alto tráfico (muchas llamadas por hora)
  - Pipelines de batch que corren por más de 5 minutos
  - Agentes de larga vida (RAG continuo, chatbots con system prompt fijo)
  - Cualquier caso donde el mismo prompt se usa > 2 veces en una hora
```

### Sobre los parámetros de `breakEvenCalls`

La firma pide `cacheTokens` y `pricePerMillion`, pero ambos parámetros **se cancelan en el álgebra** — el resultado depende solo de la razón entre los multiplicadores (1.25×, 2×, 0.1×) que son constantes de la API. Si derivás la ecuación sobre papel:

```
costo(1h + N reads)  ≤  costo(N writes de 5m)
2.0·T·p + N·0.1·T·p  ≤  N·1.25·T·p
2.0 + 0.1·N          ≤  1.25·N               ← T y p se cancelan
N ≥ 2.0 / 1.15 ≈ 1.74    →    ceil = 2
```

Mantenemos los parámetros en la firma por dos razones:
1. **Documentación viva**: hace explícito qué variables gobiernan el trade-off, aunque matemáticamente no lo hagan.
2. **Futuro-proof**: si Anthropic cambia los multiplicadores o los hace dependientes del modelo, la firma ya está lista sin romper el contrato del ejercicio.

Regla memorizable: **si vas a leer el caché 2 veces o más dentro de 1 hora, usá TTL extendido**. Simple.
