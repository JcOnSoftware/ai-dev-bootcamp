# 03 — Chunking Strategies

## Concepto

Antes de embeber un documento largo, necesitás dividirlo en **chunks** — fragmentos manejables. El tamaño del chunk afecta directamente la calidad del retrieval:

- **Chunks muy grandes** → el vector mezcla múltiples conceptos, la similitud coseno es menos precisa.
- **Chunks muy pequeños** → perdés contexto, el LLM no tiene suficiente información.

Este ejercicio enseña tres estrategias:

| Estrategia | Cómo divide | Cuándo usarla |
|---|---|---|
| **Fixed-size** | Ventana deslizante de N chars con overlap | Textos sin estructura clara |
| **Sentence** | Por puntuación (`. ! ?`) | Prosa, artículos, documentación |
| **Paragraph** | Por doble newline (`\n\n`) | Documentación técnica, wikis |

El **overlap** (solapamiento) entre chunks resuelve el problema de boundary: si una idea está partida entre dos chunks, el overlap asegura que ambos chunks tengan suficiente contexto.

**Costo: $0.000** — este ejercicio es pura computación, sin llamadas a APIs.

## Docs y referencias

- Long context tips: <https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips>
- Regla general: 200-500 tokens por chunk, overlap del 10-20%

## Tu tarea

Implementá dos cosas en `starter.ts`:

1. **`chunk(text, { size, overlap })`** — ventana deslizante de tamaño fijo:
   - `step = size - overlap`
   - Empezá en posición 0, avanzá `step` chars por ventana
   - El último chunk incluye todo el texto restante (puede ser más corto que `size`)
   - Si el texto está vacío, retorná `[]`

2. **`run()`** — demostrá las 3 estrategias sobre el primer chunk de `DOCS_CHUNKS`:
   - `fixed`: `chunk(text, { size: 200, overlap: 50 })`
   - `sentence`: dividí por puntuación de fin de oración (`. ! ?`)
   - `paragraph`: dividí por doble newline (`\n\n`)
   - Retorná `{ fixed, sentence, paragraph }`

## Cómo verificar

```bash
aidev verify 03-chunking-strategies
aidev verify 03-chunking-strategies --solution
```

## Qué validan los tests

**Tests unitarios (sin API):**
- `chunk("", ...)` devuelve `[]`
- Texto más corto que `size` devuelve array de longitud 1
- Texto exactamente igual a `size` devuelve 1 chunk
- Texto más largo se divide en múltiples chunks
- Con overlap: los últimos N chars de `chunk[i]` son iguales a los primeros N chars de `chunk[i+1]`
- `run()` devuelve `{ fixed: string[], sentence: string[], paragraph: string[] }` con arrays no vacíos

## Concepto extra

**¿Por qué overlap?** Si un documento habla de "los beneficios del caching" y el corte de chunk cae justo en "bene-", perdés la idea. El overlap garantiza que las ideas que cruzan un boundary estén completas en al menos un chunk.

**Producción**: Para textos con estructura semántica (documentación técnica), el chunking por párrafo suele superar el fixed-size. Para texto libre (transcripciones, emails), el fixed-size con overlap moderado es más robusto.
