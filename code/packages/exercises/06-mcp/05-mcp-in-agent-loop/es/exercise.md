# Ejercicio 05 — MCP in Agent Loop

## Concepto

Este ejercicio cierra el círculo. Tomás el loop de agente del track 05-agents y reemplazás `executeTool()` (local) por `client.callTool()` (remoto via MCP). El modelo nunca sabe ni le importa si las tools son locales o remotas — **MCP es la capa de abstracción**.

```
Antes (05-agents):   executeTool(name, input)  → función local
Ahora (06-mcp):      client.callTool({name, arguments: input})  → servidor MCP
```

El loop es idéntico. Solo cambia de dónde viene la ejecución de la tool.

**Esto es el patrón de producción** para asistentes AI con tool servers externos. Claude Desktop, Cursor, y otros clientes MCP usan exactamente este patrón.

## Docs y referencias

- MCP quickstart (cliente): https://modelcontextprotocol.io/quickstart/client
- Claude Messages API: https://docs.claude.com/en/api/messages
- Arquitectura MCP: https://modelcontextprotocol.io/docs/concepts/architecture

## Tu tarea

Implementá `runAgentWithMcpTools(question, maxIterations?)` en `starter.ts`:

1. Setup: `InMemoryTransport` + `createResearchServer()` + `Client`.
2. Descubrí y convertí tools (reutilizá `mcpToolsToAnthropicFormat` del ejercicio 04).
3. Loop de agente: igual que 05-agents, pero `client.callTool()` en lugar de `executeTool()`.
4. Capturá `toolCalls` e `iterations` durante el loop.
5. Cleanup: `await client.close()`.
6. Retorná `{ finalMessage, iterations, toolCalls }`.

## Cómo verificar

```bash
AIDEV_TARGET=starter aidev verify 05-mcp-in-agent-loop   # debe fallar
AIDEV_TARGET=solution aidev verify 05-mcp-in-agent-loop  # debe pasar (requiere ANTHROPIC_API_KEY)
```

## Qué validan los tests

- `iterations` está entre 1 y 10 (inclusive).
- Se hizo al menos 1 tool call.
- `finalMessage` contiene info sobre multiplicadores de costo de caching.
- `result.calls.length === userReturn.iterations` (el harness capturó cada llamada).

## Concepto extra

Para conectar múltiples servidores MCP simultáneamente:

```typescript
// Conectar dos servidores independientes
const client1 = new Client({ name: "client1", version: "1.0.0" });
await client1.connect(transport1);
const client2 = new Client({ name: "client2", version: "1.0.0" });
await client2.connect(transport2);

// Mergear los tool lists
const tools1 = await client1.listTools();
const tools2 = await client2.listTools();
const allTools = mcpToolsToAnthropicFormat([...tools1.tools, ...tools2.tools]);

// El dispatcher sabe qué cliente usar por el nombre de la tool
```
