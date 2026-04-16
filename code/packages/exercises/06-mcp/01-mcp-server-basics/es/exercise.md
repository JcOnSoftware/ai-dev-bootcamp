# Ejercicio 01 — MCP Server Basics

## Concepto

MCP (Model Context Protocol) es un **protocolo**, no una librería. Usa JSON-RPC 2.0 sobre tres transportes posibles: `stdio` (para subprocesos), `SSE` (para HTTP), e `InMemoryTransport` (para tests). La elección del transporte no cambia la API del servidor ni del cliente.

Un servidor MCP expone tres primitivos:
- **Tools** — acciones que el cliente puede ejecutar
- **Resources** — datos que el cliente puede leer
- **Prompts** — templates de mensajes reutilizables

En este ejercicio construís un servidor de echo con un único tool.

**ADR crítico**: En tests usamos `InMemoryTransport.createLinkedPair()` — determinístico, sin subprocesos, sin cleanup de puertos. En producción usarías `StdioServerTransport`.

**NUNCA uses `console.log` en archivos de servidor MCP** — corrompe el stream JSON-RPC de stdio. Usá siempre `console.error`.

## Docs y referencias

- Quickstart (servidor): https://modelcontextprotocol.io/quickstart/server
- Arquitectura: https://modelcontextprotocol.io/docs/concepts/architecture

## Tu tarea

Implementá `buildEchoServer()` en `starter.ts`:

1. Creá un `new McpServer({ name: "echo-server", version: "1.0.0" })`.
2. Registrá un tool `"echo"` con `inputSchema: { text: z.string() }`.
3. El handler debe retornar `{ content: [{ type: "text", text }] }`.
4. Retorná el servidor (sin conectar — la conexión la hace el test).

## Cómo verificar

```bash
# Desde code/
AIDEV_TARGET=starter aidev verify 01-mcp-server-basics   # debe fallar
AIDEV_TARGET=solution aidev verify 01-mcp-server-basics  # debe pasar
```

O directamente con bun test:

```bash
AIDEV_TARGET=solution bun test packages/exercises/06-mcp/01-mcp-server-basics
```

## Qué validan los tests

- El servidor expone exactamente **1 tool**.
- El nombre del tool es `"echo"`.
- `callTool({ name: "echo", arguments: { text: "hello" } })` retorna `content[0].text === "hello"`.

## Concepto extra

Para conectar este servidor a Claude Desktop, agregá esta entrada en `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "echo-server": {
      "command": "bun",
      "args": ["run", "/ruta/a/solution.ts"]
    }
  }
}
```

Claude Desktop usará `StdioClientTransport` internamente para hablar con el servidor vía stdin/stdout.
