# 04 — Retrieval Pipeline

## Concepto

El pipeline RAG (Retrieval-Augmented Generation) combina búsqueda vectorial con generación de lenguaje:

```
query → embed(query, "query") → search(index, topK)
                                        ↓
                        chunks relevantes
                                        ↓
                        system prompt con contexto
                                        ↓
                        Anthropic.messages.create (Haiku)
                                        ↓
                        respuesta fundamentada en los docs
```

El concepto clave: **el LLM no sabe nada de tu base de conocimiento** hasta que se lo inyectás en el system prompt. El retrieval es el puente entre tu corpus y la generación.

**Nota sobre el harness**: el harness de aidev solo captura llamadas a la API de Anthropic. Las llamadas a Voyage AI (`fetch`) son invisibles para él — por eso los tests en este ejercicio solo verifican la llamada a Claude, no las de embedding.

## Docs y referencias

- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Anthropic Messages API: <https://docs.claude.com/en/api/messages>
- Model IDs: <https://docs.claude.com/en/docs/about-claude/models/overview>
- Costo estimado: ~$0.001 por run (Haiku + Voyage free tier)

## Tu tarea

Implementá dos cosas en `starter.ts`:

1. **`retrieveAndGenerate(query, index, topK)`**:
   - Embebé la query con Voyage AI (input_type `"query"`)
   - Buscá los `topK` chunks más similares en el índice
   - Construí un system prompt con el texto de los chunks recuperados
   - Llamá a `claude-haiku-4-5-20251001` con el system prompt y la query
   - Retorná `{ answer, retrieved, usage: { embedTokens } }`

2. **`run()`**:
   - Construí el índice desde `DOCS_CHUNKS` (embed todos con `"document"`)
   - Llamá a `retrieveAndGenerate("What is the TTL for prompt caching?", index, 3)`
   - Retorná el resultado

## Cómo verificar

```bash
aidev verify 04-retrieval-pipeline
aidev verify 04-retrieval-pipeline --solution
```

## Qué validan los tests

**Tests de integración (API real):**
- `run()` realiza exactamente 1 llamada a la API de Anthropic (harness la captura)
- El modelo usado es Haiku (`/haiku/i`)
- El system prompt contiene contenido de los chunks recuperados
- `userReturn.retrieved` tiene exactamente 3 chunks
- `userReturn.answer` es un string no vacío
- `userReturn.usage.embedTokens` es un número positivo

## Concepto extra

**¿Por qué el sistema prompt con contexto?** El LLM no tiene acceso en tiempo real a tus docs. Al inyectar los chunks más relevantes en el system prompt, le das al modelo la información precisa que necesita para responder — sin alucinaciones sobre detalles que no conoce.

**Prompt engineering para RAG**: indicale explícitamente al modelo que responda SOLO con el contexto provisto. Esto reduce las alucinaciones. En el siguiente ejercicio (05), añadís citas para rastreabilidad.
