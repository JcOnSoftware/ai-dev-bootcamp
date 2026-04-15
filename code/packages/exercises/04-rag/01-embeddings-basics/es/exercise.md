# 01 — Embeddings Basics

## Concepto

Los **embeddings** son representaciones numéricas de texto como vectores de alta dimensión (1024 floats en este caso). Textos con significado similar terminan en regiones cercanas del espacio vectorial. Esto los hace la base de los sistemas RAG: convertís texto a números, y luego usás aritmética vectorial para medir similitud semántica.

Voyage AI produce vectores **L2-normalizados** (magnitud = 1). Esto significa que el **producto punto** entre dos vectores es exactamente igual a la **similitud coseno** — no necesitás dividir por magnitudes, lo que simplifica el código.

El parámetro `input_type` es asimétrico:
- `"document"` → para los textos del corpus que querés indexar
- `"query"` → para la consulta con la que buscás

Confundir los dos degrada la calidad de retrieval.

## Docs y referencias

- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Voyage AI Models: <https://docs.voyageai.com/docs/embeddings>
- Costo estimado: $0.000 (modelo voyage-3.5-lite, incluido en free tier 200M tokens)

## Tu tarea

Implementá tres cosas en `starter.ts`:

1. **`embed(texts, inputType)`** — llamá a la Voyage AI API con `fetch`:
   - URL: `https://api.voyageai.com/v1/embeddings`
   - Body: `{ input: texts, model: "voyage-3.5-lite", input_type: inputType }`
   - Auth: `Authorization: Bearer ${process.env.VOYAGE_API_KEY}`
   - Retorná `number[][]` — un embedding por texto

2. **`cosineSimilarity(a, b)`** — producto punto de dos vectores L2-normalizados.
   Es simplemente: `sum(a[i] * b[i])` para todo `i`.

3. **`run()`** — demostrá el concepto:
   - Embebé una query sobre prompt caching
   - Embebé un texto similar y uno disímil (en el mismo call, por eficiencia)
   - Retorná `{ embedding, dimension, similarityScore }`

## Cómo verificar

```bash
# Verificar tu implementación
aidev verify 01-embeddings-basics

# Ver la solución de referencia
aidev verify 01-embeddings-basics --solution
```

## Qué validan los tests

**Tests unitarios (sin API):**
- `cosineSimilarity([1,0], [1,0])` devuelve `1`
- `cosineSimilarity([1,0], [0,1])` devuelve `0`
- `cosineSimilarity([1,0], [-1,0])` devuelve `-1`

**Tests de integración (API real):**
- `embed(["hello world"], "document")` devuelve un array de longitud 1
- Cada vector tiene dimensión 1024
- Textos similares tienen similitud coseno > 0.5
- Textos disímiles tienen similitud coseno < 0.8
- `run()` devuelve la forma `{ embedding: number[], dimension: 1024, similarityScore: number }`

## Concepto extra

**¿Por qué batchear?** Voyage AI acepta múltiples textos en una sola llamada. Es más eficiente y respeta los rate limits. Ejemplo: embebé la query y el corpus juntos en una sola llamada cuando sea posible.

**¿Por qué `input_type`?** Voyage entrena con pares (documento, query) donde el embedding de query está "apuntando hacia" el embedding del documento. Si usás `"document"` para ambos, la búsqueda degrada. Es asimétrico por diseño — igual que en Cohere y BGE.
