# Ejercicio 02 — MCP Client Connect

## Concepto

Un cliente MCP es un **peer del protocolo**, no un cliente HTTP. No hace requests directos a URLs — le habla al servidor via JSON-RPC 2.0 sobre el transporte elegido.

Las dos operaciones clave del cliente:
- **`listTools()`** — descubrimiento: el cliente pregunta qué tools expone el servidor
- **`callTool()`** — invocación: el cliente ejecuta un tool específico con argumentos

El **patrón cleanup** es mandatorio. Si no cerrás el cliente (y el transporte subyacente), el test suite puede colgarse esperando que el transport finalice. Siempre retorná una función `cleanup` y llamala en `afterAll`.

InMemory vs Stdio: el código del cliente es idéntico — solo cambia el transporte que pasás a `client.connect()`.

## Docs y referencias

- Quickstart (cliente): https://modelcontextprotocol.io/quickstart/client
- Arquitectura: https://modelcontextprotocol.io/docs/concepts/architecture

## Tu tarea

Implementá `connectResearchClient()` en `starter.ts`:

1. Creá un par de transports con `InMemoryTransport.createLinkedPair()`.
2. Creá y conectá el research server al transport del servidor.
3. Creá un nuevo `Client({ name: "research-client", version: "1.0.0" })`.
4. Conectá el cliente al transport del cliente.
5. Retorná `{ client, cleanup }` donde `cleanup` cierra el cliente.

## Cómo verificar

```bash
AIDEV_TARGET=starter aidev verify 02-mcp-client-connect   # debe fallar
AIDEV_TARGET=solution aidev verify 02-mcp-client-connect  # debe pasar
```

## Qué validan los tests

- `listTools()` retorna exactamente **2 tools**.
- Los nombres son `search_docs` y `read_chunk` (cualquier orden).
- `callTool({ name: "search_docs", arguments: { query: "caching" } })` retorna `content[0].type === "text"`.

## Concepto extra

Para conectar un cliente a un servidor en subproceso (el patrón de producción):

```typescript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "path/to/server.ts"],
});
const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(transport);
// misma API: listTools(), callTool(), etc.
```

El servidor se lanza como subproceso y se comunica via stdin/stdout. Nunca uses `console.log` en el servidor — corrompe el stream.
