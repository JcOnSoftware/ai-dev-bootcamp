# Ejercicio 04 — Tools with MCP

## Concepto

Para usar tools MCP con la API de Claude, hay un **gap de nomenclatura** que bridgear manualmente:

| Campo | MCP | Anthropic API |
|-------|-----|---------------|
| Schema del input | `inputSchema` (camelCase) | `input_schema` (snake_case) |

Este renaming es el "seam" entre los dos protocolos. En este ejercicio lo implementás a mano — antes de usar helpers de alto nivel — para que entiendas exactamente qué está pasando.

**El loop de 3 pasos** (bridge loop):
1. `client.listTools()` → obtener tools del servidor MCP
2. `mcpToolsToAnthropicFormat()` → convertir a formato Anthropic
3. Loop: `messages.create()` → si `stop_reason === "tool_use"` → `client.callTool()` → feed result → continuar hasta `end_turn`

## Docs y referencias

- MCP quickstart (cliente): https://modelcontextprotocol.io/quickstart/client
- Claude Messages API: https://docs.claude.com/en/api/messages
- Arquitectura MCP: https://modelcontextprotocol.io/docs/concepts/architecture

## Tu tarea

1. Implementá `mcpToolsToAnthropicFormat(mcpTools)` — pure function, sin side effects.
2. Implementá `askClaudeWithMcpTools(question)` — setup MCP client, convertí tools, loop bridge, cleanup.
3. Usá el modelo `claude-haiku-4-5-20251001` (exacto — los tests lo verifican).

## Cómo verificar

```bash
AIDEV_TARGET=starter aidev verify 04-tools-with-mcp   # debe fallar
AIDEV_TARGET=solution aidev verify 04-tools-with-mcp  # debe pasar (requiere ANTHROPIC_API_KEY)
```

## Qué validan los tests

**Unit** (sin API key):
- `mcpToolsToAnthropicFormat` preserva nombres y descripciones.
- El campo resultante se llama `input_schema`, NO `inputSchema`.

**Integration** (requiere API key):
- Se hizo al menos 1 tool call.
- La respuesta final tiene más de 30 caracteres.
- El modelo usado matchea `/haiku/i`.

## Concepto extra

En producción podés usar el helper de alto nivel del SDK de Anthropic:

```typescript
const result = await client.beta.messages.toolRunner({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1024,
  tools: anthropicTools,
  messages: [{ role: "user", content: question }],
  // el SDK maneja el loop automáticamente
});
```

Aprendé el loop manual primero. Entender la mecánica antes de usar la abstracción.
