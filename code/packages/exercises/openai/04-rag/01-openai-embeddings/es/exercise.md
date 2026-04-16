# Exercise 01 — OpenAI Embeddings

## Concepto

Un **embedding** es una representación numérica de texto — un vector de números de punto flotante. La idea es que textos con significado similar quedan cerca en ese espacio vectorial. Eso es lo que hace posible la búsqueda semántica: no buscás palabras exactas, buscás significado.

OpenAI ofrece el modelo `text-embedding-3-small` que convierte texto en vectores de **1536 dimensiones** por defecto. Podés enviar múltiples textos en una sola llamada pasando un array como `input`.

El endpoint de embeddings es diferente al de chat completions: no genera texto, solo transforma texto en vectores. El resultado es un array `data` donde cada ítem tiene `embedding` (el vector), `index` (posición en el input) y `object`.

Esta operación es la base de todo sistema RAG: primero generás embeddings para tus documentos, después generás un embedding para la query del usuario, y finalmente comparás similitud para encontrar los documentos relevantes.

## Docs & referencias

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — qué son los embeddings, cuándo usarlos y las dimensiones de cada modelo
2. [Embeddings API reference](https://platform.openai.com/docs/api-reference/embeddings/create) — parámetros completos del endpoint `embeddings.create`
3. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente

## Tu tarea

1. Abrí `starter.ts` y creá una instancia del cliente OpenAI.
2. Llamá a `client.embeddings.create()` con:
   - `model`: `"text-embedding-3-small"`
   - `input`: `["Hello world", "Hola mundo"]`
3. Retorná un objeto con:
   - `embeddings`: el array `response.data` (cada ítem tiene `embedding`, `index`, `object`)
   - `dimensions`: la longitud del primer vector (`response.data[0].embedding.length`)

## Cómo verificar

```bash
aidev verify 01-openai-embeddings
```

Los tests verifican:
- `embeddings` es un array de 2 ítems
- Cada ítem tiene una propiedad `embedding` que es un array de números
- `dimensions` es `1536` (dimensión por defecto de `text-embedding-3-small`)
- `dimensions` coincide con la longitud real del primer vector

## Concepto extra (opcional)

Podés reducir las dimensiones con el parámetro `dimensions` en la llamada (ej: `dimensions: 256`). Menos dimensiones = vectores más pequeños = búsqueda más rápida, pero con algo de pérdida de precisión semántica. El modelo `text-embedding-3-large` tiene 3072 dimensiones y mayor precisión, pero cuesta más. Para la mayoría de los casos de uso, `text-embedding-3-small` a 1536 dimensiones es el punto óptimo entre costo y calidad.
