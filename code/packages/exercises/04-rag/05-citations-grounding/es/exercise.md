# 05 — Citations & Grounding

## Concepto

Las **citas** son el mecanismo para hacer tu RAG trazable: el LLM no solo responde, sino que te dice qué fuentes usó. Esto permite:

1. **Verificabilidad**: el usuario puede ver de dónde viene cada afirmación.
2. **Detección de alucinaciones**: si el LLM cita un ID que no existe, sabés que inventó algo.
3. **UI de fuentes**: podés mostrar links a la documentación original junto con la respuesta.

La técnica: pedile al LLM que responda en JSON estructurado con `answer` y `citations`. Usás **prompt engineering** (sin tool use) porque es más simple y suficiente para este caso.

**Parser tolerante**: Los LLMs a veces envuelven el JSON en fences de markdown (` ```json ... ``` `) aunque les digas que no. El parser tolerante los limpia antes de `JSON.parse`. El error incluye el texto raw del LLM para debugging.

## Docs y referencias

- XML tags en prompts: <https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags>
- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Anthropic Messages API: <https://docs.claude.com/en/api/messages>
- Costo estimado: ~$0.001 por run (Haiku + Voyage free tier)

## Tu tarea

Implementá tres cosas en `starter.ts`:

1. **`parseJsonResponse<T>(text)`** — parser tolerante:
   - Si el texto empieza con ` ```json ` o ` ``` `, eliminá los fences
   - Llamá a `JSON.parse` en el texto limpio
   - Si falla, tirar un error que incluya el texto raw en el mensaje

2. **`generateWithCitations(query)`** — pipeline RAG con citas:
   - Construí el índice desde `DOCS_CHUNKS`
   - Buscá los top-3 chunks
   - Construí un system prompt que instruya a Claude a responder en JSON: `{"answer":"...","citations":["chunk-id"]}`
   - Llamá a `claude-haiku-4-5-20251001`
   - Parseá la respuesta con `parseJsonResponse`
   - Validá que los IDs citados existan en los chunks recuperados
   - Retorná `{ answer, citations, retrieved }`

3. **`run()`** — llamá a `generateWithCitations("What formats does Claude support for tool use input?")`

## Cómo verificar

```bash
aidev verify 05-citations-grounding
aidev verify 05-citations-grounding --solution
```

## Qué validan los tests

**Tests unitarios (sin API):**
- `parseJsonResponse('{"answer":"x","citations":[]}')` → objeto correcto
- `parseJsonResponse('```json\n{...}\n```')` → strips fences y parsea
- `parseJsonResponse('```\n{...}\n```')` → strips fences sin lenguaje

**Tests de integración (API real):**
- Exactamente 1 llamada a la API de Anthropic
- Modelo Haiku
- System prompt contiene instrucción JSON o "citation"
- `userReturn.citations` es un array
- Cada citation ID existe en `userReturn.retrieved`
- `userReturn.answer` es string no vacío

## Concepto extra

**¿Por qué validar los IDs?** Si el LLM inventa un ID que no existe en los chunks recuperados, es una señal de alucinación. La validación protege al usuario de citas falsas. En producción podrías loguear estos casos como métricas de confiabilidad del RAG.

**Alternativa con structured outputs**: En lugar de prompt engineering para JSON, podrías usar `response_format: { type: "json_object" }` o tool use con un schema definido. El trade-off: más robusto pero requiere más código. Para RAG simples, el prompt engineering es suficiente.
