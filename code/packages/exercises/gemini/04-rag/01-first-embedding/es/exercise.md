# Exercise 01 — Your first embedding

## Concepto

RAG (Retrieval-Augmented Generation) arranca con **embeddings**: una función que convierte texto en un vector de floats. Dos textos cuyos vectores apuntan en direcciones similares son semánticamente similares; dos que apuntan distinto, no. Guardás un corpus como vectores, embedeás el query del user igual, y retrievás los vectores más cercanos para encontrar contexto relevante.

El modelo de embedding de Gemini es `gemini-embedding-001`. Por default retorna vectores de **3072 dimensiones** (un embedding "Matryoshka" — opcionalmente podés truncar a 1536 o 768 con `config.outputDimensionality`). El output está **normalizado** (L2 norm ≈ 1), lo que significa que cosine similarity es solo un dot product — conveniente.

El shape del response es:

```ts
{
  embeddings: [
    { values: number[] },  // una entry por "contents" de input
  ]
}
```

Este ejercicio es el "hello world" — embedeás una oración e inspeccionás el vector. Los ejercicios siguientes computan similarities, construyen índices de búsqueda, y enchufan el retrieval en `generateContent`.

## Docs & referencias

1. [Guía de embeddings](https://ai.google.dev/gemini-api/docs/embeddings) — modelos, dimensiones, opciones de taskType
2. [Referencia de `embedContent`](https://ai.google.dev/api/embeddings) — schema de request/response
3. [Model card de `gemini-embedding-001`](https://ai.google.dev/gemini-api/docs/models#gemini-embedding-001) — capacidades

## Tu tarea

1. Llamá a `ai.models.embedContent({ ... })` con:
   - `model`: `"gemini-embedding-001"`
   - `contents`: una única oración (ej., `"The Amazon rainforest produces about 20% of the world's oxygen."`)
2. Agarrá `response.embeddings[0].values` — un array de floats.
3. Retorná:
   - `dimensions`: el length del vector
   - `firstFive`: los primeros 5 valores (para chequear que parece data real)
   - `l2Norm`: la norm L2, `sqrt(sum(v*v))` — debería estar cerca de 1

## Cómo verificar

```bash
aidev verify 01-first-embedding
```

Los tests verifican:
- Exactamente 1 llamada a `embedContent`
- Usa un modelo `gemini-embedding`
- `dimensions === 3072` (dim por default)
- `firstFive` tiene 5 números finitos
- `l2Norm` está entre 0.95 y 1.05 (aproximadamente unit-length)

## Concepto extra (opcional)

¿Por qué unit-length? Si normalizás vectores de modo que `||v|| == 1`, entonces **cosine similarity** (`a · b / (|a| * |b|)`) se simplifica a solo el dot product (`a · b`). Lo computás con un solo loop de multiply-add en vez de tres. A escala, esto importa — las vector databases aman inputs pre-normalizados.

Podés reducir dim con `config.outputDimensionality: 1536` (o `768`). Menos dim = menos storage + search más rápido, a un pequeño costo de calidad. 768 es un gran default para la mayoría de sistemas RAG de producción.

Para búsqueda language-aware, usá `config.taskType: "RETRIEVAL_DOCUMENT"` al guardar corpus y `"RETRIEVAL_QUERY"` al embedear un query de búsqueda. Gemini rutea un poco distinto para cada uno — mejoras pequeñas pero medibles en benchmarks del mundo real.
